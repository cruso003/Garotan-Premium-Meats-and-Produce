import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// All report routes require authentication
router.use(authenticate);

// Most reports are accessible by managers and admin
const reportRoles = ['ADMIN', 'STORE_MANAGER', 'SALES_MANAGER', 'ACCOUNTANT'];

/**
 * GET /api/reports/dashboard
 * Get dashboard KPIs
 */
router.get(
  '/dashboard',
  authorize(...reportRoles),
  reportController.getDashboardKPIs
);

/**
 * GET /api/reports/sales/summary
 * Get sales summary for a date range
 */
router.get(
  '/sales/summary',
  authorize(...reportRoles),
  reportController.getSalesSummary
);

/**
 * GET /api/reports/sales/by-period
 * Get sales by period (daily, weekly, monthly)
 */
router.get(
  '/sales/by-period',
  authorize(...reportRoles),
  reportController.getSalesByPeriod
);

/**
 * GET /api/reports/sales/by-product
 * Get sales by product
 */
router.get(
  '/sales/by-product',
  authorize(...reportRoles),
  reportController.getSalesByProduct
);

/**
 * GET /api/reports/sales/by-category
 * Get sales by category
 */
router.get(
  '/sales/by-category',
  authorize(...reportRoles),
  reportController.getSalesByCategory
);

/**
 * GET /api/reports/sales/by-payment-method
 * Get sales by payment method
 */
router.get(
  '/sales/by-payment-method',
  authorize(...reportRoles),
  reportController.getSalesByPaymentMethod
);

/**
 * GET /api/reports/sales-trends
 * Get sales trends for charting
 */
router.get(
  '/sales-trends',
  authorize(...reportRoles),
  reportController.getSalesTrends
);

export default router;
