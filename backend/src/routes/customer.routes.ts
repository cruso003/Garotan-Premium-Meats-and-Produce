import { Router } from 'express';
import { body } from 'express-validator';
import customerController from '../controllers/customer.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validator';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

/**
 * GET /api/customers
 * Get all customers with filters
 */
router.get('/', customerController.getCustomers);

/**
 * GET /api/customers/segment/:segment
 * Get customers by segment (vip, regular, b2b, retail)
 */
router.get('/segment/:segment', customerController.getCustomersBySegment);

/**
 * GET /api/customers/phone/:phone
 * Get customer by phone number
 */
router.get('/phone/:phone', customerController.getCustomerByPhone);

/**
 * GET /api/customers/:id
 * Get customer by ID
 */
router.get('/:id', customerController.getCustomerById);

/**
 * POST /api/customers
 * Create new customer
 */
router.post(
  '/',
  validate([
    body('name')
      .notEmpty()
      .withMessage('Customer name is required'),
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Valid phone number is required'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required'),
    body('customerType')
      .optional()
      .isIn(['RETAIL', 'B2B_RESTAURANT', 'B2B_HOTEL', 'B2B_INSTITUTION'])
      .withMessage('Valid customer type is required'),
    body('creditLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Credit limit must be a positive number'),
    body('paymentTermsDays')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Payment terms must be a positive integer'),
  ]),
  customerController.createCustomer
);

/**
 * PUT /api/customers/:id
 * Update customer
 */
router.put(
  '/:id',
  authorize('ADMIN', 'STORE_MANAGER', 'SALES_MANAGER'),
  validate([
    body('phone')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Valid phone number is required'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required'),
    body('creditLimit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Credit limit must be a positive number'),
  ]),
  customerController.updateCustomer
);

/**
 * DELETE /api/customers/:id
 * Delete customer (soft delete)
 */
router.delete(
  '/:id',
  authorize('ADMIN', 'STORE_MANAGER'),
  customerController.deleteCustomer
);

/**
 * GET /api/customers/:id/history
 * Get customer purchase history
 */
router.get('/:id/history', customerController.getPurchaseHistory);

/**
 * POST /api/customers/:id/loyalty/redeem
 * Redeem loyalty points
 */
router.post(
  '/:id/loyalty/redeem',
  authorize('ADMIN', 'STORE_MANAGER', 'CASHIER', 'SALES_MANAGER'),
  validate([
    body('points')
      .isInt({ min: 1 })
      .withMessage('Points must be a positive integer'),
  ]),
  customerController.redeemLoyaltyPoints
);

/**
 * POST /api/customers/:id/loyalty/adjust
 * Adjust loyalty points (manual adjustment - admin only)
 */
router.post(
  '/:id/loyalty/adjust',
  authorize('ADMIN', 'STORE_MANAGER'),
  validate([
    body('points')
      .isInt()
      .withMessage('Points must be an integer'),
    body('description')
      .notEmpty()
      .withMessage('Description is required'),
  ]),
  customerController.adjustLoyaltyPoints
);

/**
 * GET /api/customers/:id/loyalty/history
 * Get loyalty transaction history
 */
router.get('/:id/loyalty/history', customerController.getLoyaltyHistory);

/**
 * PATCH /api/customers/:id/loyalty/tier
 * Update customer loyalty tier based on points
 */
router.patch(
  '/:id/loyalty/tier',
  authorize('ADMIN', 'STORE_MANAGER'),
  customerController.updateLoyaltyTier
);

export default router;
