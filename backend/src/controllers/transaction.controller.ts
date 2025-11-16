import { Request, Response } from 'express';
import transactionService from '../services/transaction.service';
import { asyncHandler } from '../middlewares/errorHandler';
import { ApiError } from '../middlewares/errorHandler';
import { PaymentMethod } from '@prisma/client';

export class TransactionController {
  /**
   * POST /api/transactions
   * Create a new transaction (POS sale)
   */
  createTransaction = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const transaction = await transactionService.createTransaction(
      req.user.userId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction,
    });
  });

  /**
   * GET /api/transactions/:id
   * Get transaction by ID (for receipt)
   */
  getTransactionById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const transaction = await transactionService.getTransactionById(id);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  });

  /**
   * GET /api/transactions/number/:transactionNumber
   * Get transaction by transaction number
   */
  getTransactionByNumber = asyncHandler(async (req: Request, res: Response) => {
    const { transactionNumber } = req.params;

    const transaction = await transactionService.getTransactionByNumber(transactionNumber);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  });

  /**
   * POST /api/transactions/:id/void
   * Void a transaction
   */
  voidTransaction = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new ApiError(400, 'Void reason is required');
    }

    await transactionService.voidTransaction(id, req.user.userId, reason);

    res.status(200).json({
      success: true,
      message: 'Transaction voided successfully',
    });
  });

  /**
   * GET /api/transactions
   * Get transactions with filters
   */
  getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const {
      startDate,
      endDate,
      customerId,
      cashierId,
      paymentMethod,
      isVoided,
      page = '1',
      limit = '50',
    } = req.query;

    const filters = {
      ...(startDate && { startDate: new Date(startDate as string) }),
      ...(endDate && { endDate: new Date(endDate as string) }),
      ...(customerId && { customerId: customerId as string }),
      ...(cashierId && { cashierId: cashierId as string }),
      ...(paymentMethod && { paymentMethod: paymentMethod as PaymentMethod }),
      ...(isVoided !== undefined && { isVoided: isVoided === 'true' }),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    const result = await transactionService.getTransactions(filters);

    res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.limit),
      },
    });
  });
}

export default new TransactionController();
