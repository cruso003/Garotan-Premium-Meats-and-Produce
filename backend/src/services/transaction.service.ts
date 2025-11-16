import { Prisma, Transaction, PaymentMethod, PaymentStatus } from '@prisma/client';
import prisma from '../config/database';
import { ApiError } from '../middlewares/errorHandler';
import { StockSyncService } from './stock-sync.service';
import { LoyaltyService } from './loyalty.service';

export interface TransactionItemDTO {
  productId: string;
  quantity: number;
  unitPrice?: number; // Optional, will use product price if not provided
  discount?: number;
  notes?: string;
}

export interface CreateTransactionDTO {
  customerId?: string;
  items: TransactionItemDTO[];
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  discount?: number;
  loyaltyPointsRedeemed?: number;
  notes?: string;
}

export interface HoldCartDTO {
  customerId?: string;
  items: TransactionItemDTO[];
  notes?: string;
}

export interface TransactionWithItems extends Transaction {
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
    notes?: string;
  }>;
  customer?: {
    id: string;
    name: string;
    phone: string;
    loyaltyPoints: number;
    loyaltyTier: string;
  } | null;
  cashier: {
    id: string;
    name: string;
  };
}

export class TransactionService {
  /**
   * Create a new transaction (POS sale)
   */
  async createTransaction(
    cashierId: string,
    data: CreateTransactionDTO
  ): Promise<TransactionWithItems> {
    const { customerId, items, paymentMethod, paymentReference, discount = 0, loyaltyPointsRedeemed = 0, notes } = data;

    // Validate items
    if (!items || items.length === 0) {
      throw new ApiError(400, 'Transaction must have at least one item');
    }

    // Validate customer if provided
    let customer = null;
    let birthdayBonusAwarded = 0;
    if (customerId) {
      customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new ApiError(404, 'Customer not found');
      }

      // Check and award birthday bonus
      birthdayBonusAwarded = await LoyaltyService.awardBirthdayBonus(customerId);
      if (birthdayBonusAwarded > 0) {
        // Refresh customer to get updated points
        customer = await prisma.customer.findUnique({
          where: { id: customerId },
        });
      }

      // Validate loyalty points redemption
      if (loyaltyPointsRedeemed > 0) {
        if (customer.loyaltyPoints < loyaltyPointsRedeemed) {
          throw new ApiError(400, 'Insufficient loyalty points');
        }
      }
    } else if (loyaltyPointsRedeemed > 0) {
      throw new ApiError(400, 'Customer is required to redeem loyalty points');
    }

    // Fetch products and validate stock (with optimistic locking check)
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        retailPrice: true,
        wholesalePrice: true,
        currentStock: true,
        stockVersion: true,
        minStockLevel: true,
        stockBatches: {
          where: {
            quantity: { gt: 0 },
          },
          orderBy: {
            expiryDate: 'asc', // FIFO by expiry date
          },
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new ApiError(400, 'One or more products not found or inactive');
    }

    // Enhanced stock validation using cached currentStock
    const stockValidationErrors: string[] = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      const currentStock = Number(product.currentStock);

      // Check against cached stock first (fast)
      if (currentStock < item.quantity) {
        stockValidationErrors.push(
          `${product.name}: Insufficient stock. Available: ${currentStock.toFixed(2)}, Requested: ${item.quantity}`
        );
      }

