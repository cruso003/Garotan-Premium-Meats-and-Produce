import prisma from '../config/database';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VOID'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'ADJUST'
  | 'RECEIVE';

export type EntityType =
  | 'User'
  | 'Product'
  | 'Customer'
  | 'Transaction'
  | 'StockBatch'
  | 'Inventory'
  | 'Supplier'
  | 'Category';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AuditFilters {
  userId?: string;
  action?: AuditAction;
  entityType?: EntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class AuditService {
  /**
   * Log an action to the audit trail
   */
  static async log(
    userId: string,
    action: AuditAction,
    entityType: EntityType,
    entityId: string,
    details?: string | object
  ): Promise<void> {
    try {
      // Convert object details to JSON string
      const detailsString = typeof details === 'object' ? JSON.stringify(details) : details;

      await prisma.activityLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          details: detailsString || null,
        },
      });
    } catch (error) {
      // Don't throw - audit logging should not break the main operation
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Get audit logs with filters
   */
  static async getLogs(filters: AuditFilters): Promise<{
    logs: AuditLogEntry[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      logs: logs as AuditLogEntry[],
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getEntityHistory(
    entityType: EntityType,
    entityId: string
  ): Promise<AuditLogEntry[]> {
    const logs = await prisma.activityLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs as AuditLogEntry[];
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserActivity(
    userId: string,
    limit: number = 100
  ): Promise<AuditLogEntry[]> {
    const logs = await prisma.activityLog.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs as AuditLogEntry[];
  }

  /**
   * Get activity summary (counts by action type)
   */
  static async getActivitySummary(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    action: string;
    count: number;
  }[]> {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const summary = await prisma.activityLog.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
    });

    return summary.map((item) => ({
      action: item.action,
      count: item._count.action,
    }));
  }

  /**
   * Get most active users
   */
  static async getMostActiveUsers(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    userId: string;
    userName: string;
    count: number;
  }[]> {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const userActivity = await prisma.activityLog.groupBy({
      by: ['userId'],
      where,
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: limit,
    });

    // Get user details
    const userIds = userActivity.map((item) => item.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    return userActivity.map((item) => {
      const user = users.find((u) => u.id === item.userId);
      return {
        userId: item.userId,
        userName: user?.name || 'Unknown User',
        count: item._count.userId,
      };
    });
  }

  /**
   * Clean up old audit logs (older than specified days)
   */
  static async cleanup(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}

export default AuditService;
