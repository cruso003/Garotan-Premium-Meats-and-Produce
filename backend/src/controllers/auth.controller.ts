import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { verifyRefreshToken } from '../utils/jwt';
import { asyncHandler } from '../middlewares/errorHandler';
import { validatePasswordStrength } from '../utils/password';
import { ApiError } from '../middlewares/errorHandler';

export class AuthController {
  /**
   * POST /api/auth/login
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    const result = await authService.refreshToken(payload.userId);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  });

  /**
   * POST /api/auth/logout
   * Logout user (client-side token removal)
   */
  logout = asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  });

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await authService.getCurrentUser(req.user.userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  /**
   * POST /api/auth/change-password
   * Change user password
   */
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { oldPassword, newPassword } = req.body;

    // Validate new password strength
    const { isValid, errors } = validatePasswordStrength(newPassword);
    if (!isValid) {
      throw new ApiError(400, errors.join(', '));
    }

    await authService.changePassword(
      req.user.userId,
      oldPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  });
}

export default new AuthController();
