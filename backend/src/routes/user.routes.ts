import { Router } from 'express';
import { body } from 'express-validator';
import userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validator';

const router = Router();

// All user management routes require authentication and admin privileges
router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * GET /api/users
 * Get all users with filters
 */
router.get('/', userController.getUsers);

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', userController.getUserById);

/**
 * POST /api/users
 * Create new user
 */
router.post(
  '/',
  validate([
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    body('name')
      .notEmpty()
      .withMessage('Name is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('role')
      .isIn([
        'ADMIN',
        'STORE_MANAGER',
        'CASHIER',
        'COLD_ROOM_ATTENDANT',
        'SALES_MANAGER',
        'DELIVERY_COORDINATOR',
        'DRIVER',
        'ACCOUNTANT',
      ])
      .withMessage('Valid role is required'),
    body('phone')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Valid phone number is required'),
  ]),
  userController.createUser
);

/**
 * PUT /api/users/:id
 * Update user
 */
router.put(
  '/:id',
  validate([
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required'),
    body('role')
      .optional()
      .isIn([
        'ADMIN',
        'STORE_MANAGER',
        'CASHIER',
        'COLD_ROOM_ATTENDANT',
        'SALES_MANAGER',
        'DELIVERY_COORDINATOR',
        'DRIVER',
        'ACCOUNTANT',
      ])
      .withMessage('Valid role is required'),
    body('status')
      .optional()
      .isIn(['ACTIVE', 'INACTIVE'])
      .withMessage('Valid status is required'),
  ]),
  userController.updateUser
);

/**
 * DELETE /api/users/:id
 * Deactivate user
 */
router.delete('/:id', userController.deactivateUser);

/**
 * PATCH /api/users/:id/activate
 * Activate user
 */
router.patch('/:id/activate', userController.activateUser);

/**
 * POST /api/users/:id/reset-password
 * Reset user password
 */
router.post(
  '/:id/reset-password',
  validate([
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
  ]),
  userController.resetPassword
);

export default router;
