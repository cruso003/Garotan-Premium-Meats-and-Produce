import { Request, Response } from 'express';
import reportService from '../services/report.service';
import { asyncHandler } from '../middlewares/errorHandler';
import { ApiError } from '../middlewares/errorHandler';

export class ReportController {
  /**
   * GET /api/reports/sales/summary
   * Get sales summary for a date range
   */
  getSalesSummary = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new ApiError(400, 'Start date and end date are required');
    }

    const summary = await reportService.getSalesSummary(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json({
      success: true,
      data: summary,
    });
  });

  /**
   * GET /api/reports/dashboard
   * Get dashboard KPIs
   */
  getDashboardKPIs = asyncHandler(async (_req: Request, res: Response) => {
    const kpis = await reportService.getDashboardKPIs();

    res.status(200).json({
      success: true,
      data: kpis,
    });
  });

  /**
   * GET /api/reports/sales/by-period
   * Get sales by period (daily, weekly, monthly)
   */
  getSalesByPeriod = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      throw new ApiError(400, 'Start date and end date are required');
    }

    if (!['day', 'week', 'month'].includes(groupBy as string)) {
      throw new ApiError(400, 'Group by must be day, week, or month');
    }

    const sales = await reportService.getSalesByPeriod(
      new Date(startDate as string),
      new Date(endDate as string),
      groupBy as 'day' | 'week' | 'month'
    );

    res.status(200).json({
      success: true,
      data: sales,
    });
  });

  /**
   * GET /api/reports/sales/by-product
   * Get sales by product
   */
  getSalesByProduct = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new ApiError(400, 'Start date and end date are required');
    }

    const sales = await reportService.getSalesByProduct(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json({
      success: true,
      data: sales,
    });
  });

  /**
   * GET /api/reports/sales/by-category
   * Get sales by category
   */
  getSalesByCategory = asyncHandler(async (req: Request, res: Response) => {
    let startDate: Date;
    let endDate: Date;

    // Use provided dates or default to last 30 days
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate as string);
      endDate = new Date(req.query.endDate as string);
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
    }

    const sales = await reportService.getSalesByCategory(
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: sales,
    });
  });

  /**
   * GET /api/reports/sales/by-payment-method
   * Get sales by payment method
   */
  getSalesByPaymentMethod = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new ApiError(400, 'Start date and end date are required');
    }

    const sales = await reportService.getSalesByPaymentMethod(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json({
      success: true,
      data: sales,
    });
  });

  /**
   * GET /api/reports/sales-trends
   * Get sales trends for a period (week, month, year)
   */
  getSalesTrends = asyncHandler(async (req: Request, res: Response) => {
    const period = (req.query.period as string) || 'month';

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const sales = await reportService.getSalesByPeriod(
      startDate,
      endDate,
      period === 'year' ? 'month' : 'day'
    );

    res.status(200).json({
      success: true,
      data: sales,
    });
  });
}

export default new ReportController();
