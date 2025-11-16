import { Router } from 'express';
import { body } from 'express-validator';
import transactionController from '../controllers/transaction.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validator';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

/**
 * POST /api/transactions
 * Create a new transaction (POS sale)
 * Accessible by: ADMIN, STORE_MANAGER, CASHIER
 */
router.post(
  '/',
  authorize('ADMIN', 'STORE_MANAGER', 'CASHIER'),
  validate([
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.productId')
      .notEmpty()
      .withMessage('Product ID is required for each item'),
    body('items.*.quantity')
      .isFloat({ min: 0.001 })
      .withMessage('Quantity must be greater than 0'),
    body('items.*.unitPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a positive number'),
    body('items.*.discount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount must be a positive number'),
    body('paymentMethod')
      .isIn([
        'CASH',
        'MOBILE_MONEY_MTN',
        'MOBILE_MONEY_ORANGE',
        'CARD',
        'CREDIT',
        'SPLIT',
      ])
      .withMessage('Valid payment method is required'),
    body('discount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount must be a positive number'),
    body('loyaltyPointsRedeemed')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Loyalty points must be a positive integer'),
  ]),
  transactionController.createTransaction
);

/**
 * GET /api/transactions
 * Get transactions with filters
 * Accessible by: ADMIN, STORE_MANAGER, ACCOUNTANT
 */
router.get(
  '/',
  authorize('ADMIN', 'STORE_MANAGER', 'ACCOUNTANT'),
  transactionController.getTransactions
);

/**
 * GET /api/transactions/number/:transactionNumber
 * Get transaction by transaction number
 */
router.get(
  '/number/:transactionNumber',
  transactionController.getTransactionByNumber
);

/**
 * GET /api/transactions/:id
 * Get transaction by ID (for receipt)
 */
router.get('/:id', transactionController.getTransactionById);

/**
 * POST /api/transactions/:id/void
 * Void a transaction
 * Accessible by: ADMIN, STORE_MANAGER
 */
router.post(
  '/:id/void',
  authorize('ADMIN', 'STORE_MANAGER'),
  validate([
    body('reason')
      .notEmpty()
      .withMessage('Void reason is required'),
  ]),
  transactionController.voidTransaction
);

export default router;
