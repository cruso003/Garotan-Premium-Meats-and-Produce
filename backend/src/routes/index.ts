import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import transactionRoutes from './transaction.routes';
import customerRoutes from './customer.routes';
import inventoryRoutes from './inventory.routes';
import reportRoutes from './report.routes';
import userRoutes from './user.routes';
import uploadRoutes from './upload.routes';
import receiptRoutes from './receipt.routes';
// Import other route modules as they are created
// import orderRoutes from './order.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/transactions', transactionRoutes);
router.use('/customers', customerRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/receipts', receiptRoutes);
// router.use('/orders', orderRoutes);

export default router;
