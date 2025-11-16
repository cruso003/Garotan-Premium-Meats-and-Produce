import { Parser } from 'json2csv';
import prisma from '../config/database';
import { ApiError } from '../middlewares/errorHandler';
import { Prisma } from '@prisma/client';

export interface CSVExportOptions {
  fields?: string[];
  filename?: string;
}

export class CSVService {
  /**
   * Export products to CSV
   */
  static async exportProducts(filters?: {
    isActive?: boolean;
    category?: string;
  }): Promise<string> {
    const where: Prisma.ProductWhereInput = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.category) where.category = filters.category as any;

    const products = await prisma.product.findMany({
      where,
      select: {
        sku: true,
        barcode: true,
        name: true,
        description: true,
        category: true,
        unitOfMeasure: true,
        costPrice: true,
        retailPrice: true,
        wholesalePrice: true,
        minStockLevel: true,
        storageLocation: true,
        currentStock: true,
        isActive: true,
      },
    });

    const fields = [
      'sku',
      'barcode',
      'name',
      'description',
      'category',
      'unitOfMeasure',
      'costPrice',
      'retailPrice',
      'wholesalePrice',
      'minStockLevel',
      'storageLocation',
      'currentStock',
      'isActive',
    ];

    const parser = new Parser({ fields });
    return parser.parse(products);
  }

  /**
   * Export customers to CSV
   */
  static async exportCustomers(filters?: {
    isActive?: boolean;
    customerType?: string;
  }): Promise<string> {
    const where: Prisma.CustomerWhereInput = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.customerType) where.customerType = filters.customerType as any;

    const customers = await prisma.customer.findMany({
      where,
      select: {
        name: true,
        phone: true,
        email: true,
        customerType: true,
        address: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        creditLimit: true,
        paymentTermsDays: true,
        isActive: true,
      },
    });

    const fields = [
      'name',
      'phone',
      'email',
      'customerType',
      'address',
      'loyaltyPoints',
      'loyaltyTier',
      'creditLimit',
      'paymentTermsDays',
      'isActive',
    ];

    const parser = new Parser({ fields });
    return parser.parse(customers);
  }

  /**
   * Export transactions to CSV
   */
  static async exportTransactions(filters: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<string> {
    const where: Prisma.TransactionWhereInput = {};

    if (filters.startDate || filters.endDate) {
      where.transactionDate = {};
      if (filters.startDate) where.transactionDate.gte = filters.startDate;
      if (filters.endDate) where.transactionDate.lte = filters.endDate;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        customer: true,
        cashier: true,
      },
      orderBy: { transactionDate: 'desc' },
    });

    const data = transactions.map((t) => ({
      transactionNumber: t.transactionNumber,
      transactionDate: t.transactionDate.toISOString(),
      customerName: t.customer?.name || 'Walk-in',
      customerPhone: t.customer?.phone || 'N/A',
      cashierName: t.cashier.name,
      subtotal: t.subtotal.toString(),
      discount: t.discount.toString(),
      tax: t.tax.toString(),
      total: t.total.toString(),
      paymentMethod: t.paymentMethod,
      paymentStatus: t.paymentStatus,
      loyaltyPointsEarned: t.loyaltyPointsEarned,
      loyaltyPointsRedeemed: t.loyaltyPointsRedeemed,
      isVoided: t.isVoided,
      voidReason: t.voidReason || '',
    }));

    const fields = [
      'transactionNumber',
      'transactionDate',
      'customerName',
      'customerPhone',
      'cashierName',
      'subtotal',
      'discount',
      'tax',
      'total',
      'paymentMethod',
      'paymentStatus',
      'loyaltyPointsEarned',
      'loyaltyPointsRedeemed',
      'isVoided',
      'voidReason',
    ];

    const parser = new Parser({ fields });
    return parser.parse(data);
  }

  /**
   * Export inventory (stock batches) to CSV
   */
  static async exportInventory(filters?: {
    hasStock?: boolean;
  }): Promise<string> {
    const where: Prisma.StockBatchWhereInput = {};
    if (filters?.hasStock) where.quantity = { gt: 0 };

    const batches = await prisma.stockBatch.findMany({
      where,
      include: {
        product: {
          select: {
            sku: true,
            name: true,
            category: true,
          },
        },
        supplier: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { receivedDate: 'desc' },
    });

    const data = batches.map((b) => ({
      batchNumber: b.batchNumber,
      productSKU: b.product.sku,
      productName: b.product.name,
      productCategory: b.product.category,
      supplierName: b.supplier?.name || 'N/A',
      quantity: b.quantity.toString(),
      receivedDate: b.receivedDate.toISOString(),
      expiryDate: b.expiryDate?.toISOString() || 'N/A',
      costPerUnit: b.costPerUnit.toString(),
      totalCost: b.totalCost.toString(),
    }));

    const fields = [
      'batchNumber',
      'productSKU',
      'productName',
      'productCategory',
      'supplierName',
      'quantity',
      'receivedDate',
      'expiryDate',
      'costPerUnit',
      'totalCost',
    ];

    const parser = new Parser({ fields });
    return parser.parse(data);
  }

  /**
   * Parse CSV content to JSON
   */
  static parseCSV(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new ApiError(400, 'CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length !== headers.length) {
        throw new ApiError(
          400,
          `Row ${i + 1} has ${values.length} columns, expected ${headers.length}`
        );
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index].trim();
      });
      rows.push(row);
    }

    return rows;
  }

  /**
   * Import products from CSV
   */
  static async importProducts(
    csvContent: string,
    userId: string
  ): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    const rows = this.parseCSV(csvContent);
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.sku || !row.name) {
          errors.push(`Row ${imported + failed + 1}: SKU and name are required`);
          failed++;
          continue;
        }

        // Check if product exists
        const existing = await prisma.product.findUnique({
          where: { sku: row.sku },
        });

        const productData: any = {
          sku: row.sku,
          barcode: row.barcode || null,
          name: row.name,
          description: row.description || null,
          category: row.category || 'GENERAL',
          unitOfMeasure: row.unitOfMeasure || 'UNIT',
          costPrice: new Prisma.Decimal(row.costPrice || 0),
          retailPrice: new Prisma.Decimal(row.retailPrice || 0),
          wholesalePrice: new Prisma.Decimal(row.wholesalePrice || 0),
          minStockLevel: parseInt(row.minStockLevel || '0'),
          storageLocation: row.storageLocation || 'WAREHOUSE',
          isActive: row.isActive === 'true' || row.isActive === '1',
        };

        if (existing) {
          // Update existing product
          await prisma.product.update({
            where: { id: existing.id },
            data: productData,
          });
        } else {
          // Create new product
          await prisma.product.create({
            data: productData,
          });
        }

        imported++;
      } catch (error: any) {
        errors.push(`Row ${imported + failed + 1}: ${error.message}`);
        failed++;
      }
    }

    return { imported, failed, errors };
  }

  /**
   * Import customers from CSV
   */
  static async importCustomers(
    csvContent: string,
    userId: string
  ): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    const rows = this.parseCSV(csvContent);
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.name || !row.phone) {
          errors.push(`Row ${imported + failed + 1}: Name and phone are required`);
          failed++;
          continue;
        }

        // Check if customer exists
        const existing = await prisma.customer.findUnique({
          where: { phone: row.phone },
        });

        const customerData: any = {
          name: row.name,
          phone: row.phone,
          email: row.email || null,
          customerType: row.customerType || 'RETAIL',
          address: row.address || null,
          loyaltyPoints: parseInt(row.loyaltyPoints || '0'),
          loyaltyTier: row.loyaltyTier || 'BRONZE',
          creditLimit: row.creditLimit ? new Prisma.Decimal(row.creditLimit) : null,
          paymentTermsDays: row.paymentTermsDays ? parseInt(row.paymentTermsDays) : null,
          isActive: row.isActive === 'true' || row.isActive === '1',
        };

        if (existing) {
          // Update existing customer
          await prisma.customer.update({
            where: { id: existing.id },
            data: customerData,
          });
        } else {
          // Create new customer
          await prisma.customer.create({
            data: customerData,
          });
        }

        imported++;
      } catch (error: any) {
        errors.push(`Row ${imported + failed + 1}: ${error.message}`);
        failed++;
      }
    }

    return { imported, failed, errors };
  }
}

export default CSVService;
