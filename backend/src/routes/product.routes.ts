import { Router } from 'express';
import { body } from 'express-validator';
import productController from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validator';

const router = Router();

// All product routes require authentication
router.use(authenticate);

/**
 * GET /api/products
 * Get all products with filters
 */
router.get('/', productController.getProducts);

/**
 * GET /api/products/low-stock
 * Get low stock products
 */
router.get('/low-stock', productController.getLowStock);

/**
 * GET /api/products/sku/:sku
 * Get product by SKU
 */
router.get('/sku/:sku', productController.getProductBySKU);

/**
 * GET /api/products/barcode/:barcode
 * Get product by barcode
 */
router.get('/barcode/:barcode', productController.getProductByBarcode);

/**
 * GET /api/products/:id
 * Get product by ID
 */
router.get('/:id', productController.getProductById);

/**
 * POST /api/products
 * Create new product (Admin or Store Manager only)
 */
router.post(
  '/',
  authorize('ADMIN', 'STORE_MANAGER'),
  validate([
    body('sku').notEmpty().withMessage('SKU is required'),
    body('name').notEmpty().withMessage('Product name is required'),
    body('category')
      .isIn(['CHICKEN', 'BEEF', 'PORK', 'PRODUCE', 'VALUE_ADDED', 'OTHER'])
      .withMessage('Valid category is required'),
    body('unitOfMeasure')
      .isIn(['KG', 'PIECES', 'TRAYS', 'BOXES', 'LITERS'])
      .withMessage('Valid unit of measure is required'),
    body('costPrice')
      .isFloat({ min: 0 })
      .withMessage('Cost price must be a positive number'),
    body('retailPrice')
      .isFloat({ min: 0 })
      .withMessage('Retail price must be a positive number'),
    body('wholesalePrice')
      .isFloat({ min: 0 })
      .withMessage('Wholesale price must be a positive number'),
    body('storageLocation')
      .isIn(['CHILLER', 'FREEZER', 'PRODUCE_SECTION', 'DRY_STORAGE'])
      .withMessage('Valid storage location is required'),
  ]),
  productController.createProduct
);

/**
 * PUT /api/products/:id
 * Update product (Admin or Store Manager only)
 */
router.put(
  '/:id',
  authorize('ADMIN', 'STORE_MANAGER'),
  validate([
    body('costPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Cost price must be a positive number'),
    body('retailPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Retail price must be a positive number'),
    body('wholesalePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Wholesale price must be a positive number'),
  ]),
  productController.updateProduct
);

/**
 * DELETE /api/products/:id
 * Delete product (Admin only)
 */
router.delete(
  '/:id',
  authorize('ADMIN', 'STORE_MANAGER'),
  productController.deleteProduct
);

export default router;
