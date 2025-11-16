import { Router } from 'express';
import {
  reconcileProductStock,
  reconcileMultipleProducts,
  reconcileAllProducts,
  checkProductStock,
  getLowStockProducts,
} from '../controllers/stock-sync.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// All stock sync routes require authentication
router.use(authenticate());

/**
 * @route   GET /api/stock-sync/low-stock
 * @desc    Get products with low stock (cached from Product.currentStock)
 * @access  Private
 */
router.get('/low-stock', getLowStockProducts);

/**
 * @route   GET /api/stock-sync/check/:productId
 * @desc    Check stock availability for a product
 * @query   quantity - Required quantity to check
 * @access  Private
 */
router.get('/check/:productId', checkProductStock);

/**
 * @route   POST /api/stock-sync/reconcile/:productId
 * @desc    Reconcile stock for a single product (admin only)
 * @access  Private (Admin, Manager)
 */
router.post(
  '/reconcile/:productId',
  authorize(['ADMIN', 'MANAGER']),
  reconcileProductStock
);

/**
 * @route   POST /api/stock-sync/reconcile
 * @desc    Reconcile stock for multiple products (admin only)
 * @body    productIds - Array of product IDs
 * @access  Private (Admin, Manager)
 */
router.post(
  '/reconcile',
  authorize(['ADMIN', 'MANAGER']),
  reconcileMultipleProducts
);

/**
 * @route   POST /api/stock-sync/reconcile-all
 * @desc    Reconcile stock for ALL products (admin only, use with caution)
 * @access  Private (Admin only)
 */
router.post(
  '/reconcile-all',
  authorize(['ADMIN']),
  reconcileAllProducts
);

export default router;
