import { Router } from 'express';
import csvController from '../controllers/csv.controller';
import { authenticate } from '../middlewares/auth';
import { authorizeRoles } from '../middlewares/roleAuth';
import multer from 'multer';

const router = Router();

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// All CSV routes require authentication
router.use(authenticate);

/**
 * Export routes - require Manager or Admin role
 */

/**
 * @route   GET /api/csv/export/products
 * @desc    Export products to CSV
 * @access  Manager, Admin
 */
router.get(
  '/export/products',
  authorizeRoles('ADMIN', 'MANAGER'),
  csvController.exportProducts
);

/**
 * @route   GET /api/csv/export/customers
 * @desc    Export customers to CSV
 * @access  Manager, Admin
 */
router.get(
  '/export/customers',
  authorizeRoles('ADMIN', 'MANAGER'),
  csvController.exportCustomers
);

/**
 * @route   GET /api/csv/export/transactions
 * @desc    Export transactions to CSV
 * @access  Manager, Admin
 */
router.get(
  '/export/transactions',
  authorizeRoles('ADMIN', 'MANAGER'),
  csvController.exportTransactions
);

/**
 * @route   GET /api/csv/export/inventory
 * @desc    Export inventory to CSV
 * @access  Manager, Admin
 */
router.get(
  '/export/inventory',
  authorizeRoles('ADMIN', 'MANAGER'),
  csvController.exportInventory
);

/**
 * Import routes - require Admin role only
 */

/**
 * @route   POST /api/csv/import/products
 * @desc    Import products from CSV
 * @access  Admin
 */
router.post(
  '/import/products',
  authorizeRoles('ADMIN'),
  upload.single('file'),
  csvController.importProducts
);

/**
 * @route   POST /api/csv/import/customers
 * @desc    Import customers from CSV
 * @access  Admin
 */
router.post(
  '/import/customers',
  authorizeRoles('ADMIN'),
  upload.single('file'),
  csvController.importCustomers
);

export default router;
