// User types
export type UserRole =
  | 'ADMIN'
  | 'STORE_MANAGER'
  | 'CASHIER'
  | 'COLD_ROOM_ATTENDANT'
  | 'SALES_MANAGER'
  | 'DELIVERY_COORDINATOR'
  | 'DRIVER'
  | 'ACCOUNTANT';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Product types
export type ProductCategory =
  | 'CHICKEN'
  | 'BEEF'
  | 'PORK'
  | 'PRODUCE'
  | 'VALUE_ADDED'
  | 'OTHER';

export type UnitOfMeasure = 'KG' | 'PIECES' | 'TRAYS' | 'BOXES' | 'LITERS';

export type StorageLocation =
  | 'CHILLER'
  | 'FREEZER'
  | 'PRODUCE_SECTION'
  | 'DRY_STORAGE';

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  category: ProductCategory;
  subcategory: string | null;
  unitOfMeasure: UnitOfMeasure;
  costPrice: string;
  retailPrice: string;
  wholesalePrice: string;
  minStockLevel: number;
  storageLocation: StorageLocation;
  shelfLifeDays: number | null;
  supplier: string | null;
  imageUrl: string | null;
  description: string | null;
  isActive: boolean;
  currentStock?: number;
  createdAt: string;
  updatedAt: string;
}

// Customer types
export type CustomerType =
  | 'RETAIL'
  | 'B2B_RESTAURANT'
  | 'B2B_HOTEL'
  | 'B2B_INSTITUTION';

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  customerType: CustomerType;
  address: string | null;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  creditLimit: string | null;
  paymentTermsDays: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Transaction types
export type PaymentMethod =
  | 'CASH'
  | 'MOBILE_MONEY_MTN'
  | 'MOBILE_MONEY_ORANGE'
  | 'CARD'
  | 'CREDIT'
  | 'SPLIT';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Transaction {
  id: string;
  transactionNumber: string;
  customerId: string | null;
  transactionDate: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  isVoided: boolean;
  items: TransactionItem[];
  customer?: Customer | null;
  cashier: {
    id: string;
    name: string;
  };
}

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  notes?: string;
}

// Dashboard types
export interface DashboardKPIs {
  today: {
    revenue: number;
    transactions: number;
    averageOrderValue: number;
    topSellingProducts: Array<{
      productId: string;
      productName: string;
      quantitySold: number;
      revenue: number;
    }>;
    lowStockCount: number;
  };
  thisMonth: {
    revenue: number;
    revenueGrowth: number;
    newCustomers: number;
    activeSubscriptions: number;
    outstandingReceivables: number;
  };
  alerts: {
    lowStock: number;
    nearExpiry: number;
    failedDeliveries: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: unknown;
}
