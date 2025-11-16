import { Router } from 'express';
import {
  getReceipt,
  printReceipt,
  getReceiptByNumber,
} from '../controllers/receipt.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All receipt routes require authentication
router.use(authenticate());

/**
 * @route   GET /api/receipts/transaction/:transactionId
 * @desc    Get receipt for a transaction
 * @query   format - html, text, or json (default: html)
 * @access  Private
 */
router.get('/transaction/:transactionId', getReceipt);

/**
 * @route   POST /api/receipts/transaction/:transactionId/print
 * @desc    Print receipt to network printer
 * @body    printerIp, printerPort (optional)
 * @access  Private
 */
router.post('/transaction/:transactionId/print', printReceipt);

/**
 * @route   GET /api/receipts/number/:receiptNumber
 * @desc    Get receipt by receipt number (for reprints)
 * @query   format - html, text, or json (default: html)
 * @access  Private
 */
router.get('/number/:receiptNumber', getReceiptByNumber);

export default router;
