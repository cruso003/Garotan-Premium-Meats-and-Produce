import { Router } from 'express';
import { body } from 'express-validator';
import inventoryController from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validator';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

/**
 * POST /api/inventory/receive
 * Receive new stock
 * Accessible by: ADMIN, STORE_MANAGER, COLD_ROOM_ATTENDANT
 */
router.post(
  '/receive',
  authorize('ADMIN', 'STORE_MANAGER', 'COLD_ROOM_ATTENDANT'),
  validate([
    body('productId')
      .notEmpty()
      .withMessage('Product ID is required'),
    body('quantity')
      .isFloat({ min: 0.001 })
      .withMessage('Quantity must be greater than 0'),
    body('expiryDate')
      .optional()
      .isISO8601()
      .withMessage('Valid expiry date is required'),
  ]),
  inventoryController.receiveStock
);

/**
 * POST /api/inventory/adjust
 * Adjust stock (spoilage, corrections, etc.)
 * Accessible by: ADMIN, STORE_MANAGER, COLD_ROOM_ATTENDANT
 */
router.post(
  '/adjust',
  authorize('ADMIN', 'STORE_MANAGER', 'COLD_ROOM_ATTENDANT'),
  validate([
    body('productId')
      .notEmpty()
      .withMessage('Product ID is required'),
    body('type')
      .isIn(['SPOILAGE', 'TRANSFER', 'CORRECTION', 'DAMAGED', 'THEFT', 'OTHER'])
      .withMessage('Valid adjustment type is required'),
    body('quantity')
      .isFloat({ min: 0.001 })
      .withMessage('Quantity must be greater than 0'),
    body('reason')
      .notEmpty()
      .withMessage('Reason is required'),
  ]),
  inventoryController.adjustStock
);

/**
 * GET /api/inventory/batches/:productId
 * Get stock batches for a product (FIFO order)
 */
router.get('/batches/:productId', inventoryController.getProductBatches);

/**
 * GET /api/inventory/batches
 * Get all stock batches with filters
 */
router.get('/batches', inventoryController.getAllBatches);

/**
 * GET /api/inventory/near-expiry
 * Get near-expiry products
 */
router.get('/near-expiry', inventoryController.getNearExpiryProducts);

/**
 * GET /api/inventory/expired
 * Get expired products
 */
router.get('/expired', inventoryController.getExpiredProducts);

/**
 * GET /api/inventory/low-stock
 * Get low stock products (below minimum level)
 */
router.get('/low-stock', inventoryController.getLowStockProducts);

/**
 * GET /api/inventory/summary
 * Get stock summary for all products
 */
router.get('/summary', inventoryController.getStockSummary);

/**
 * GET /api/inventory/adjustments
 * Get stock adjustments history
 */
router.get('/adjustments', inventoryController.getAdjustmentHistory);

/**
 * GET /api/inventory/valuation
 * Get stock valuation
 * Accessible by: ADMIN, STORE_MANAGER, ACCOUNTANT
 */
router.get(
  '/valuation',
  authorize('ADMIN', 'STORE_MANAGER', 'ACCOUNTANT'),
  inventoryController.getStockValuation
);

export default router;
