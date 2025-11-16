import { StockBatch, StockAdjustment, AdjustmentType, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { ApiError } from '../middlewares/errorHandler';

export interface ReceiveStockDTO {
  productId: string;
  quantity: number;
  expiryDate?: Date;
  supplier?: string;
  deliveryNote?: string;
}

export interface AdjustStockDTO {
  productId: string;
  batchId?: string;
  type: AdjustmentType;
  quantity: number;
  reason: string;
}

export interface StockBatchWithProduct extends StockBatch {
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
}

export interface ProductStockSummary {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  totalStock: number;
  minStockLevel: number;
  batches: Array<{
    batchId: string;
    quantity: number;
    expiryDate: Date | null;
    receivedDate: Date;
    daysUntilExpiry: number | null;
  }>;
}

export class InventoryService {
  /**
   * Receive new stock
   */
  async receiveStock(
    data: ReceiveStockDTO,
    userId: string
  ): Promise<StockBatch> {
    const { productId, quantity, expiryDate, supplier, deliveryNote } = data;

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    // Create stock batch
    const stockBatch = await prisma.stockBatch.create({
      data: {
        productId,
        quantity: new Prisma.Decimal(quantity),
        expiryDate,
        supplier: supplier || product.supplier || 'Unknown',
        deliveryNote,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'StockBatch',
        entityId: stockBatch.id,
        details: `Received ${quantity} units of ${product.name}`,
      },
    });

    return stockBatch;
  }

  /**
   * Adjust stock (spoilage, corrections, etc.)
   */
  async adjustStock(
    data: AdjustStockDTO,
    userId: string
  ): Promise<StockAdjustment> {
    const { productId, batchId, type, quantity, reason } = data;

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        stockBatches: {
          where: {
            quantity: { gt: 0 },
          },
          orderBy: {
            expiryDate: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    let targetBatchId = batchId;

    // If no batch specified, use FIFO (oldest expiry)
    if (!targetBatchId && product.stockBatches.length > 0) {
      targetBatchId = product.stockBatches[0].id;
    }

    // Validate batch if specified
    if (targetBatchId) {
      const batch = await prisma.stockBatch.findUnique({
        where: { id: targetBatchId },
      });

      if (!batch || batch.productId !== productId) {
        throw new ApiError(404, 'Stock batch not found or does not belong to this product');
      }

      // Check if sufficient stock for deduction
      if (quantity > 0 && Number(batch.quantity) < quantity) {
        throw new ApiError(400, `Insufficient stock in batch. Available: ${batch.quantity}`);
      }
    }

    // Create adjustment and update batch in a transaction
    const adjustment = await prisma.$transaction(async (tx) => {
      // Create adjustment record
      const newAdjustment = await tx.stockAdjustment.create({
        data: {
          productId,
          batchId: targetBatchId || null,
          type,
          quantity: new Prisma.Decimal(quantity),
          reason,
          approvedBy: userId,
        },
      });

      // Update batch quantity if batch specified
      if (targetBatchId) {
        await tx.stockBatch.update({
          where: { id: targetBatchId },
          data: {
            quantity: {
              decrement: new Prisma.Decimal(quantity),
            },
          },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId,
          action: 'CREATE',
          entityType: 'StockAdjustment',
          entityId: newAdjustment.id,
          details: `${type}: ${quantity} units of ${product.name} - ${reason}`,
        },
      });

      return newAdjustment;
    });

    return adjustment;
  }

  /**
   * Get stock batches for a product (FIFO order)
   */
  async getProductBatches(productId: string): Promise<StockBatchWithProduct[]> {
    const batches = await prisma.stockBatch.findMany({
      where: {
        productId,
        quantity: { gt: 0 },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc', // FIFO by expiry date
      },
    });

    return batches;
  }

  /**
   * Get all stock batches with filters
   */
  async getAllBatches(filters: {
    productId?: string;
    expiryBefore?: Date;
    hasStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ batches: StockBatchWithProduct[]; total: number }> {
    const { productId, expiryBefore, hasStock = true, page = 1, limit = 50 } = filters;

    const where: Prisma.StockBatchWhereInput = {
      ...(productId && { productId }),
      ...(expiryBefore && {
        expiryDate: {
          lte: expiryBefore,
        },
      }),
      ...(hasStock && {
        quantity: { gt: 0 },
      }),
    };

    const [batches, total] = await Promise.all([
      prisma.stockBatch.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
            },
          },
        },
        orderBy: {
          expiryDate: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockBatch.count({ where }),
    ]);

    return { batches, total };
  }

  /**
   * Get near-expiry products
   */
  async getNearExpiryProducts(daysThreshold = 7): Promise<StockBatchWithProduct[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return prisma.stockBatch.findMany({
      where: {
        quantity: { gt: 0 },
        expiryDate: {
          lte: thresholdDate,
          gte: new Date(), // Not already expired
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });
  }

  /**
   * Get expired products
   */
  async getExpiredProducts(): Promise<StockBatchWithProduct[]> {
    return prisma.stockBatch.findMany({
      where: {
        quantity: { gt: 0 },
        expiryDate: {
          lt: new Date(),
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });
  }

  /**
   * Get low stock products (below minimum level)
   */
  async getLowStockProducts() {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        stockBatches: {
          where: {
            quantity: { gt: 0 },
          },
        },
      },
    });

    return products
      .map((product) => {
        const totalStock = product.stockBatches.reduce(
          (sum, batch) => sum + Number(batch.quantity),
          0
        );
        return {
          ...product,
          currentStock: totalStock,
        };
      })
      .filter((product) => product.currentStock <= product.minStockLevel)
      .sort((a, b) => a.currentStock - b.currentStock);
  }

  /**
   * Get stock summary for all products
   */
  async getStockSummary(): Promise<ProductStockSummary[]> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        stockBatches: {
          where: {
            quantity: { gt: 0 },
          },
          orderBy: {
            expiryDate: 'asc',
          },
        },
      },
    });

    return products.map((product) => {
      const totalStock = product.stockBatches.reduce(
        (sum, batch) => sum + Number(batch.quantity),
        0
      );

      const now = new Date();

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        totalStock,
        minStockLevel: product.minStockLevel,
        batches: product.stockBatches.map((batch) => {
          const daysUntilExpiry = batch.expiryDate
            ? Math.ceil(
                (batch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              )
            : null;

          return {
            batchId: batch.id,
            quantity: Number(batch.quantity),
            expiryDate: batch.expiryDate,
            receivedDate: batch.receivedDate,
            daysUntilExpiry,
          };
        }),
      };
    });
  }

  /**
   * Get stock adjustments history
   */
  async getAdjustmentHistory(filters: {
    productId?: string;
    type?: AdjustmentType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ adjustments: StockAdjustment[]; total: number }> {
    const { productId, type, startDate, endDate, page = 1, limit = 50 } = filters;

    const where: Prisma.StockAdjustmentWhereInput = {
      ...(productId && { productId }),
      ...(type && { type }),
      ...(startDate && endDate && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockAdjustment.count({ where }),
    ]);

    return { adjustments, total };
  }

  /**
   * Get stock valuation
   */
  async getStockValuation(): Promise<{
    totalValue: number;
    valueByCategory: Record<string, number>;
  }> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        stockBatches: {
          where: {
            quantity: { gt: 0 },
          },
        },
      },
    });

    let totalValue = 0;
    const valueByCategory: Record<string, number> = {};

    for (const product of products) {
      const productStock = product.stockBatches.reduce(
        (sum, batch) => sum + Number(batch.quantity),
        0
      );

      const productValue = productStock * Number(product.costPrice);
      totalValue += productValue;

      if (!valueByCategory[product.category]) {
        valueByCategory[product.category] = 0;
      }
      valueByCategory[product.category] += productValue;
    }

    return {
      totalValue,
      valueByCategory,
    };
  }
}

export default new InventoryService();
