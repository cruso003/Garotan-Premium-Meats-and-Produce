import { User, UserRole, UserStatus, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { ApiError } from '../middlewares/errorHandler';

export interface CreateUserDTO {
  email: string;
  phone?: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDTO {
  email?: string;
  phone?: string;
  name?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export class UserService {
  /**
   * Get all users with filters
   */
  async getUsers(
    filters: UserFilters = {},
    page = 1,
    limit = 50
  ): Promise<{ users: Omit<User, 'password'>[]; total: number }> {
    const { search, role, status } = filters;

    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(role && { role }),
      ...(status && { status }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Remove passwords from response
    const usersWithoutPassword = users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return { users: usersWithoutPassword, total };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<Omit<User, 'password'>> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserDTO): Promise<Omit<User, 'password'>> {
    const { email, phone, name, password, role } = data;

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new ApiError(400, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name,
        password: hashedPassword,
        role,
        status: 'ACTIVE',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    data: UpdateUserDTO
  ): Promise<Omit<User, 'password'>> {
    // Check if user exists
    await this.getUserById(id);

    // If email is being updated, check uniqueness
    if (data.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id },
        },
      });

      if (existingEmail) {
        throw new ApiError(400, 'User with this email already exists');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(id: string): Promise<void> {
    await this.getUserById(id);

    await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<Omit<User, 'password'>> {
    await this.getUserById(id);

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Reset user password (admin function)
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    await this.getUserById(id);

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}

export default new UserService();
