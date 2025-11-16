import { Request, Response } from 'express';
import transactionService from '../services/transaction.service';
import { asyncHandler } from '../middlewares/errorHandler';
import { ApiError } from '../middlewares/errorHandler';
import { PaymentMethod } from '@prisma/client';
import { retryWithBackoff, isStockError, isConcurrencyError } from '../utils/retry';

export class TransactionController {
  /**
   * POST /api/transactions
   * Create a new transaction (POS sale)
   * Includes retry logic for concurrent transactions
   */
  createTransaction = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    // Wrap transaction creation with retry logic to handle concurrent updates
    const transaction = await retryWithBackoff(
      async () => {
        return await transactionService.createTransaction(
          req.user!.userId,
          req.body
        );
      },
      {
        maxAttempts: 3,
        delayMs: 150,
        backoffMultiplier: 2,
      },
      'Transaction Creation'
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
   * Includes retry logic for concurrent stock updates
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

    // Wrap void operation with retry logic
    await retryWithBackoff(
      async () => {
        return await transactionService.voidTransaction(id, req.user!.userId, reason);
      },
      {
        maxAttempts: 3,
        delayMs: 100,
        backoffMultiplier: 2,
      },
      'Transaction Void'
    );

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
