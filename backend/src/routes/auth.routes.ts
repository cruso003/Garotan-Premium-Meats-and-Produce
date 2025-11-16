import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validator';

const router = Router();

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  authController.login
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ]),
  authController.refresh
);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticate, authController.logout);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post(
  '/change-password',
  authenticate,
  validate([
    body('oldPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long'),
  ]),
  authController.changePassword
);

export default router;
