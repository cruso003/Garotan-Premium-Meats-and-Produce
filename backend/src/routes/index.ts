import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
// Import other route modules as they are created
// import inventoryRoutes from './inventory.routes';
// import customerRoutes from './customer.routes';
// import transactionRoutes from './transaction.routes';
// import orderRoutes from './order.routes';
// import userRoutes from './user.routes';
// import reportRoutes from './report.routes';

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
// router.use('/inventory', inventoryRoutes);
// router.use('/customers', customerRoutes);
// router.use('/transactions', transactionRoutes);
// router.use('/orders', orderRoutes);
// router.use('/users', userRoutes);
// router.use('/reports', reportRoutes);

export default router;
