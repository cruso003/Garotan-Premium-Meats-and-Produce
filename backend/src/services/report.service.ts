import { Prisma, PaymentMethod, ProductCategory } from '@prisma/client';
import prisma from '../config/database';

export interface SalesSummary {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  totalDiscount: number;
}

export interface DashboardKPIs {
  today: {
    revenue: number;
    transactions: number;
    averageOrderValue: number;
    topSellingProducts: Array<{
      productId: string;
      productName: string;
      quantitySold: number;
      revenue: number;
    }>;
    lowStockCount: number;
  };
  thisMonth: {
    revenue: number;
    revenueGrowth: number; // Percentage vs last month
    newCustomers: number;
    activeSubscriptions: number;
    outstandingReceivables: number;
  };
  alerts: {
    lowStock: number;
    nearExpiry: number;
    failedDeliveries: number;
  };
}

export interface SalesByPeriod {
  date: string;
  revenue: number;
  transactions: number;
}

export interface SalesByProduct {
  productId: string;
  productName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

export interface SalesByCategory {
  category: string;
  revenue: number;
  transactions: number;
  percentageOfTotal: number;
}

export interface SalesByPaymentMethod {
  paymentMethod: string;
  revenue: number;
  transactions: number;
  percentageOfTotal: number;
}

export class ReportService {
  /**
   * Get sales summary for a date range
   */
  async getSalesSummary(
    startDate: Date,
    endDate: Date
  ): Promise<SalesSummary> {
    const transactions = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        isVoided: false,
      },
      select: {
        total: true,
        discount: true,
      },
    });

    const totalRevenue = transactions.reduce(
      (sum, txn) => sum + Number(txn.total),
      0
    );

    const totalDiscount = transactions.reduce(
      (sum, txn) => sum + Number(txn.discount),
      0
    );

    const totalTransactions = transactions.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalRevenue,
      totalTransactions,
      averageOrderValue,
      totalDiscount,
    };
  }

  /**
   * Get dashboard KPIs
   */
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's metrics
    const [todayTransactions, todayItems] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          transactionDate: {
            gte: todayStart,
            lt: todayEnd,
          },
          isVoided: false,
        },
        select: {
          total: true,
        },
      }),
      prisma.transactionItem.groupBy({
        by: ['productId'],
        where: {
          transaction: {
            transactionDate: {
              gte: todayStart,
              lt: todayEnd,
            },
            isVoided: false,
          },
        },
        _sum: {
          quantity: true,
          total: true,
        },
      }),
    ]);

    const todayRevenue = todayTransactions.reduce(
      (sum, txn) => sum + Number(txn.total),
      0
    );

    const todayAverageOrderValue =
      todayTransactions.length > 0
        ? todayRevenue / todayTransactions.length
        : 0;

    // Get top selling products today
    const topSellingProductsData = todayItems
      .sort((a, b) => Number(b._sum.quantity || 0) - Number(a._sum.quantity || 0))
      .slice(0, 5);

    const topSellingProducts = await Promise.all(
      topSellingProductsData.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        });

        return {
          productId: item.productId,
          productName: product?.name || 'Unknown',
          quantitySold: Number(item._sum.quantity || 0),
          revenue: Number(item._sum.total || 0),
        };
      })
    );

    // Low stock count
    const lowStockProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        stockBatches: {
          where: {
            quantity: { gt: 0 },
          },
        },
      },
    });

    const lowStockCount = lowStockProducts.filter((product) => {
      const totalStock = product.stockBatches.reduce(
        (sum, batch) => sum + Number(batch.quantity),
        0
      );
      return totalStock <= product.minStockLevel;
    }).length;

    // This month metrics
    const [thisMonthTransactions, lastMonthTransactions, newCustomers] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          transactionDate: {
            gte: monthStart,
          },
          isVoided: false,
        },
        select: {
          total: true,
        },
      }),
      prisma.transaction.findMany({
        where: {
          transactionDate: {
            gte: lastMonthStart,
            lt: lastMonthEnd,
          },
          isVoided: false,
        },
        select: {
          total: true,
        },
      }),
      prisma.customer.count({
        where: {
          createdAt: {
            gte: monthStart,
          },
        },
      }),
    ]);

    const thisMonthRevenue = thisMonthTransactions.reduce(
      (sum, txn) => sum + Number(txn.total),
      0
    );

    const lastMonthRevenue = lastMonthTransactions.reduce(
      (sum, txn) => sum + Number(txn.total),
      0
    );

    const revenueGrowth =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    // Active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
      },
    });

    // Outstanding receivables (B2B credit sales)
    const outstandingOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        paymentMethod: 'CREDIT',
      },
      select: {
        total: true,
      },
    });

    const outstandingReceivables = outstandingOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );

    // Alerts
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [nearExpiryCount, failedDeliveriesCount] = await Promise.all([
      prisma.stockBatch.count({
        where: {
          quantity: { gt: 0 },
          expiryDate: {
            lte: sevenDaysFromNow,
            gte: now,
          },
        },
      }),
      prisma.order.count({
        where: {
          status: 'FAILED',
        },
      }),
    ]);

    return {
      today: {
        revenue: todayRevenue,
        transactions: todayTransactions.length,
        averageOrderValue: todayAverageOrderValue,
        topSellingProducts,
        lowStockCount,
      },
      thisMonth: {
        revenue: thisMonthRevenue,
        revenueGrowth,
        newCustomers,
        activeSubscriptions,
        outstandingReceivables,
      },
      alerts: {
        lowStock: lowStockCount,
        nearExpiry: nearExpiryCount,
        failedDeliveries: failedDeliveriesCount,
      },
    };
  }

  /**
   * Get sales by period (daily, weekly, monthly)
   */
  async getSalesByPeriod(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<SalesByPeriod[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        isVoided: false,
      },
      select: {
        transactionDate: true,
        total: true,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

    // Group transactions by period
    const grouped: Record<string, { revenue: number; count: number }> = {};

    transactions.forEach((txn) => {
      let key: string;
      const date = new Date(txn.transactionDate);

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, count: 0 };
      }

      grouped[key].revenue += Number(txn.total);
      grouped[key].count += 1;
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        transactions: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get sales by product
   */
  async getSalesByProduct(
    startDate: Date,
    endDate: Date
  ): Promise<SalesByProduct[]> {
    const items = await prisma.transactionItem.groupBy({
      by: ['productId'],
      where: {
        transaction: {
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
          isVoided: false,
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
    });

    const salesByProduct = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            name: true,
            category: true,
            costPrice: true,
          },
        });

        const revenue = Number(item._sum.total || 0);
        const quantitySold = Number(item._sum.quantity || 0);
        const costPrice = Number(product?.costPrice || 0);
        const profit = revenue - costPrice * quantitySold;

        return {
          productId: item.productId,
          productName: product?.name || 'Unknown',
          category: product?.category || 'OTHER',
          quantitySold,
          revenue,
          profit,
        };
      })
    );

    return salesByProduct.sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get sales by category
   */
  async getSalesByCategory(
    startDate: Date,
    endDate: Date
  ): Promise<SalesByCategory[]> {
    const items = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
          isVoided: false,
        },
      },
      include: {
        product: {
          select: {
            category: true,
          },
        },
        transaction: {
          select: {
            id: true,
            total: true,
          },
        },
      },
    });

    // Group by category
    const grouped: Record<
      string,
      { revenue: number; transactionIds: Set<string> }
    > = {};

    items.forEach((item) => {
      const category = item.product.category;

      if (!grouped[category]) {
        grouped[category] = {
          revenue: 0,
          transactionIds: new Set(),
        };
      }

      grouped[category].revenue += Number(item.total);
      grouped[category].transactionIds.add(item.transaction.id);
    });

    const totalRevenue = Object.values(grouped).reduce(
      (sum, data) => sum + data.revenue,
      0
    );

    return Object.entries(grouped).map(([category, data]) => ({
      category,
      revenue: data.revenue,
      transactions: data.transactionIds.size,
      percentageOfTotal: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }));
  }

  /**
   * Get sales by payment method
   */
  async getSalesByPaymentMethod(
    startDate: Date,
    endDate: Date
  ): Promise<SalesByPaymentMethod[]> {
    const transactions = await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        isVoided: false,
      },
      _sum: {
        total: true,
      },
      _count: true,
    });

    const totalRevenue = transactions.reduce(
      (sum, txn) => sum + Number(txn._sum.total || 0),
      0
    );

    return transactions.map((txn) => ({
      paymentMethod: txn.paymentMethod,
      revenue: Number(txn._sum.total || 0),
      transactions: txn._count,
      percentageOfTotal:
        totalRevenue > 0 ? (Number(txn._sum.total || 0) / totalRevenue) * 100 : 0,
    }));
  }
}

export default new ReportService();
