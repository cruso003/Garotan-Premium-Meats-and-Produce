import { Request, Response } from 'express';
import productService from '../services/product.service';
import { asyncHandler } from '../middlewares/errorHandler';
import { ApiError } from '../middlewares/errorHandler';
import { ProductCategory, UnitOfMeasure, StorageLocation } from '@prisma/client';
import AuditService from '../services/audit.service';

export class ProductController {
  /**
   * GET /api/products
   * Get all products with filters
   */
  getProducts = asyncHandler(async (req: Request, res: Response) => {
    const { search, category, isActive, storageLocation, page = '1', limit = '50' } = req.query;

    const filters = {
      ...(search && { search: search as string }),
      ...(category && { category: category as ProductCategory }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(storageLocation && { storageLocation: storageLocation as StorageLocation }),
    };

    const result = await productService.getProducts(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
      },
    });
  });

  /**
   * GET /api/products/low-stock
   * Get low stock products
   */
  getLowStock = asyncHandler(async (_req: Request, res: Response) => {
    const products = await productService.getLowStockProducts();

    res.status(200).json({
      success: true,
      data: products,
    });
  });

  /**
   * GET /api/products/:id
   * Get product by ID
   */
  getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await productService.getProductById(id);

    res.status(200).json({
      success: true,
      data: product,
    });
  });

  /**
   * GET /api/products/sku/:sku
   * Get product by SKU
   */
  getProductBySKU = asyncHandler(async (req: Request, res: Response) => {
    const { sku } = req.params;

    const product = await productService.getProductBySKU(sku);

    res.status(200).json({
      success: true,
      data: product,
    });
  });

  /**
   * GET /api/products/barcode/:barcode
   * Get product by barcode
   */
  getProductByBarcode = asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.params;

    const product = await productService.getProductByBarcode(barcode);

    res.status(200).json({
      success: true,
      data: product,
    });
  });

  /**
   * POST /api/products
   * Create new product
   */
  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.createProduct(req.body);

    // Audit log
    await AuditService.log(
      req.user!.userId,
      'CREATE',
      'Product',
      product.id,
      `Created product: ${product.name} (SKU: ${product.sku})`
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  });

  /**
   * PUT /api/products/:id
   * Update product
   */
  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await productService.updateProduct(id, req.body);

    // Audit log
    await AuditService.log(
      req.user!.userId,
      'UPDATE',
      'Product',
      product.id,
      `Updated product: ${product.name} (SKU: ${product.sku})`
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  });

  /**
   * DELETE /api/products/:id
   * Delete product (soft delete)
   */
  deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await productService.deleteProduct(id);

    // Audit log
    await AuditService.log(
      req.user!.userId,
      'DELETE',
      'Product',
      id,
      'Deactivated product'
    );

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  });
}

export default new ProductController();