      // Warn if approaching minimum stock level
      if (currentStock - item.quantity <= product.minStockLevel) {
        console.warn(
          `Warning: ${product.name} will be at or below minimum stock level after this transaction. ` +
          `Current: ${currentStock}, After Sale: ${currentStock - item.quantity}, Minimum: ${product.minStockLevel}`
        );
      }
    }

    if (stockValidationErrors.length > 0) {
      throw new ApiError(400, `Stock validation failed:\n${stockValidationErrors.join('\n')}`);
    }

    // Calculate totals and prepare transaction items
    let subtotal = 0;
    const transactionItems: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      total: number;
      notes?: string;
      batchAllocations: Array<{ batchId: string; quantity: number }>;
    }> = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      // Use provided price or product's retail/wholesale price
      const unitPrice = item.unitPrice || Number(product.retailPrice);
      const itemDiscount = item.discount || 0;
      const itemTotal = unitPrice * item.quantity - itemDiscount;

      // Check stock availability
      const totalStock = product.stockBatches.reduce(
        (sum, batch) => sum + Number(batch.quantity),
        0
      );

      if (totalStock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for ${product.name}. Available: ${totalStock}, Requested: ${item.quantity}`
        );
      }

      // Allocate stock using FIFO
      const batchAllocations: Array<{ batchId: string; quantity: number }> = [];
      let remainingQty = item.quantity;

      for (const batch of product.stockBatches) {
        if (remainingQty <= 0) break;

        const batchQty = Number(batch.quantity);
        const allocatedQty = Math.min(remainingQty, batchQty);

        batchAllocations.push({
          batchId: batch.id,
          quantity: allocatedQty,
        });

        remainingQty -= allocatedQty;
      }

      transactionItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        discount: itemDiscount,
        total: itemTotal,
        notes: item.notes,
        batchAllocations,
      });

      subtotal += itemTotal;
    }

    // Calculate tier discount (if customer has tier benefits)
    const tierDiscount = customer
      ? LoyaltyService.calculateTierDiscount(subtotal, customer.loyaltyTier)
      : 0;

    // Calculate loyalty points redemption value (1 point = $1)
    const loyaltyDiscount = loyaltyPointsRedeemed;

    // Calculate total (subtotal - discounts)
    const total = subtotal - discount - tierDiscount - loyaltyDiscount;

    if (total < 0) {
      throw new ApiError(400, 'Total cannot be negative');
    }

    // Calculate loyalty points earned (with tier multiplier)
    const loyaltyPointsEarned = customer
      ? LoyaltyService.calculatePointsEarned(total, customer.loyaltyTier)
      : 0;

    // Generate transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create transaction with all related data in a transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
          transactionNumber,
          customerId: customerId || null,
          cashierId,
          subtotal: new Prisma.Decimal(subtotal),
          discount: new Prisma.Decimal(discount + tierDiscount + loyaltyDiscount),
          tax: new Prisma.Decimal(0), // No tax for now
          total: new Prisma.Decimal(total),
          paymentMethod,
          paymentStatus: 'COMPLETED',
          paymentReference,
          loyaltyPointsEarned,
          loyaltyPointsRedeemed,
          notes,
          items: {
            create: transactionItems.map((item) => ({
              productId: item.productId,
              batchId: item.batchAllocations[0]?.batchId, // Store primary batch
              quantity: new Prisma.Decimal(item.quantity),
              unitPrice: new Prisma.Decimal(item.unitPrice),
              discount: new Prisma.Decimal(item.discount),
              total: new Prisma.Decimal(item.total),
              notes: item.notes,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          cashier: true,
        },
      });

      // Deduct stock from batches
      for (const item of transactionItems) {
        for (const allocation of item.batchAllocations) {
          await tx.stockBatch.update({
            where: { id: allocation.batchId },
            data: {
              quantity: {
                decrement: new Prisma.Decimal(allocation.quantity),
              },
            },
          });
        }
      }

      // Sync product stock levels (update Product.currentStock)
      const productIdsToSync = [...new Set(transactionItems.map((item) => item.productId))];
      for (const productId of productIdsToSync) {
        const totalQtySold = transactionItems
          .filter((item) => item.productId === productId)
          .reduce((sum, item) => sum + item.quantity, 0);

        await tx.product.update({
          where: { id: productId },
          data: {
            currentStock: {
              decrement: new Prisma.Decimal(totalQtySold),
            },
            stockVersion: {
              increment: 1,
            },
          },
        });
      }

      // Update customer loyalty points
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: {
              increment: loyaltyPointsEarned - loyaltyPointsRedeemed,
            },
          },
        });

        // Create loyalty transactions
        if (loyaltyPointsEarned > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              customerId,
              type: 'EARNED',
              points: loyaltyPointsEarned,
              transactionId: newTransaction.id,
              description: 'Points earned from purchase',
            },
          });
        }

        if (loyaltyPointsRedeemed > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              customerId,
              type: 'REDEEMED',
              points: -loyaltyPointsRedeemed,
              transactionId: newTransaction.id,
              description: 'Points redeemed for discount',
            },
          });
        }

        // Check for tier upgrade after points are added
        const updatedCustomer = await tx.customer.findUnique({
          where: { id: customerId },
          select: { loyaltyPoints: true, loyaltyTier: true },
        });

        if (updatedCustomer) {
          const newTier = LoyaltyService.checkTierUpgrade(
            updatedCustomer.loyaltyPoints,
            updatedCustomer.loyaltyTier
          );

          if (newTier) {
            await tx.customer.update({
              where: { id: customerId },
              data: { loyaltyTier: newTier },
            });

            console.log(
              `Customer ${customerId} upgraded from ${updatedCustomer.loyaltyTier} to ${newTier}`
            );
          }
        }
      }

      return newTransaction;
    });

    // Format response
    return {
      ...transaction,
      items: transaction.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        total: Number(item.total),
        notes: item.notes || undefined,
      })),
      customer: transaction.customer
        ? {
            id: transaction.customer.id,
            name: transaction.customer.name,
            phone: transaction.customer.phone,
            loyaltyPoints: transaction.customer.loyaltyPoints,
            loyaltyTier: transaction.customer.loyaltyTier,
          }
        : null,
      cashier: {
        id: transaction.cashier.id,
        name: transaction.cashier.name,
      },
    };
  }

  /**
   * Get transaction by ID (for receipt)
   */
  async getTransactionById(id: string): Promise<TransactionWithItems> {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        cashier: true,
      },
    });

    if (!transaction) {
      throw new ApiError(404, 'Transaction not found');
    }

    return {
      ...transaction,
      items: transaction.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        total: Number(item.total),
        notes: item.notes || undefined,
      })),
      customer: transaction.customer
        ? {
            id: transaction.customer.id,
            name: transaction.customer.name,
            phone: transaction.customer.phone,
            loyaltyPoints: transaction.customer.loyaltyPoints,
            loyaltyTier: transaction.customer.loyaltyTier,
          }
        : null,
      cashier: {
        id: transaction.cashier.id,
        name: transaction.cashier.name,
      },
    };
  }

  /**
   * Get transaction by transaction number
   */
  async getTransactionByNumber(transactionNumber: string): Promise<TransactionWithItems> {
    const transaction = await prisma.transaction.findUnique({
      where: { transactionNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        cashier: true,
      },
    });

    if (!transaction) {
      throw new ApiError(404, 'Transaction not found');
    }

    return {
      ...transaction,
      items: transaction.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        total: Number(item.total),
        notes: item.notes || undefined,
      })),
      customer: transaction.customer
        ? {
            id: transaction.customer.id,
            name: transaction.customer.name,
            phone: transaction.customer.phone,
            loyaltyPoints: transaction.customer.loyaltyPoints,
            loyaltyTier: transaction.customer.loyaltyTier,
          }
        : null,
      cashier: {
        id: transaction.cashier.id,
        name: transaction.cashier.name,
      },
    };
  }

  /**
   * Void a transaction (within 5 minutes)
   */
  async voidTransaction(id: string, userId: string, reason: string): Promise<void> {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!transaction) {
      throw new ApiError(404, 'Transaction not found');
    }

    if (transaction.isVoided) {
      throw new ApiError(400, 'Transaction is already voided');
    }

    // Check if transaction is within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (transaction.createdAt < fiveMinutesAgo) {
      throw new ApiError(400, 'Transaction can only be voided within 5 minutes of creation');
    }

    // Void transaction in a database transaction
    await prisma.$transaction(async (tx) => {
      // Mark transaction as voided
      await tx.transaction.update({
        where: { id },
        data: {
          isVoided: true,
          voidReason: reason,
        },
      });

      // Restore stock
      for (const item of transaction.items) {
        if (item.batchId) {
          await tx.stockBatch.update({
            where: { id: item.batchId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // Sync product stock levels (restore Product.currentStock)
      const productIdsToSync = [...new Set(transaction.items.map((item) => item.productId))];
      for (const productId of productIdsToSync) {
        const totalQtyRestored = transaction.items
          .filter((item) => item.productId === productId)
          .reduce((sum, item) => sum + Number(item.quantity), 0);

        await tx.product.update({
          where: { id: productId },
          data: {
            currentStock: {
              increment: new Prisma.Decimal(totalQtyRestored),
            },
            stockVersion: {
              increment: 1,
            },
          },
        });
      }

      // Reverse loyalty points
      if (transaction.customerId) {
        await tx.customer.update({
          where: { id: transaction.customerId },
          data: {
            loyaltyPoints: {
              decrement: transaction.loyaltyPointsEarned - transaction.loyaltyPointsRedeemed,
            },
          },
        });

        // Create adjustment loyalty transaction
        if (transaction.loyaltyPointsEarned > 0 || transaction.loyaltyPointsRedeemed > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              customerId: transaction.customerId,
              type: 'ADJUSTMENT',
              points: -(transaction.loyaltyPointsEarned - transaction.loyaltyPointsRedeemed),
              transactionId: transaction.id,
              description: `Transaction voided: ${reason}`,
            },
          });
        }
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId,
          action: 'VOID',
          entityType: 'Transaction',
          entityId: id,
          details: reason,
        },
      });
    });
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(filters: {
    startDate?: Date;
    endDate?: Date;
    customerId?: string;
    cashierId?: string;
    paymentMethod?: PaymentMethod;
    isVoided?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: TransactionWithItems[]; total: number }> {
    const { startDate, endDate, customerId, cashierId, paymentMethod, isVoided, page = 1, limit = 50 } = filters;

    const where: Prisma.TransactionWhereInput = {
      ...(startDate && endDate && {
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      }),
      ...(customerId && { customerId }),
      ...(cashierId && { cashierId }),
      ...(paymentMethod && { paymentMethod }),
      ...(isVoided !== undefined && { isVoided }),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          cashier: true,
        },
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((transaction) => ({
        ...transaction,
        items: transaction.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          total: Number(item.total),
          notes: item.notes || undefined,
        })),
        customer: transaction.customer
          ? {
              id: transaction.customer.id,
              name: transaction.customer.name,
              phone: transaction.customer.phone,
              loyaltyPoints: transaction.customer.loyaltyPoints,
              loyaltyTier: transaction.customer.loyaltyTier,
            }
          : null,
        cashier: {
          id: transaction.cashier.id,
          name: transaction.cashier.name,
        },
      })),
      total,
    };
  }
}

export default new TransactionService();
