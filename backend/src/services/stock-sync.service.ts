import { prisma } from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Service for synchronizing product stock levels
 * Handles updating Product.currentStock from StockBatch totals
 * Implements optimistic locking to prevent race conditions
 */
export class StockSyncService {
  /**
   * Calculate total stock for a product from all its batches
   */
  private static async calculateProductStock(
    productId: string
  ): Promise<number> {
    const result = await prisma.stockBatch.aggregate({
      where: { productId },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity
      ? parseFloat(result._sum.quantity.toString())
      : 0;
  }

  /**
   * Sync stock for a single product with optimistic locking
   * @param productId - Product ID to sync
   * @param expectedVersion - Expected version for optimistic locking (optional)
   * @throws Error if version mismatch (concurrent update detected)
   */
  static async syncProductStock(
    productId: string,
    expectedVersion?: number
  ): Promise<void> {
    // Calculate actual stock from batches
    const actualStock = await this.calculateProductStock(productId);

    // Build update conditions
    const whereConditions: any = { id: productId };
    if (expectedVersion !== undefined) {
      whereConditions.stockVersion = expectedVersion;
    }

    // Update with optimistic locking
    const updated = await prisma.product.updateMany({
      where: whereConditions,
      data: {
        currentStock: new Decimal(actualStock),
        stockVersion: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    // Check if update succeeded (version matched)
    if (updated.count === 0 && expectedVersion !== undefined) {
      throw new Error(
        `Concurrent stock update detected for product ${productId}. Please retry.`
      );
    }
  }

  /**
   * Sync stock for multiple products (batch operation)
   * @param productIds - Array of product IDs to sync
   */
  static async syncMultipleProducts(productIds: string[]): Promise<void> {
    await Promise.all(
      productIds.map((productId) => this.syncProductStock(productId))
    );
  }

  /**
   * Sync stock after transaction item sale
   * Decreases stock by sold quantity
   */
  static async syncAfterSale(
    productId: string,
    quantitySold: number,
    expectedVersion?: number
  ): Promise<void> {
    // For sales, we can optimize by just decrementing instead of recalculating
    const whereConditions: any = { id: productId };
    if (expectedVersion !== undefined) {
      whereConditions.stockVersion = expectedVersion;
    }

    const updated = await prisma.product.updateMany({
      where: whereConditions,
      data: {
        currentStock: {
          decrement: new Decimal(quantitySold),
        },
        stockVersion: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    if (updated.count === 0 && expectedVersion !== undefined) {
      throw new Error(
        `Concurrent stock update detected for product ${productId}. Please retry.`
      );
    }

    // Verify stock didn't go negative (safety check)
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { currentStock: true },
    });

    if (product && parseFloat(product.currentStock.toString()) < 0) {
      // Stock went negative - resync from batches
      await this.syncProductStock(productId);
    }
  }

  /**
   * Sync stock after receiving new stock batch
   * Increases stock by received quantity
   */
  static async syncAfterStockReceived(
    productId: string,
    quantityReceived: number,
    expectedVersion?: number
  ): Promise<void> {
    const whereConditions: any = { id: productId };
    if (expectedVersion !== undefined) {
      whereConditions.stockVersion = expectedVersion;
    }

    const updated = await prisma.product.updateMany({
      where: whereConditions,
      data: {
        currentStock: {
          increment: new Decimal(quantityReceived),
        },
        stockVersion: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });

    if (updated.count === 0 && expectedVersion !== undefined) {
      throw new Error(
        `Concurrent stock update detected for product ${productId}. Please retry.`
      );
    }
  }

  /**
   * Sync stock after adjustment (spoilage, damage, etc.)
   * Can increase or decrease based on adjustment type
   */
  static async syncAfterAdjustment(
    productId: string,
    adjustmentQuantity: number,
    expectedVersion?: number
  ): Promise<void> {
    // For adjustments, always recalculate to ensure accuracy
    await this.syncProductStock(productId, expectedVersion);
  }

  /**
   * Reconcile all products - recalculate from batches
   * Use for data migration or periodic reconciliation
   */
  static async reconcileAllProducts(): Promise<{
    total: number;
    updated: number;
    errors: string[];
  }> {
    const products = await prisma.product.findMany({
      select: { id: true },
    });

    const errors: string[] = [];
    let updated = 0;

    for (const product of products) {
      try {
        await this.syncProductStock(product.id);
        updated++;
      } catch (error: any) {
        errors.push(`${product.id}: ${error.message}`);
      }
    }

    return {
      total: products.length,
      updated,
      errors,
    };
  }

  /**
   * Get products with low stock
   * Uses indexed currentStock field for fast queries
   */
  static async getLowStockProducts(): Promise<
    Array<{
      id: string;
      sku: string;
      name: string;
      currentStock: number;
      minStockLevel: number;
    }>
  > {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        currentStock: {
          lte: prisma.product.fields.minStockLevel,
        },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        currentStock: true,
        minStockLevel: true,
      },
      orderBy: {
        currentStock: 'asc',
      },
    });

    return products.map((p) => ({
      ...p,
      currentStock: parseFloat(p.currentStock.toString()),
    }));
  }

  /**
   * Check if product has sufficient stock
   */
  static async checkStock(
    productId: string,
    requiredQuantity: number
  ): Promise<{
    available: boolean;
    currentStock: number;
    shortage: number;
  }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { currentStock: true },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const currentStock = parseFloat(product.currentStock.toString());
    const available = currentStock >= requiredQuantity;
    const shortage = available ? 0 : requiredQuantity - currentStock;

    return {
      available,
      currentStock,
      shortage,
    };
  }
}
