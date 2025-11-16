import { Request, Response } from 'express';
import inventoryService from '../services/inventory.service';
import { asyncHandler } from '../middlewares/errorHandler';
import { ApiError } from '../middlewares/errorHandler';
import { AdjustmentType } from '@prisma/client';

export class InventoryController {
  /**
   * POST /api/inventory/receive
   * Receive new stock
   */
  receiveStock = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const stockBatch = await inventoryService.receiveStock(
      req.body,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: 'Stock received successfully',
      data: stockBatch,
    });
  });

  /**
   * POST /api/inventory/adjust
   * Adjust stock (spoilage, corrections, etc.)
   */
  adjustStock = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const adjustment = await inventoryService.adjustStock(
      req.body,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: adjustment,
    });
  });

  /**
   * GET /api/inventory/batches/:productId
   * Get stock batches for a product (FIFO order)
   */
  getProductBatches = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;

    const batches = await inventoryService.getProductBatches(productId);

    res.status(200).json({
      success: true,
      data: batches,
    });
  });

  /**
   * GET /api/inventory/batches
   * Get all stock batches with filters
   */
  getAllBatches = asyncHandler(async (req: Request, res: Response) => {
    const {
      productId,
      expiryBefore,
      hasStock,
      page = '1',
      limit = '50',
    } = req.query;

    const filters = {
      ...(productId && { productId: productId as string }),
      ...(expiryBefore && { expiryBefore: new Date(expiryBefore as string) }),
      ...(hasStock !== undefined && { hasStock: hasStock === 'true' }),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    const result = await inventoryService.getAllBatches(filters);

    res.status(200).json({
      success: true,
      data: result.batches,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.limit),
      },
    });
  });

  /**
   * GET /api/inventory/near-expiry
   * Get near-expiry products
   */
  getNearExpiryProducts = asyncHandler(async (req: Request, res: Response) => {
    const { days = '7' } = req.query;

    const products = await inventoryService.getNearExpiryProducts(
      parseInt(days as string)
    );

    res.status(200).json({
      success: true,
      data: products,
    });
  });

  /**
   * GET /api/inventory/expired
   * Get expired products
   */
  getExpiredProducts = asyncHandler(async (_req: Request, res: Response) => {
    const products = await inventoryService.getExpiredProducts();

    res.status(200).json({
      success: true,
      data: products,
    });
  });

  /**
   * GET /api/inventory/summary
   * Get stock summary for all products
   */
  getStockSummary = asyncHandler(async (_req: Request, res: Response) => {
    const summary = await inventoryService.getStockSummary();

    res.status(200).json({
      success: true,
      data: summary,
    });
  });

  /**
   * GET /api/inventory/adjustments
   * Get stock adjustments history
   */
  getAdjustmentHistory = asyncHandler(async (req: Request, res: Response) => {
    const {
      productId,
      type,
      startDate,
      endDate,
      page = '1',
      limit = '50',
    } = req.query;

    const filters = {
      ...(productId && { productId: productId as string }),
      ...(type && { type: type as AdjustmentType }),
      ...(startDate && { startDate: new Date(startDate as string) }),
      ...(endDate && { endDate: new Date(endDate as string) }),
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    };

    const result = await inventoryService.getAdjustmentHistory(filters);

    res.status(200).json({
      success: true,
      data: result.adjustments,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.limit),
      },
    });
  });

  /**
   * GET /api/inventory/valuation
   * Get stock valuation
   */
  getStockValuation = asyncHandler(async (_req: Request, res: Response) => {
    const valuation = await inventoryService.getStockValuation();

    res.status(200).json({
      success: true,
      data: valuation,
    });
  });
}

export default new InventoryController();
