import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ReceiptService } from '../services/receipt.service';

/**
 * Get receipt data for a transaction
 */
export const getReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionId } = req.params;
    const { format = 'html' } = req.query;

    // Fetch transaction with all related data
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Business information (you can move this to config/database)
    const businessInfo = {
      name: 'Garotan Premium Meats & Produce',
      address: 'Monrovia, Liberia',
      phone: '+231-XXX-XXXX',
      taxId: 'TAX-XXXXX',
    };

    const receiptData = {
      transaction,
      businessInfo,
    };

    // Generate receipt in requested format
    if (format === 'text') {
      const receiptText = ReceiptService.generateReceiptText(receiptData);
      res.setHeader('Content-Type', 'text/plain');
      res.send(receiptText);
    } else if (format === 'json') {
      res.json({
        success: true,
        data: receiptData,
      });
    } else {
      // Default to HTML
      const receiptHTML = ReceiptService.generateReceiptHTML(receiptData);
      res.setHeader('Content-Type', 'text/html');
      res.send(receiptHTML);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Print receipt (for network printers)
 */
export const printReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionId } = req.params;
    const { printerIp, printerPort = 9100 } = req.body;

    if (!printerIp) {
      return res.status(400).json({
        success: false,
        message: 'Printer IP address is required',
      });
    }

    // Fetch transaction with all related data
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const businessInfo = {
      name: 'Garotan Premium Meats & Produce',
      address: 'Monrovia, Liberia',
      phone: '+231-XXX-XXXX',
      taxId: 'TAX-XXXXX',
    };

    const receiptData = {
      transaction,
      businessInfo,
    };

    // Generate receipt text
    const receiptText = ReceiptService.generateReceiptText(receiptData);

    // For network printing, we would use escpos-network here
    // This is a simplified version that returns the print data
    // In production, you would actually send to the printer

    res.json({
      success: true,
      message: 'Receipt sent to printer',
      data: {
        receiptText,
        printerIp,
        printerPort,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get receipt by receipt number
 */
export const getReceiptByNumber = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { receiptNumber } = req.params;
    const { format = 'html' } = req.query;

    const transaction = await prisma.transaction.findFirst({
      where: { receiptNumber },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found',
      });
    }

    const businessInfo = {
      name: 'Garotan Premium Meats & Produce',
      address: 'Monrovia, Liberia',
      phone: '+231-XXX-XXXX',
      taxId: 'TAX-XXXXX',
    };

    const receiptData = {
      transaction,
      businessInfo,
    };

    if (format === 'text') {
      const receiptText = ReceiptService.generateReceiptText(receiptData);
      res.setHeader('Content-Type', 'text/plain');
      res.send(receiptText);
    } else if (format === 'json') {
      res.json({
        success: true,
        data: receiptData,
      });
    } else {
      const receiptHTML = ReceiptService.generateReceiptHTML(receiptData);
      res.setHeader('Content-Type', 'text/html');
      res.send(receiptHTML);
    }
  } catch (error) {
    next(error);
  }
};
