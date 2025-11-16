import { Request, Response } from 'express';
import userService from '../services/user.service';
import { asyncHandler } from '../middlewares/errorHandler';
import { ApiError } from '../middlewares/errorHandler';
import { UserRole, UserStatus } from '@prisma/client';

export class UserController {
  /**
   * GET /api/users
   * Get all users with filters
   */
  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const { search, role, status, page = '1', limit = '50' } = req.query;

    const filters = {
      ...(search && { search: search as string }),
      ...(role && { role: role as UserRole }),
      ...(status && { status: status as UserStatus }),
    };

    const result = await userService.getUsers(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      data: result.users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  });

  /**
   * GET /api/users/:id
   * Get user by ID
   */
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  /**
   * POST /api/users
   * Create new user
   */
  createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  });

  /**
   * PUT /api/users/:id
   * Update user
   */
  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await userService.updateUser(id, req.body);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  });

  /**
   * DELETE /api/users/:id
   * Deactivate user
   */
  deactivateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Prevent self-deactivation
    if (req.user && req.user.userId === id) {
      throw new ApiError(400, 'You cannot deactivate your own account');
    }

    await userService.deactivateUser(id);

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  });

  /**
   * PATCH /api/users/:id/activate
   * Activate user
   */
  activateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await userService.activateUser(id);

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      data: user,
    });
  });

  /**
   * POST /api/users/:id/reset-password
   * Reset user password (admin function)
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      throw new ApiError(400, 'New password is required');
    }

    await userService.resetPassword(id, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  });
}

export default new UserController();
