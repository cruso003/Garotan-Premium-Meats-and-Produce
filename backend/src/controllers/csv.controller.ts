import { Request, Response } from 'express';
import { CSVService } from '../services/csv.service';
import { asyncHandler } from '../middlewares/errorHandler';
import { ApiError } from '../middlewares/errorHandler';
import AuditService from '../services/audit.service';

export class CSVController {
  /**
   * Export products to CSV
   */
  exportProducts = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      category: req.query.category as string,
    };

    const csv = await CSVService.exportProducts(filters);

    // Audit log
    await AuditService.log(
      req.user!.userId,
      'EXPORT',
      'Product',
      'bulk',
      'Exported products to CSV'
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    res.send(csv);
  });

  /**
   * Export customers to CSV
   */
  exportCustomers = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      customerType: req.query.customerType as string,
    };

    const csv = await CSVService.exportCustomers(filters);

    // Audit log
    await AuditService.log(
      req.user!.userId,
      'EXPORT',
      'Customer',
      'bulk',
      'Exported customers to CSV'
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
    res.send(csv);
  });

  /**
   * Export transactions to CSV
   */
  exportTransactions = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const csv = await CSVService.exportTransactions(filters);

    // Audit log
    await AuditService.log(
      req.user!.userId,
      'EXPORT',
      'Transaction',
      'bulk',
      `Exported transactions to CSV (${filters.startDate || 'all'} to ${filters.endDate || 'now'})`
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.send(csv);
  });

  /**
   * Export inventory to CSV
   */
  exportInventory = asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      hasStock: req.query.hasStock ? req.query.hasStock === 'true' : undefined,
    };

    const csv = await CSVService.exportInventory(filters);

    // Audit log
    await AuditService.log(
      req.user!.userId,
      'EXPORT',
      'Inventory',
      'bulk',
      'Exported inventory to CSV'
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory.csv');
    res.send(csv);
  });

  /**
   * Import products from CSV
   */
  importProducts = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'CSV file is required');
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const result = await CSVService.importProducts(csvContent, req.user!.userId);

    // Audit log
    await AuditService.log(
      req.user!.userId,
      'IMPORT',
      'Product',
      'bulk',
      `Imported products from CSV: ${result.imported} successful, ${result.failed} failed`
    );

    res.status(200).json({
      success: true,
      message: `Import completed: ${result.imported} successful, ${result.failed} failed`,
      data: result,
    });
  });

  /**
   * Import customers from CSV
   */
  importCustomers = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'CSV file is required');
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const result = await CSVService.importCustomers(csvContent, req.user!.userId);

    // Audit log
    await AuditService.log(
      req.user!.userId,
      'IMPORT',
      'Customer',
      'bulk',
      `Imported customers from CSV: ${result.imported} successful, ${result.failed} failed`
    );

    res.status(200).json({
      success: true,
      message: `Import completed: ${result.imported} successful, ${result.failed} failed`,
      data: result,
    });
  });
}

export default new CSVController();
