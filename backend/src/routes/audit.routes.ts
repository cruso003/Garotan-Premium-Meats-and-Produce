import { Router } from 'express';
import auditController from '../controllers/audit.controller';
import { authenticate } from '../middlewares/auth';
import { authorizeRoles } from '../middlewares/roleAuth';

const router = Router();

// All audit routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/audit/logs
 * @desc    Get audit logs with filters
 * @access  Admin, Manager
 */
router.get('/logs', authorizeRoles('ADMIN', 'MANAGER'), auditController.getLogs);

/**
 * @route   GET /api/audit/entity/:entityType/:entityId
 * @desc    Get audit history for a specific entity
 * @access  Admin, Manager
 */
router.get(
  '/entity/:entityType/:entityId',
  authorizeRoles('ADMIN', 'MANAGER'),
  auditController.getEntityHistory
);

/**
 * @route   GET /api/audit/user/:userId
 * @desc    Get activity for a specific user
 * @access  Admin
 */
router.get('/user/:userId', authorizeRoles('ADMIN'), auditController.getUserActivity);

/**
 * @route   GET /api/audit/summary
 * @desc    Get activity summary (counts by action type)
 * @access  Admin, Manager
 */
router.get('/summary', authorizeRoles('ADMIN', 'MANAGER'), auditController.getActivitySummary);

/**
 * @route   GET /api/audit/active-users
 * @desc    Get most active users
 * @access  Admin
 */
router.get('/active-users', authorizeRoles('ADMIN'), auditController.getMostActiveUsers);

export default router;
