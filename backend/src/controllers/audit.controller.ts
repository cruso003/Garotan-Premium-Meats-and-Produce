import { Request, Response } from 'express';
import { AuditService, AuditFilters } from '../services/audit.service';
import { asyncHandler } from '../middlewares/errorHandler';

export class AuditController {
  /**
   * Get audit logs with filters
   */
  getLogs = asyncHandler(async (req: Request, res: Response) => {
    const filters: AuditFilters = {
      userId: req.query.userId as string,
      action: req.query.action as any,
      entityType: req.query.entityType as any,
      entityId: req.query.entityId as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    };

    const result = await AuditService.getLogs(filters);

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page: result.page,
        limit: filters.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  });

  /**
   * Get audit history for a specific entity
   */
  getEntityHistory = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;

    const logs = await AuditService.getEntityHistory(entityType as any, entityId);

    res.json({
      success: true,
      data: logs,
    });
  });

  /**
   * Get user activity
   */
  getUserActivity = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const logs = await AuditService.getUserActivity(userId, limit);

    res.json({
      success: true,
      data: logs,
    });
  });

  /**
   * Get activity summary
   */
  getActivitySummary = asyncHandler(async (req: Request, res: Response) => {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const summary = await AuditService.getActivitySummary(startDate, endDate);

    res.json({
      success: true,
      data: summary,
    });
  });

  /**
   * Get most active users
   */
  getMostActiveUsers = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const users = await AuditService.getMostActiveUsers(limit, startDate, endDate);

    res.json({
      success: true,
      data: users,
    });
  });
}

export default new AuditController();
