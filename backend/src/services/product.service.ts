import {
  Product,
  ProductCategory,
  UnitOfMeasure,
  StorageLocation,
  Prisma,
} from '@prisma/client';
import prisma from '../config/database';
import { ApiError } from '../middlewares/errorHandler';
import AuditService from './audit.service';

export interface CreateProductDTO {
  sku: string;
  barcode?: string;
  name: string;
  category: ProductCategory;
  subcategory?: string;
  unitOfMeasure: UnitOfMeasure;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  minStockLevel?: number;
  storageLocation: StorageLocation;
  shelfLifeDays?: number;
  supplier?: string;
  imageUrl?: string;
  description?: string;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
  isActive?: boolean;
}

export interface ProductFilters {
  search?: string;
  category?: ProductCategory;
  isActive?: boolean;
  storageLocation?: StorageLocation;
}

export interface ProductWithStock extends Product {
  currentStock: number;
}

export class ProductService {
  /**
   * Get all products with filters and pagination
   */
  async getProducts(
    filters: ProductFilters = {},
    page = 1,
    limit = 50
  ): Promise<{ products: ProductWithStock[]; total: number }> {
    const { search, category, isActive, storageLocation } = filters;

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && { category }),
      ...(isActive !== undefined && { isActive }),
      ...(storageLocation && { storageLocation }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          stockBatches: {
            select: {
              quantity: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate current stock for each product
    const productsWithStock: ProductWithStock[] = products.map((product) => {
      const currentStock = product.stockBatches.reduce(
        (sum, batch) => sum + Number(batch.quantity),
        0
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { stockBatches: _, ...productData } = product;

      return {
        ...productData,
        currentStock,
      };
    });

    return { products: productsWithStock, total };
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<ProductWithStock> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockBatches: {
          select: {
            quantity: true,
          },
        },
      },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const currentStock = product.stockBatches.reduce(
      (sum, batch) => sum + Number(batch.quantity),
      0
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { stockBatches: _, ...productData } = product;

    return {
      ...productData,
      currentStock,
    };
  }

  /**
   * Get product by SKU
   */
  async getProductBySKU(sku: string): Promise<ProductWithStock> {
    const product = await prisma.product.findUnique({
      where: { sku },
      include: {
        stockBatches: {
          select: {
            quantity: true,
          },
        },
      },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const currentStock = product.stockBatches.reduce(
      (sum, batch) => sum + Number(batch.quantity),
      0
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { stockBatches: _, ...productData } = product;

    return {
      ...productData,
      currentStock,
    };
  }

  /**
   * Get product by barcode
   */
  async getProductByBarcode(barcode: string): Promise<ProductWithStock> {
    const product = await prisma.product.findUnique({
      where: { barcode },
      include: {
        stockBatches: {
          select: {
            quantity: true,
          },
        },
      },
    });

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const currentStock = product.stockBatches.reduce(
      (sum, batch) => sum + Number(batch.quantity),
      0
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { stockBatches: _, ...productData } = product;

    return {
      ...productData,
      currentStock,
    };
  }

  /**
   * Create new product
   */
  async createProduct(data: CreateProductDTO): Promise<Product> {
    // Check if SKU already exists
    const existingSKU = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSKU) {
      throw new ApiError(400, 'Product with this SKU already exists');
    }

    // Check if barcode already exists (if provided)
    if (data.barcode) {
      const existingBarcode = await prisma.product.findUnique({
        where: { barcode: data.barcode },
      });

      if (existingBarcode) {
        throw new ApiError(400, 'Product with this barcode already exists');
      }
    }

    return prisma.product.create({
      data: {
        ...data,
        costPrice: new Prisma.Decimal(data.costPrice),
        retailPrice: new Prisma.Decimal(data.retailPrice),
        wholesalePrice: new Prisma.Decimal(data.wholesalePrice),
      },
    });
  }

  /**
   * Update product
   */
  async updateProduct(id: string, data: UpdateProductDTO): Promise<Product> {
    // Check if product exists
    await this.getProductById(id);

    // If SKU is being updated, check uniqueness
    if (data.sku) {
      const existingSKU = await prisma.product.findFirst({
        where: {
          sku: data.sku,
          NOT: { id },
        },
      });

      if (existingSKU) {
        throw new ApiError(400, 'Product with this SKU already exists');
      }
    }

    // If barcode is being updated, check uniqueness
    if (data.barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: {
          barcode: data.barcode,
          NOT: { id },
        },
      });

      if (existingBarcode) {
        throw new ApiError(400, 'Product with this barcode already exists');
      }
    }

    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.costPrice && {
          costPrice: new Prisma.Decimal(data.costPrice),
        }),
        ...(data.retailPrice && {
          retailPrice: new Prisma.Decimal(data.retailPrice),
        }),
        ...(data.wholesalePrice && {
          wholesalePrice: new Prisma.Decimal(data.wholesalePrice),
        }),
      },
    });
  }

  /**
   * Delete product (soft delete by setting isActive to false)
   */
  async deleteProduct(id: string): Promise<void> {
    await this.getProductById(id);

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(): Promise<ProductWithStock[]> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        stockBatches: {
          select: {
            quantity: true,
          },
        },
      },
    });

    const lowStockProducts = products
      .map((product) => {
        const currentStock = product.stockBatches.reduce(
          (sum, batch) => sum + Number(batch.quantity),
          0
        );

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { stockBatches: _, ...productData } = product;

        return {
          ...productData,
          currentStock,
        };
      })
      .filter((product) => product.currentStock <= product.minStockLevel);

    return lowStockProducts;
  }
}

export default new ProductService();
