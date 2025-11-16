import { Request, Response, NextFunction } from 'express';
import { StockSyncService } from '../services/stock-sync.service';
import { ApiError } from '../middlewares/errorHandler';

/**
 * Reconcile stock for a single product
 * Recalculates Product.currentStock from StockBatch totals
 */
export const reconcileProductStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      throw new ApiError(400, 'Product ID is required');
    }

    await StockSyncService.syncProductStock(productId);

    res.json({
      success: true,
      message: 'Product stock reconciled successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reconcile stock for multiple products
 */
export const reconcileMultipleProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new ApiError(400, 'Product IDs array is required');
    }

    await StockSyncService.syncMultipleProducts(productIds);

    res.json({
      success: true,
      message: `Successfully reconciled stock for ${productIds.length} products`,
      data: {
        count: productIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reconcile stock for all products
 * WARNING: This can be slow for large databases
 */
export const reconcileAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await StockSyncService.reconcileAllProducts();

    res.json({
      success: true,
      message: 'Stock reconciliation completed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check stock availability for a product
 */
export const checkProductStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.query;

    if (!productId) {
      throw new ApiError(400, 'Product ID is required');
    }

    if (!quantity || isNaN(Number(quantity))) {
      throw new ApiError(400, 'Valid quantity is required');
    }

    const result = await StockSyncService.checkStock(
      productId,
      Number(quantity)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock products using cached currentStock field
 */
export const getLowStockProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = await StockSyncService.getLowStockProducts();

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    next(error);
  }
};
