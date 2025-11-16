import { Customer, CustomerType, LoyaltyTier, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { ApiError } from '../middlewares/errorHandler';

export interface CreateCustomerDTO {
  name: string;
  phone: string;
  email?: string;
  customerType?: CustomerType;
  address?: string;
  assignedSalesRep?: string;
  birthday?: Date;
  creditLimit?: number;
  paymentTermsDays?: number;
}

export interface UpdateCustomerDTO extends Partial<CreateCustomerDTO> {
  isActive?: boolean;
}

export interface CustomerFilters {
  search?: string;
  customerType?: CustomerType;
  loyaltyTier?: LoyaltyTier;
  isActive?: boolean;
  assignedSalesRep?: string;
}

export interface CustomerWithStats extends Customer {
  stats: {
    totalSpent: number;
    totalTransactions: number;
    lastPurchaseDate: Date | null;
    averageOrderValue: number;
  };
}

export interface PurchaseHistory {
  transactionId: string;
  transactionNumber: string;
  date: Date;
  total: number;
  itemCount: number;
  paymentMethod: string;
}

export class CustomerService {
  /**
   * Get all customers with filters and pagination
   */
  async getCustomers(
    filters: CustomerFilters = {},
    page = 1,
    limit = 50
  ): Promise<{ customers: Customer[]; total: number }> {
    const { search, customerType, loyaltyTier, isActive, assignedSalesRep } = filters;

    const where: Prisma.CustomerWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(customerType && { customerType }),
      ...(loyaltyTier && { loyaltyTier }),
      ...(isActive !== undefined && { isActive }),
      ...(assignedSalesRep && { assignedSalesRep }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          salesRep: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, total };
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string): Promise<Customer> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        salesRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    return customer;
  }

  /**
   * Get customer by phone number
   */
  async getCustomerByPhone(phone: string): Promise<Customer> {
    const customer = await prisma.customer.findUnique({
      where: { phone },
      include: {
        salesRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    return customer;
  }

  /**
   * Get customer with statistics
   */
  async getCustomerWithStats(id: string): Promise<CustomerWithStats> {
    const customer = await this.getCustomerById(id);

    // Get transaction statistics
    const transactions = await prisma.transaction.findMany({
      where: {
        customerId: id,
        isVoided: false,
      },
      select: {
        total: true,
        transactionDate: true,
      },
    });

    const totalSpent = transactions.reduce(
      (sum, txn) => sum + Number(txn.total),
      0
    );
    const totalTransactions = transactions.length;
    const lastPurchaseDate =
      transactions.length > 0
        ? transactions.sort(
            (a, b) => b.transactionDate.getTime() - a.transactionDate.getTime()
          )[0].transactionDate
        : null;
    const averageOrderValue = totalTransactions > 0 ? totalSpent / totalTransactions : 0;

    return {
      ...customer,
      stats: {
        totalSpent,
        totalTransactions,
        lastPurchaseDate,
        averageOrderValue,
      },
    };
  }

  /**
   * Create new customer
   */
  async createCustomer(data: CreateCustomerDTO): Promise<Customer> {
    // Check if phone already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: data.phone },
    });

    if (existingCustomer) {
      throw new ApiError(400, 'Customer with this phone number already exists');
    }

    // Validate sales rep if provided
    if (data.assignedSalesRep) {
      const salesRep = await prisma.user.findUnique({
        where: { id: data.assignedSalesRep },
      });

      if (!salesRep || salesRep.role !== 'SALES_MANAGER') {
        throw new ApiError(400, 'Invalid sales representative');
      }
    }

    return prisma.customer.create({
      data: {
        ...data,
        ...(data.creditLimit && {
          creditLimit: new Prisma.Decimal(data.creditLimit),
        }),
      },
      include: {
        salesRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Update customer
   */
  async updateCustomer(id: string, data: UpdateCustomerDTO): Promise<Customer> {
    // Check if customer exists
    await this.getCustomerById(id);

    // If phone is being updated, check uniqueness
    if (data.phone) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          phone: data.phone,
          NOT: { id },
        },
      });

      if (existingCustomer) {
        throw new ApiError(400, 'Customer with this phone number already exists');
      }
    }

    // Validate sales rep if provided
    if (data.assignedSalesRep) {
      const salesRep = await prisma.user.findUnique({
        where: { id: data.assignedSalesRep },
      });

      if (!salesRep || salesRep.role !== 'SALES_MANAGER') {
        throw new ApiError(400, 'Invalid sales representative');
      }
    }

    return prisma.customer.update({
      where: { id },
      data: {
        ...data,
        ...(data.creditLimit !== undefined && {
          creditLimit: new Prisma.Decimal(data.creditLimit),
        }),
      },
      include: {
        salesRep: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(id: string): Promise<void> {
    await this.getCustomerById(id);

    await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get customer purchase history
   */
  async getPurchaseHistory(
    customerId: string,
    page = 1,
    limit = 20
  ): Promise<{ history: PurchaseHistory[]; total: number }> {
    // Verify customer exists
    await this.getCustomerById(customerId);

    const where = {
      customerId,
      isVoided: false,
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          items: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    const history: PurchaseHistory[] = transactions.map((txn) => ({
      transactionId: txn.id,
      transactionNumber: txn.transactionNumber,
      date: txn.transactionDate,
      total: Number(txn.total),
      itemCount: txn.items.length,
      paymentMethod: txn.paymentMethod,
    }));

    return { history, total };
  }

  /**
   * Redeem loyalty points
   */
  async redeemLoyaltyPoints(
    customerId: string,
    points: number,
    description: string
  ): Promise<Customer> {
    const customer = await this.getCustomerById(customerId);

    if (customer.loyaltyPoints < points) {
      throw new ApiError(400, 'Insufficient loyalty points');
    }

    // Update customer and create loyalty transaction
    await prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            decrement: points,
          },
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          customerId,
          type: 'REDEEMED',
          points: -points,
          description,
        },
      });
    });

    return this.getCustomerById(customerId);
  }

  /**
   * Adjust loyalty points (manual adjustment)
   */
  async adjustLoyaltyPoints(
    customerId: string,
    points: number,
    description: string
  ): Promise<Customer> {
    const customer = await this.getCustomerById(customerId);

    // Prevent negative balance
    if (customer.loyaltyPoints + points < 0) {
      throw new ApiError(400, 'Adjustment would result in negative points balance');
    }

    await prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            increment: points,
          },
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          customerId,
          type: 'ADJUSTMENT',
          points,
          description,
        },
      });
    });

    return this.getCustomerById(customerId);
  }

  /**
   * Get loyalty transaction history
   */
  async getLoyaltyHistory(
    customerId: string,
    page = 1,
    limit = 20
  ): Promise<{
    history: Array<{
      id: string;
      type: string;
      points: number;
      description: string | null;
      createdAt: Date;
    }>;
    total: number;
  }> {
    // Verify customer exists
    await this.getCustomerById(customerId);

    const where = { customerId };

    const [history, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.loyaltyTransaction.count({ where }),
    ]);

    return { history, total };
  }

  /**
   * Update customer loyalty tier based on points
   */
  async updateLoyaltyTier(customerId: string): Promise<Customer> {
    const customer = await this.getCustomerById(customerId);

    let newTier: LoyaltyTier;

    // Tier thresholds
    if (customer.loyaltyPoints >= 500) {
      newTier = 'GOLD';
    } else if (customer.loyaltyPoints >= 200) {
      newTier = 'SILVER';
    } else {
      newTier = 'BRONZE';
    }

    if (newTier !== customer.loyaltyTier) {
      return prisma.customer.update({
        where: { id: customerId },
        data: { loyaltyTier: newTier },
      });
    }

    return customer;
  }

  /**
   * Get customers by segment
   */
  async getCustomersBySegment(segment: string): Promise<Customer[]> {
    let where: Prisma.CustomerWhereInput = {};

    switch (segment) {
      case 'vip':
        where = { loyaltyTier: 'GOLD', isActive: true };
        break;
      case 'regular':
        where = { loyaltyTier: { in: ['SILVER', 'BRONZE'] }, isActive: true };
        break;
      case 'b2b':
        where = {
          customerType: { in: ['B2B_RESTAURANT', 'B2B_HOTEL', 'B2B_INSTITUTION'] },
          isActive: true,
        };
        break;
      case 'retail':
        where = { customerType: 'RETAIL', isActive: true };
        break;
      default:
        throw new ApiError(400, 'Invalid segment');
    }

    return prisma.customer.findMany({
      where,
      orderBy: { loyaltyPoints: 'desc' },
    });
  }
}

export default new CustomerService();
