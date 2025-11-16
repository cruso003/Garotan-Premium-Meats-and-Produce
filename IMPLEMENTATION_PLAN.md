# Garotan Management System - Gap Analysis & Implementation Plan

**Version:** 2.0
**Date:** November 16, 2025
**Status:** CRITICAL GAPS IDENTIFIED - PRODUCTION NOT READY
**Target:** Build Commercial-Grade Enterprise System

---

## Executive Summary

### Current State
The Garotan Management System has a polished UI/UX and basic CRUD functionality but **lacks critical features required for production deployment**. The system has fundamental architectural gaps that will cause operational failures, data integrity issues, and poor user experience in real-world conditions.

### Assessment Rating
- **UI/UX Quality:** ★★★★★ (5/5) - Excellent
- **Basic Functionality:** ★★★☆☆ (3/5) - Works in ideal conditions
- **Production Readiness:** ★☆☆☆☆ (1/5) - Critical gaps
- **Integration Readiness:** ★☆☆☆☆ (1/5) - Not prepared
- **Data Integrity:** ★★☆☆☆ (2/5) - At risk
- **Operational Viability:** ★☆☆☆☆ (1/5) - Unusable in real scenarios

### Risk Assessment
🔴 **HIGH RISK** - Current system will fail in production environment within first week of deployment.

---

## Part 1: Detailed Gap Analysis

### 1. HARDWARE INTEGRATION (CRITICAL - SEVERITY: 🔴 BLOCKER)

#### 1.1 Barcode Scanner Integration
**Status:** ❌ NOT IMPLEMENTED
**Impact:** POS system is unusable for real retail operations
**Business Impact:** Cashiers will take 5-10x longer per transaction, customer queues, lost sales

**What's Missing:**
- Camera-based barcode scanning using device camera
- Bluetooth barcode scanner support (Web Bluetooth API)
- USB barcode scanner support (Web USB API)
- Keyboard wedge scanner support (input event handling)
- Multi-format support (UPC, EAN, Code128, QR codes)
- Audio/visual feedback on successful scan
- Scan history and error handling

**Technical Requirements:**
```typescript
// Required capabilities:
- QuaggaJS or @zxing/browser for camera scanning
- Web Bluetooth API for wireless scanners
- Web USB API for wired scanners
- Input event buffering for keyboard wedge scanners
- Real-time product lookup on scan
- Scan validation and error recovery
```

**Acceptance Criteria:**
- [ ] Can scan barcodes using device camera
- [ ] Can connect to Bluetooth barcode scanners
- [ ] Can receive input from USB scanners
- [ ] Scan-to-add works in POS
- [ ] Scan-to-search works in Products page
- [ ] Audio/visual feedback on scan
- [ ] Handles invalid/unknown barcodes gracefully

---

#### 1.2 Receipt Printer Integration
**Status:** ❌ NOT IMPLEMENTED
**Impact:** No customer receipts = legal compliance issue + unprofessional
**Business Impact:** Customer complaints, legal violations, no transaction proof

**What's Missing:**
- ESC/POS thermal printer protocol support
- Browser Print API integration
- Receipt template system
- Logo/header customization
- Transaction detail formatting
- Reprint capability
- Printer status monitoring
- Multiple printer support (kitchen, counter)

**Technical Requirements:**
```typescript
// Required capabilities:
- ESC/POS command generation library
- Browser Print API or StarPRNT SDK
- Receipt HTML template engine
- PDF generation for non-thermal printers
- Printer auto-detection
- Connection status monitoring
- Print queue management
```

**Receipt Must Include:**
- Business name, address, contact
- Business logo
- Transaction number and timestamp
- Cashier name
- Itemized list (product, qty, price)
- Subtotal, tax breakdown, total
- Payment method and amount
- Change given (if cash)
- Loyalty points earned/balance
- Return policy footer
- QR code for digital receipt

**Acceptance Criteria:**
- [ ] Thermal printer connects successfully
- [ ] Receipt prints automatically after transaction
- [ ] All required information included
- [ ] Receipt is properly formatted
- [ ] Can reprint past receipts
- [ ] Handles printer offline gracefully
- [ ] Supports multiple printers
- [ ] Logo displays correctly

---

#### 1.3 Cash Drawer Integration
**Status:** ❌ NOT IMPLEMENTED
**Impact:** Security risk, manual drawer operation
**Business Impact:** Theft risk, slower checkout, poor cash control

**What's Missing:**
- Cash drawer kick command (via printer)
- Manual open with authorization
- Cash management tracking
- Float/till management
- Cash reconciliation
- Shift reports

**Technical Requirements:**
```typescript
// Required capabilities:
- ESC/POS drawer kick command (0x1B 0x70)
- Authorization requirement for manual open
- Cash movement logging
- Till float tracking
- Shift start/end cash counting
- Variance reporting
```

**Acceptance Criteria:**
- [ ] Drawer opens automatically on cash sale
- [ ] Manager can manually open with auth
- [ ] All drawer opens are logged
- [ ] Shift start float recording
- [ ] Shift end reconciliation
- [ ] Cash variance reporting

---

### 2. PRODUCT DATA MANAGEMENT (CRITICAL - SEVERITY: 🔴 BLOCKER)

#### 2.1 Product Images
**Status:** ❌ NOT IMPLEMENTED
**Impact:** Unprofessional appearance, harder product identification
**Business Impact:** Confusion at POS, longer training time, mistakes

**What's Missing:**
- Image upload functionality
- Image storage (local/S3/Cloudinary)
- Image optimization and resizing
- Multiple images per product
- Image gallery in product modal
- Image display in POS
- Image display in product list
- Default placeholder images
- Image deletion and replacement

**Technical Requirements:**
```typescript
// Backend additions:
- Add imageUrl, images[] to Product schema
- File upload endpoint with multer
- Integration with S3 or Cloudinary
- Image validation (size, format)
- Thumbnail generation
- Image URL generation

// Frontend additions:
- Image upload component with preview
- Drag-and-drop upload
- Multiple image management
- Image cropping/editing (optional)
- Lazy loading for performance
```

**Database Schema Update:**
```prisma
model Product {
  // ... existing fields
  imageUrl        String?           // Primary image
  images          ProductImage[]    // Gallery
}

model ProductImage {
  id              String   @id @default(cuid())
  productId       String
  url             String
  altText         String?
  isPrimary       Boolean  @default(false)
  sortOrder       Int      @default(0)
  createdAt       DateTime @default(now())
  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

**Acceptance Criteria:**
- [ ] Can upload images in product modal
- [ ] Images stored persistently
- [ ] Images display in POS product cards
- [ ] Images display in product list
- [ ] Multiple images per product
- [ ] Can set primary image
- [ ] Can delete images
- [ ] Images are optimized (< 500KB)
- [ ] Placeholder for products without images

---

#### 2.2 Barcode & SKU Generation
**Status:** ⚠️ PARTIALLY IMPLEMENTED
**Impact:** Manual barcode entry is error-prone and slow
**Business Impact:** Data entry errors, duplicate products, time waste

**What's Missing:**
- Auto-generate SKU from category + sequence
- Generate EAN-13 barcodes for products
- Generate internal barcodes if no supplier barcode
- QR code generation for shelf labels
- Barcode validation
- Duplicate barcode detection
- Bulk barcode generation

**Technical Requirements:**
```typescript
// Backend:
- SKU generator service (e.g., CHKN-0001, BEEF-0001)
- EAN-13 barcode generator
- Barcode uniqueness validator
- QR code generator for labels

// Frontend:
- "Auto-generate SKU" button
- "Generate Barcode" button
- Barcode preview
- Print barcode labels function
```

**Acceptance Criteria:**
- [ ] Auto-generate SKU button works
- [ ] SKUs follow pattern: {CATEGORY}-{SEQUENCE}
- [ ] Can generate EAN-13 barcodes
- [ ] Validates barcode uniqueness
- [ ] Prevents duplicate barcodes
- [ ] Can print barcode labels

---

### 3. INVENTORY-PRODUCT SYNCHRONIZATION (CRITICAL - SEVERITY: 🔴 BLOCKER)

#### 3.1 Real-Time Stock Updates
**Status:** ❌ BROKEN ARCHITECTURE
**Impact:** Stock levels are inaccurate, risk of overselling
**Business Impact:** Negative stock, customer disappointment, inventory chaos

**Current Problem:**
- `Product.currentStock` is NOT a real field in database
- Stock is stored in `StockBatch` table
- Frontend assumes `currentStock` is real-time
- No automatic recalculation after transactions
- Products page and Inventory page show different data

**Required Architecture Fix:**
```typescript
// Option A: Virtual Field (Current approach - needs fixing)
// Calculate currentStock on every query
// Pros: Always accurate
// Cons: Slower queries

// Option B: Cached Field with Triggers (RECOMMENDED)
// Add currentStock to Product table
// Update via database triggers on StockBatch changes
// Pros: Fast queries, guaranteed accuracy
// Cons: Requires database triggers

// Option C: Event-Driven Updates
// Update Product.currentStock via event handlers
// Pros: Flexible, testable
// Cons: Potential race conditions
```

**Recommended Solution:**
```prisma
model Product {
  // ... existing fields
  currentStock    Decimal  @default(0) @db.Decimal(10, 2)
  lastStockUpdate DateTime @default(now())

  // Add index for performance
  @@index([currentStock])
}

// Create StockUpdateService
class StockUpdateService {
  // Recalculate stock from batches
  async updateProductStock(productId: string): Promise<void>

  // Batch update all products
  async syncAllProductStocks(): Promise<void>

  // Real-time update on transaction
  async handleTransactionComplete(transactionId: string): Promise<void>
}
```

**Acceptance Criteria:**
- [ ] Product stock updates immediately after sale
- [ ] Product stock updates after receiving stock
- [ ] Product stock updates after adjustment
- [ ] Products page shows accurate stock
- [ ] Inventory page shows same stock as Products
- [ ] Low stock alerts trigger correctly
- [ ] Cannot sell more than available stock
- [ ] Stock batch details visible in Products view

---

#### 3.2 Stock Batch Visibility
**Status:** ❌ NOT IMPLEMENTED
**Impact:** FIFO system exists but users can't see/manage batches
**Business Impact:** Expired products sold, waste, customer safety issues

**What's Missing:**
- View stock batches per product
- Expiry date display and sorting
- Manual batch selection for sales (override FIFO)
- Batch transfer between locations
- Batch adjustment
- Expired batch handling
- Near-expiry alerts in product view

**Required Features:**
```typescript
// Product modal should show:
interface ProductStockBatchView {
  batchNumber: string;
  quantity: number;
  receivedDate: Date;
  expiryDate: Date | null;
  daysUntilExpiry: number | null;
  location: StorageLocation;
  supplier?: string;
}

// Actions needed:
- View all batches for a product
- Adjust batch quantity
- Mark batch as damaged/expired
- Transfer batch to another location
- Override FIFO (sell specific batch)
```

**Acceptance Criteria:**
- [ ] Product details show all batches
- [ ] Batches sorted by expiry (FIFO)
- [ ] Can adjust individual batch qty
- [ ] Can mark batch as expired
- [ ] Expiry warnings visible
- [ ] Can view batch history

---

### 4. POS-CUSTOMER INTEGRATION (CRITICAL - SEVERITY: 🔴 BLOCKER)

#### 4.1 Customer Search & Selection
**Status:** ❌ NOT FUNCTIONAL
**Impact:** Loyalty program is useless if not used at POS
**Business Impact:** Lost customer data, no personalization, loyalty program ROI = 0

**What's Missing:**
- Customer search modal in POS
- Quick search by phone number
- Customer auto-complete
- Recent customers list
- Customer details display
- Purchase history in POS
- Quick customer creation during checkout

**Required Implementation:**
```typescript
// Customer Search Modal Component
interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

// Features:
- Search by name, phone, email
- Real-time search results
- Show customer loyalty tier and points
- Display last purchase date
- Quick create new customer button
- Recent customers shortcuts
```

**Acceptance Criteria:**
- [ ] Customer search modal opens from POS
- [ ] Can search by phone (fastest)
- [ ] Can search by name
- [ ] Shows loyalty tier and points
- [ ] Can select customer for transaction
- [ ] Can create new customer quickly
- [ ] Selected customer persists in session

---

#### 4.2 Loyalty Points Integration
**Status:** ❌ NOT FUNCTIONAL
**Impact:** Loyalty program exists but doesn't work at POS
**Business Impact:** Customer dissatisfaction, program is worthless

**What's Missing:**
- Display available points at checkout
- Points redemption workflow
- Points earning calculation preview
- Points redemption discount application
- Tier upgrade notifications
- Points expiry warnings
- Transaction-level points tracking

**Required Implementation:**
```typescript
// POS Loyalty Integration
interface LoyaltyCheckoutInfo {
  availablePoints: number;
  currentTier: LoyaltyTier;
  pointsToNextTier: number;
  pointsEarningOnThisSale: number;
  pointsRedeemable: number;
  redemptionValue: number; // LRD value
}

// Redemption flow:
1. Show available points
2. Customer chooses to redeem (e.g., 100 pts = LRD 100)
3. Apply discount to transaction
4. Calculate remaining points
5. Show new point balance on receipt
```

**Business Rules:**
```typescript
// Points earning: 1 point per LRD 10 spent
// Points redemption: 1 point = LRD 1 discount
// Minimum redemption: 50 points
// Maximum redemption: 50% of transaction total
// Points expiry: 12 months from earning date

// Tier benefits:
- Bronze: 1x points
- Silver: 1.25x points
- Gold: 1.5x points
```

**Acceptance Criteria:**
- [ ] Available points display in POS
- [ ] Can redeem points for discount
- [ ] Points earning calculated correctly
- [ ] Points balance updates after transaction
- [ ] Receipt shows points earned/redeemed
- [ ] Tier upgrade triggers notification
- [ ] Cannot redeem more than allowed

---

### 5. DATA INTEGRITY & CONCURRENCY (CRITICAL - SEVERITY: 🔴 BLOCKER)

#### 5.1 Transaction Locking
**Status:** ❌ NOT IMPLEMENTED
**Impact:** Two cashiers can sell same stock = negative inventory
**Business Impact:** Inventory chaos, accounting errors, customer overselling

**Current Problem:**
```typescript
// Scenario: Race Condition
// Product has 5 units in stock
// 10:00:00 - Cashier A starts selling 3 units
// 10:00:01 - Cashier B starts selling 3 units
// 10:00:02 - Cashier A completes (stock: 2)
// 10:00:03 - Cashier B completes (stock: -1) ❌ NEGATIVE STOCK!
```

**Required Solution:**
```typescript
// Optimistic Locking with Version Field
model Product {
  // ... existing fields
  version         Int      @default(1)
}

model StockBatch {
  // ... existing fields
  version         Int      @default(1)
}

// Transaction service update
async createTransaction(data: CreateTransactionDTO) {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock stock batches for update
    const batches = await tx.stockBatch.findMany({
      where: { productId: { in: productIds } },
      orderBy: { expiryDate: 'asc' },
    });

    // 2. Check stock availability
    for (const item of data.items) {
      const available = calculateAvailableStock(batches, item.productId);
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for ${item.productId}`);
      }
    }

    // 3. Allocate stock with version check
    for (const allocation of allocations) {
      const updated = await tx.stockBatch.updateMany({
        where: {
          id: allocation.batchId,
          version: allocation.expectedVersion,
        },
        data: {
          quantity: { decrement: allocation.quantity },
          version: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new Error('Stock was modified by another transaction');
      }
    }

    // 4. Create transaction
    // 5. Update product stock
    // 6. Create loyalty transaction
  });
}
```

**Acceptance Criteria:**
- [ ] Concurrent transactions don't cause negative stock
- [ ] Race conditions handled gracefully
- [ ] User gets clear error if stock changed
- [ ] Transaction either completes fully or rolls back
- [ ] No partial stock deductions
- [ ] Audit trail of all stock changes

---

#### 5.2 Stock Validation
**Status:** ⚠️ BACKEND ONLY
**Impact:** Frontend doesn't prevent impossible sales
**Business Impact:** Poor UX, unnecessary error messages

**What's Missing:**
- Real-time stock check before adding to cart
- Visual indication of available stock
- Prevent adding more than available
- Warning when approaching stock limit
- Suggested quantity based on availability

**Required Implementation:**
```typescript
// POS Component Enhancement
const addToCart = async (product: Product) => {
  // 1. Check current stock
  const stockCheck = await api.get(`/products/${product.id}/stock-available`);

  if (stockCheck.data.available === 0) {
    toast.error('Product is out of stock');
    return;
  }

  const currentQtyInCart = cart.find(i => i.productId === product.id)?.quantity || 0;
  const newQty = currentQtyInCart + 1;

  if (newQty > stockCheck.data.available) {
    toast.warning(`Only ${stockCheck.data.available} units available`);
    return;
  }

  // Proceed with add to cart
};
```

**Acceptance Criteria:**
- [ ] Stock checked before adding to cart
- [ ] Cannot add more than available
- [ ] Clear message when out of stock
- [ ] Warning when low stock
- [ ] Cart validates stock before checkout
- [ ] Backend double-checks on transaction

---

### 6. AUDIT TRAIL & ACCOUNTABILITY (CRITICAL - SEVERITY: 🔴 BLOCKER)

#### 6.1 Activity Logging
**Status:** ⚠️ PARTIAL - Schema exists, not used
**Impact:** No accountability when things go wrong
**Business Impact:** Cannot track who changed prices, deleted products, voided transactions

**What's Missing:**
- Log all CRUD operations
- Track user, timestamp, before/after values
- Log authentication events
- Log permission changes
- Log system configuration changes
- Searchable audit log UI
- Audit log export

**Required Implementation:**
```typescript
// Audit Log Service
interface AuditLogEntry {
  id: string;
  userId: string;
  action: AuditAction; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VOID_TRANSACTION
  entityType: string; // Product, Customer, Transaction, User, etc.
  entityId: string;
  before: any; // JSON snapshot before change
  after: any; // JSON snapshot after change
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Auto-logging middleware
class AuditMiddleware {
  async logChange(req: Request, entityType: string, entityId: string, before: any, after: any) {
    await prisma.activityLog.create({
      data: {
        userId: req.user.userId,
        action: req.method === 'POST' ? 'CREATE' : req.method === 'PUT' ? 'UPDATE' : 'DELETE',
        entityType,
        entityId,
        description: `${req.user.name} ${action} ${entityType} ${entityId}`,
        metadata: { before, after, ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      },
    });
  }
}
```

**High-Value Audit Events:**
- Product price changed
- Product deleted
- Stock adjusted
- Transaction voided
- User created/deleted
- Permission changed
- Large discount applied
- Credit limit exceeded
- Manual drawer open

**Audit Log UI Requirements:**
- Filter by user, date range, entity type
- Search by entity ID
- View before/after diff
- Export to CSV
- Alert on suspicious activities
- Dashboard widget for recent changes

**Acceptance Criteria:**
- [ ] All entity changes logged
- [ ] User and timestamp recorded
- [ ] Before/after values captured
- [ ] Audit log searchable
- [ ] Can filter by user/date/type
- [ ] Can export audit trail
- [ ] Immutable audit records

---

### 7. BATCH OPERATIONS (CRITICAL - SEVERITY: 🔴 BLOCKER)

#### 7.1 Data Import/Export
**Status:** ❌ NOT IMPLEMENTED
**Impact:** Cannot efficiently load initial data or backup
**Business Impact:** Days of manual data entry, no disaster recovery

**What's Missing:**
- Excel/CSV import for products
- Excel/CSV import for customers
- Excel/CSV import for stock batches
- Data export for all entities
- Import validation and error reporting
- Duplicate detection during import
- Bulk update via import
- Import templates

**Required Features:**

**Product Import:**
```typescript
// Excel columns:
- SKU* (required)
- Name*
- Description
- Category*
- Unit of Measure*
- Cost Price*
- Retail Price*
- Wholesale Price
- Min Stock Level*
- Barcode
- Storage Location*
- Shelf Life (days)
- Active (Yes/No)

// Validation:
- Check required fields
- Validate SKU uniqueness
- Validate barcode uniqueness
- Validate category enum
- Validate prices (cost < retail)
- Check for existing products (update vs create)

// Error reporting:
- Row-by-row validation results
- Download error report with issues
- Partial import option (skip errors)
```

**Stock Batch Import:**
```typescript
// Excel columns:
- Product SKU*
- Batch Number*
- Quantity*
- Received Date*
- Expiry Date
- Supplier
- Storage Location

// Complex logic:
- Find product by SKU
- Generate batch number if not provided
- Validate expiry > received date
- Check storage location capacity
- Update product current stock
```

**Export Features:**
- Export all products to Excel
- Export filtered products
- Export customers with purchase history
- Export transactions for date range
- Export stock batches by product
- Export inventory valuation report
- Schedule automated exports

**Acceptance Criteria:**
- [ ] Can import products from Excel
- [ ] Can import customers from Excel
- [ ] Can import stock batches from Excel
- [ ] Validation errors displayed clearly
- [ ] Can download error report
- [ ] Can export all entities to Excel
- [ ] Export includes all relevant fields
- [ ] Import/export templates provided

---

#### 7.2 Bulk Operations
**Status:** ❌ NOT IMPLEMENTED
**Impact:** Cannot efficiently manage large datasets
**Business Impact:** Time waste, pricing errors, operational inefficiency

**What's Missing:**
- Bulk price update (by category, by supplier)
- Bulk stock adjustment
- Bulk product activation/deactivation
- Bulk barcode generation
- Bulk delete with confirmation
- Bulk tag/category assignment
- Bulk discount application

**Required Features:**
```typescript
// Bulk Price Update
interface BulkPriceUpdateDTO {
  productIds?: string[]; // Specific products
  category?: ProductCategory; // All in category
  priceChangeType: 'PERCENTAGE' | 'FIXED_AMOUNT'; // +10% or +50 LRD
  priceChangeValue: number;
  applyTo: 'COST' | 'RETAIL' | 'WHOLESALE' | 'ALL';
  effectiveDate?: Date;
}

// Example: Increase all BEEF products retail price by 10%
// Example: Add 50 LRD to all PRODUCE wholesale prices
```

**Acceptance Criteria:**
- [ ] Can update prices in bulk
- [ ] Preview changes before applying
- [ ] Confirmation required
- [ ] Changes logged in audit trail
- [ ] Can undo bulk changes
- [ ] Performance optimized for 1000+ products

---

### 8. ADVANCED PERMISSIONS (ESSENTIAL - SEVERITY: 🟡 HIGH)

#### 8.1 Granular RBAC
**Status:** ⚠️ BASIC ROLE CHECK ONLY
**Impact:** Cashiers see cost prices, anyone can delete anything
**Business Impact:** Information leakage, security risk, fraud potential

**Current Problem:**
```typescript
// Current: Role-based only
authorize('ADMIN', 'STORE_MANAGER') // Binary: allowed or not

// Need: Granular permissions
- Can view products but not cost prices
- Can create transactions but not void
- Can adjust stock but needs approval
- Can give discount up to 10% only
- Can view reports but not export
```

**Required Permission System:**
```typescript
// Permission structure
enum Permission {
  // Products
  PRODUCT_VIEW = 'product:view',
  PRODUCT_VIEW_COST = 'product:view:cost',
  PRODUCT_CREATE = 'product:create',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_UPDATE_PRICE = 'product:update:price',
  PRODUCT_DELETE = 'product:delete',

  // Transactions
  TRANSACTION_CREATE = 'transaction:create',
  TRANSACTION_VOID = 'transaction:void',
  TRANSACTION_APPLY_DISCOUNT = 'transaction:discount',
  TRANSACTION_OVERRIDE_PRICE = 'transaction:override_price',

  // Stock
  STOCK_VIEW = 'stock:view',
  STOCK_ADJUST = 'stock:adjust',
  STOCK_RECEIVE = 'stock:receive',
  STOCK_TRANSFER = 'stock:transfer',

  // Customers
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_VIEW_CREDIT = 'customer:view:credit',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',

  // Reports
  REPORT_VIEW_SALES = 'report:view:sales',
  REPORT_VIEW_INVENTORY = 'report:view:inventory',
  REPORT_VIEW_FINANCIAL = 'report:view:financial',
  REPORT_EXPORT = 'report:export',

  // System
  USER_MANAGE = 'user:manage',
  SETTINGS_MANAGE = 'settings:manage',
  AUDIT_LOG_VIEW = 'audit:view',
  CASH_DRAWER_OPEN = 'cash_drawer:open',
}

// Role-Permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [/* all permissions */],
  STORE_MANAGER: [
    Permission.PRODUCT_VIEW,
    Permission.PRODUCT_VIEW_COST,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    // ... more permissions
  ],
  CASHIER: [
    Permission.PRODUCT_VIEW,
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_APPLY_DISCOUNT, // up to limit
    Permission.CUSTOMER_VIEW,
    // NO: PRODUCT_VIEW_COST, TRANSACTION_VOID, STOCK_ADJUST
  ],
  // ... other roles
};
```

**Discount/Price Override Limits:**
```typescript
interface DiscountPolicy {
  role: UserRole;
  maxDiscountPercent: number;
  requiresApproval: boolean;
  approverRole?: UserRole;
}

const discountPolicies: DiscountPolicy[] = [
  {
    role: 'CASHIER',
    maxDiscountPercent: 5,
    requiresApproval: false,
  },
  {
    role: 'CASHIER',
    maxDiscountPercent: 20, // 5-20% range
    requiresApproval: true,
    approverRole: 'STORE_MANAGER',
  },
  {
    role: 'STORE_MANAGER',
    maxDiscountPercent: 50,
    requiresApproval: false,
  },
];
```

**Approval Workflow:**
```typescript
// Scenario: Cashier gives 15% discount
1. Cashier enters discount (exceeds 5% limit)
2. System prompts for manager approval
3. Manager enters PIN or swipes card
4. System validates manager permission
5. Discount applied with both users logged
```

**Acceptance Criteria:**
- [ ] Granular permissions implemented
- [ ] Cashiers cannot see cost prices
- [ ] Discount limits enforced
- [ ] Approval workflow functional
- [ ] Permission checks on frontend and backend
- [ ] Unauthorized actions blocked
- [ ] Audit log tracks permission grants

---

### 9. ERROR RECOVERY & RESILIENCE (ESSENTIAL - SEVERITY: 🟡 HIGH)

#### 9.1 Draft Transactions
**Status:** ❌ NOT IMPLEMENTED
**Impact:** Cart lost if error/crash/logout
**Business Impact:** Customer waits while cashier re-enters everything

**What's Missing:**
- Auto-save cart to local storage
- Resume cart after page refresh
- Save cart on logout
- Multiple saved carts per cashier
- Named/tagged carts (e.g., "Table 5")
- Cart expiry after 24 hours

**Required Implementation:**
```typescript
// Draft cart storage
interface DraftCart {
  id: string;
  cashierId: string;
  customerId?: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  tags?: string[]; // ["Table 5", "Phone Order"]
}

// Auto-save behavior
useEffect(() => {
  if (cart.length > 0) {
    const draft = {
      id: draftId || generateId(),
      cashierId: user.userId,
      customerId: selectedCustomer?.id,
      items: cart,
      updatedAt: new Date(),
    };
    localStorage.setItem('pos_draft_cart', JSON.stringify(draft));
  }
}, [cart]);

// Resume on load
useEffect(() => {
  const saved = localStorage.getItem('pos_draft_cart');
  if (saved) {
    const draft = JSON.parse(saved);
    if (new Date(draft.expiresAt) > new Date()) {
      // Show modal: "Resume previous cart?"
      setCart(draft.items);
      setSelectedCustomer(draft.customerId);
    }
  }
}, []);
```

**Acceptance Criteria:**
- [ ] Cart auto-saves every 5 seconds
- [ ] Cart persists across page refresh
- [ ] Cart persists across logout/login
- [ ] Can have multiple saved carts
- [ ] Can name/tag carts
- [ ] Can delete saved carts
- [ ] Old carts auto-expire

---

#### 9.2 Transaction Retry Mechanism
**Status:** ❌ NOT IMPLEMENTED
**Impact:** Network error = lost sale, start over
**Business Impact:** Customer frustration, operational delays

**What's Missing:**
- Idempotency key for transactions
- Automatic retry on network failure
- Transaction status tracking
- Recovery from partial completion
- User-friendly error messages

**Required Implementation:**
```typescript
// Idempotent transaction creation
interface CreateTransactionDTO {
  idempotencyKey: string; // Client-generated UUID
  // ... other fields
}

// Backend: Check for duplicate idempotency key
async createTransaction(dto: CreateTransactionDTO) {
  // Check if transaction with this key exists
  const existing = await prisma.transaction.findUnique({
    where: { idempotencyKey: dto.idempotencyKey },
  });

  if (existing) {
    return existing; // Return existing transaction (safe retry)
  }

  // Proceed with transaction creation
}

// Frontend: Retry with exponential backoff
const handleCheckout = async () => {
  const idempotencyKey = generateUUID();
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const result = await api.post('/transactions', {
        idempotencyKey,
        ...transactionData,
      });
      return result;
    } catch (error) {
      attempts++;
      if (attempts === maxAttempts) throw error;
      await sleep(1000 * Math.pow(2, attempts)); // 2s, 4s
    }
  }
};
```

**Acceptance Criteria:**
- [ ] Transaction retry doesn't create duplicates
- [ ] Network errors retry automatically
- [ ] User sees retry progress
- [ ] Transaction status tracked
- [ ] Can manually retry failed transaction
- [ ] Clear error messages
- [ ] Graceful degradation

---

### 10. REPORTING & ANALYTICS (ESSENTIAL - SEVERITY: 🟡 HIGH)

#### 10.1 Real Analytics Implementation
**Status:** ❌ MOCK DATA
**Impact:** Reports page shows fake data
**Business Impact:** Cannot make data-driven decisions

**Current Problem:**
- Charts show hardcoded demo data
- No real sales trend calculation
- No category sales aggregation
- Period selector doesn't work
- Export button does nothing

**Required Implementation:**
```typescript
// Backend: Real analytics endpoints

// GET /api/reports/sales-trends?period=month
interface SalesTrendDataPoint {
  date: string; // "2025-11-01"
  revenue: number;
  transactions: number;
  averageOrderValue: number;
}

// SQL query needed:
SELECT
  DATE(transactionDate) as date,
  SUM(total) as revenue,
  COUNT(*) as transactions,
  AVG(total) as averageOrderValue
FROM Transaction
WHERE transactionDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(transactionDate)
ORDER BY date ASC;

// GET /api/reports/sales-by-category
interface CategorySalesData {
  category: ProductCategory;
  revenue: number;
  quantity: number;
  transactions: number;
  averagePrice: number;
}

// SQL query:
SELECT
  p.category,
  SUM(ti.quantity * ti.unitPrice) as revenue,
  SUM(ti.quantity) as quantity,
  COUNT(DISTINCT t.id) as transactions,
  AVG(ti.unitPrice) as averagePrice
FROM TransactionItem ti
JOIN Transaction t ON ti.transactionId = t.id
JOIN Product p ON ti.productId = p.id
WHERE t.transactionDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.category
ORDER BY revenue DESC;

// GET /api/reports/top-products?period=month&limit=10
// GET /api/reports/hourly-sales
// GET /api/reports/payment-methods
```

**Export Functionality:**
```typescript
// PDF export using jsPDF
const exportToPDF = async () => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('Garotan Premium Meats & Produce', 20, 20);
  doc.setFontSize(12);
  doc.text(`Sales Report - ${period}`, 20, 30);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40);

  // Sales trend chart as image
  const chartCanvas = document.querySelector('canvas');
  const chartImage = chartCanvas.toDataURL();
  doc.addImage(chartImage, 'PNG', 20, 50, 170, 80);

  // Category table
  doc.autoTable({
    head: [['Category', 'Revenue', 'Quantity']],
    body: categorySales.map(c => [c.category, formatCurrency(c.revenue), c.quantity]),
    startY: 140,
  });

  doc.save(`sales-report-${period}.pdf`);
};
```

**Acceptance Criteria:**
- [ ] Sales trends show real data
- [ ] Period selector changes data
- [ ] Category sales accurate
- [ ] Top products calculated correctly
- [ ] Export PDF works
- [ ] Exported PDF includes all charts
- [ ] Data updates in real-time

---

### 11. MULTI-LOCATION SUPPORT (NICE-TO-HAVE - SEVERITY: 🟢 MEDIUM)

#### 11.1 Location Management
**Status:** ❌ NOT IMPLEMENTED
**Impact:** Single store only, cannot scale
**Business Impact:** Cannot expand to multiple locations

**What's Missing:**
- Location/Store entity
- Stock per location
- Transfer between locations
- Location-specific pricing
- Location-specific reports
- Multi-location dashboard

**Database Schema:**
```prisma
model Location {
  id              String    @id @default(cuid())
  name            String
  code            String    @unique // "MAIN", "BRANCH1"
  address         String
  phone           String
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())

  // Relations
  stockBatches    StockBatch[]
  transactions    Transaction[]
  users           User[]
}

// Update StockBatch
model StockBatch {
  // ... existing fields
  locationId      String
  location        Location  @relation(fields: [locationId], references: [id])
}

// Stock becomes location-specific
// Product.currentStock becomes calculated per location
```

**Features:**
- Create/manage locations
- Assign users to locations
- View stock by location
- Transfer stock between locations
- Location-specific sales reports
- Consolidated multi-location reports

**Acceptance Criteria:**
- [ ] Can create multiple locations
- [ ] Stock tracked per location
- [ ] Can transfer stock
- [ ] Reports filter by location
- [ ] Users assigned to location
- [ ] Cannot see other location's data (unless admin)

---

## Part 2: Implementation Plan

### Overview
**Total Duration:** 12 weeks
**Team Size:** 1 full-stack developer (you + me)
**Approach:** Iterative, with weekly deployments
**Testing Strategy:** Unit tests + E2E tests + Manual QA

---

### Phase 1: Foundation & Critical Gaps (Weeks 1-4)

#### Week 1: Hardware Integration & Product Images
**Goal:** Make POS actually usable for real checkout

**Day 1-2: Barcode Scanning**
- [ ] Install `@zxing/browser` library
- [ ] Create BarcodeScanner component
- [ ] Implement camera scanning
- [ ] Add Web Bluetooth scanner support
- [ ] Test with real barcode scanner device
- [ ] Integrate scan-to-search in POS
- [ ] Add visual/audio feedback

**Day 3-4: Product Images**
- [ ] Add `imageUrl` and `images` to Product schema
- [ ] Migrate database
- [ ] Install Cloudinary SDK (or setup S3)
- [ ] Create image upload endpoint
- [ ] Create ImageUpload component
- [ ] Add image gallery to ProductModal
- [ ] Update POS to display images
- [ ] Add default placeholder images

**Day 5: Receipt Printing**
- [ ] Research ESC/POS libraries
- [ ] Install receipt printer SDK
- [ ] Create receipt template
- [ ] Implement print function
- [ ] Test with thermal printer
- [ ] Add business logo to receipt
- [ ] Add reprint functionality

**Deliverables:**
- ✅ Barcode scanning works
- ✅ Products have images
- ✅ Receipts print

---

#### Week 2: Inventory-Product Sync & Stock Validation
**Goal:** Fix broken architecture, ensure data integrity

**Day 1-2: Stock Synchronization**
- [ ] Add `currentStock` field to Product table
- [ ] Create StockUpdateService
- [ ] Implement `updateProductStock()` method
- [ ] Add event handlers for transaction complete
- [ ] Add event handlers for stock receive
- [ ] Add event handlers for stock adjustment
- [ ] Create migration to calculate existing stock
- [ ] Test stock updates

**Day 3: Stock Batch Visibility**
- [ ] Create StockBatchList component
- [ ] Add batch view to ProductModal
- [ ] Show expiry dates and warnings
- [ ] Add batch adjustment functionality
- [ ] Show FIFO order in UI
- [ ] Add near-expiry indicators

**Day 4-5: Concurrency & Validation**
- [ ] Add `version` field to StockBatch
- [ ] Implement optimistic locking
- [ ] Add stock validation in POS
- [ ] Prevent overselling in cart
- [ ] Add real-time stock check API
- [ ] Handle concurrent transaction errors
- [ ] Add comprehensive tests

**Deliverables:**
- ✅ Stock levels always accurate
- ✅ Cannot sell more than available
- ✅ Batch details visible
- ✅ Concurrent transactions handled

---

#### Week 3: Customer POS Integration & Loyalty
**Goal:** Make loyalty program actually work

**Day 1-2: Customer Search Modal**
- [ ] Create CustomerSearchModal component
- [ ] Implement search by phone (primary)
- [ ] Implement search by name
- [ ] Show loyalty tier and points
- [ ] Add quick customer creation
- [ ] Integrate into POS
- [ ] Save customer to transaction

**Day 3-4: Loyalty Points Integration**
- [ ] Display available points in POS
- [ ] Show points earning calculation
- [ ] Implement points redemption UI
- [ ] Add redemption validation
- [ ] Calculate discount from points
- [ ] Update points after transaction
- [ ] Show new balance on receipt

**Day 5: Testing & Polish**
- [ ] Test full customer flow
- [ ] Test loyalty calculations
- [ ] Test tier upgrades
- [ ] Add notification for tier upgrade
- [ ] Polish UI/UX
- [ ] Add help text

**Deliverables:**
- ✅ Customer search works in POS
- ✅ Loyalty points redeemable
- ✅ Points earned on purchases
- ✅ Receipt shows loyalty info

---

#### Week 4: Audit Trail & Batch Operations
**Goal:** Accountability and operational efficiency

**Day 1-2: Audit Logging**
- [ ] Create ActivityLog middleware
- [ ] Auto-log all CRUD operations
- [ ] Capture before/after state
- [ ] Log authentication events
- [ ] Log permission-sensitive actions
- [ ] Create audit log viewer UI
- [ ] Add search and filters

**Day 3-4: Data Import/Export**
- [ ] Create Excel import service
- [ ] Implement product import with validation
- [ ] Implement customer import
- [ ] Implement stock batch import
- [ ] Create import templates
- [ ] Create export service (all entities)
- [ ] Add import/export UI

**Day 5: Bulk Operations**
- [ ] Implement bulk price update
- [ ] Implement bulk stock adjustment
- [ ] Add confirmation modals
- [ ] Add preview before apply
- [ ] Log all bulk operations
- [ ] Test with large datasets

**Deliverables:**
- ✅ All changes logged
- ✅ Can import/export Excel
- ✅ Bulk operations functional
- ✅ Audit trail searchable

---

### Phase 2: Advanced Features & Scale (Weeks 5-8)

#### Week 5: Advanced Permissions & Approval Workflows
**Goal:** Granular security and discount controls

**Day 1-2: Permission System**
- [ ] Define all granular permissions
- [ ] Create permission constants
- [ ] Implement role-permission mapping
- [ ] Add permission check middleware
- [ ] Update frontend components
- [ ] Hide cost prices from cashiers
- [ ] Add permission-based UI rendering

**Day 3-4: Discount & Price Override Workflow**
- [ ] Define discount policies
- [ ] Implement discount limit checks
- [ ] Create approval request modal
- [ ] Implement manager PIN entry
- [ ] Validate approver permissions
- [ ] Log approval events
- [ ] Test approval flow

**Day 5: Testing**
- [ ] Test all permission combinations
- [ ] Test approval workflows
- [ ] Security testing
- [ ] Document permissions

**Deliverables:**
- ✅ Granular permissions enforced
- ✅ Discount limits working
- ✅ Approval workflow functional
- ✅ Security hardened

---

#### Week 6: Multi-Location Support
**Goal:** Enable business expansion

**Day 1: Schema & Migration**
- [ ] Add Location model
- [ ] Update StockBatch with locationId
- [ ] Update Transaction with locationId
- [ ] Update User with locationId
- [ ] Create migration
- [ ] Migrate existing data to default location

**Day 2-3: Location Management**
- [ ] Create location CRUD UI
- [ ] Implement location selection
- [ ] Filter stock by location
- [ ] Filter reports by location
- [ ] Assign users to locations
- [ ] Test multi-location scenarios

**Day 4-5: Stock Transfer**
- [ ] Create transfer request entity
- [ ] Implement transfer workflow
- [ ] Create transfer UI
- [ ] Add approval for transfers
- [ ] Update stock on transfer complete
- [ ] Log all transfers

**Deliverables:**
- ✅ Multiple locations supported
- ✅ Stock per location
- ✅ Transfer between locations
- ✅ Location-specific reports

---

#### Week 7: Error Recovery & Resilience
**Goal:** Bulletproof the system

**Day 1-2: Draft Transactions**
- [ ] Implement auto-save cart
- [ ] Add cart resume on reload
- [ ] Support multiple saved carts
- [ ] Add cart naming/tagging
- [ ] Implement cart expiry
- [ ] Test recovery scenarios

**Day 3-4: Retry Mechanisms**
- [ ] Add idempotency keys
- [ ] Implement retry logic
- [ ] Add transaction status tracking
- [ ] Improve error messages
- [ ] Add offline detection
- [ ] Queue transactions when offline

**Day 5: Offline POS (Basic)**
- [ ] Setup Service Worker
- [ ] Cache product data
- [ ] Implement IndexedDB storage
- [ ] Queue transactions offline
- [ ] Sync when online
- [ ] Test offline mode

**Deliverables:**
- ✅ Draft carts working
- ✅ Network errors handled
- ✅ Basic offline POS
- ✅ System is resilient

---

#### Week 8: Real Analytics & Reporting
**Goal:** Data-driven decision making

**Day 1-2: Sales Analytics**
- [ ] Implement sales trend SQL queries
- [ ] Create `/reports/sales-trends` endpoint
- [ ] Implement category sales aggregation
- [ ] Create `/reports/sales-by-category` endpoint
- [ ] Implement top products report
- [ ] Add hourly sales breakdown

**Day 3: Advanced Reports**
- [ ] Payment method breakdown
- [ ] Customer analytics (lifetime value, frequency)
- [ ] Stock turnover report
- [ ] Profit margin analysis
- [ ] Low performer identification
- [ ] Forecast demand (basic)

**Day 4-5: Export & Visualization**
- [ ] Implement PDF export
- [ ] Add Excel export for raw data
- [ ] Improve chart visualizations
- [ ] Add date range selector
- [ ] Add comparison (vs previous period)
- [ ] Schedule automated reports (email)

**Deliverables:**
- ✅ Real analytics data
- ✅ All reports accurate
- ✅ Export functionality
- ✅ Business insights available

---

### Phase 3: Integration Readiness (Weeks 9-10)

#### Week 9: API Preparation for Mobile/Marketplace
**Goal:** Prepare for future integrations

**Day 1-2: API Versioning**
- [ ] Implement `/api/v1/` routing
- [ ] Document all endpoints with OpenAPI
- [ ] Version all responses
- [ ] Setup API deprecation strategy
- [ ] Add API version header support

**Day 3-4: Mobile-Optimized Endpoints**
- [ ] Create `/v1/mobile/products` (optimized payloads)
- [ ] Create `/v1/mobile/orders` (order history)
- [ ] Implement pagination metadata
- [ ] Add product availability check
- [ ] Optimize image sizes for mobile
- [ ] Add offline sync endpoints

**Day 5: Marketplace Endpoints**
- [ ] Create public catalog API
- [ ] Implement product search/filter
- [ ] Add order creation webhook
- [ ] Setup delivery zone check
- [ ] Add order status notifications

**Deliverables:**
- ✅ API versioned
- ✅ Mobile endpoints ready
- ✅ Marketplace APIs documented
- ✅ Integration guide created

---

#### Week 10: WhatsApp & Social Media Preparation
**Goal:** Multi-channel sales readiness

**Day 1-2: WhatsApp Business API**
- [ ] Research WhatsApp Business API
- [ ] Setup webhook endpoints
- [ ] Implement message parsing
- [ ] Create order from WhatsApp message
- [ ] Send order confirmation
- [ ] Add catalog sync

**Day 3: Facebook/Instagram Integration**
- [ ] Research Facebook Graph API
- [ ] Create product catalog export
- [ ] Setup webhook for orders
- [ ] Import orders from social media
- [ ] Mark as "Online Order" source

**Day 4-5: Multi-Channel Inventory**
- [ ] Track inventory across channels
- [ ] Sync stock to external platforms
- [ ] Handle external order imports
- [ ] Consolidate reporting
- [ ] Test full integration flow

**Deliverables:**
- ✅ WhatsApp orders possible
- ✅ Social media integration ready
- ✅ Multi-channel inventory tracked
- ✅ All sales channels unified

---

### Phase 4: Polish & Production (Weeks 11-12)

#### Week 11: Testing & Optimization

**Day 1-2: Performance Optimization**
- [ ] Database query optimization
- [ ] Add database indexes
- [ ] Implement caching (Redis)
- [ ] Frontend bundle optimization
- [ ] Image lazy loading
- [ ] API response compression

**Day 3-4: Comprehensive Testing**
- [ ] Unit test coverage > 80%
- [ ] E2E test critical flows
- [ ] Load testing (100 concurrent users)
- [ ] Security penetration testing
- [ ] Accessibility testing
- [ ] Browser compatibility testing

**Day 5: Bug Fixes**
- [ ] Fix all critical bugs
- [ ] Fix all high-priority bugs
- [ ] Document known issues
- [ ] Create bug fix priority list

**Deliverables:**
- ✅ Performance optimized
- ✅ All tests passing
- ✅ Critical bugs fixed
- ✅ System stable

---

#### Week 12: Documentation & Deployment

**Day 1-2: Documentation**
- [ ] User manual (with screenshots)
- [ ] Admin guide
- [ ] API documentation
- [ ] Developer setup guide
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Video tutorials (optional)

**Day 3: Production Setup**
- [ ] Setup production database
- [ ] Configure environment variables
- [ ] Setup SSL certificates
- [ ] Configure backups
- [ ] Setup monitoring (Sentry, LogRocket)
- [ ] Configure alerts

**Day 4: Deployment**
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Run production migrations
- [ ] Import initial data
- [ ] Verify all integrations
- [ ] Smoke test production

**Day 5: Training & Handoff**
- [ ] Train staff on system
- [ ] Train on barcode scanner
- [ ] Train on receipt printer
- [ ] Train on POS workflows
- [ ] Provide support documentation
- [ ] Setup support channel

**Deliverables:**
- ✅ Complete documentation
- ✅ Production deployed
- ✅ Staff trained
- ✅ System live

---

## Part 3: Success Criteria

### Production Readiness Checklist

#### Hardware Integration ✅
- [x] Barcode scanner working (camera + Bluetooth)
- [x] Receipt printer integrated
- [x] Cash drawer auto-opens
- [x] All tested with real hardware

#### Data Integrity ✅
- [x] Real-time stock synchronization
- [x] No negative stock possible
- [x] Concurrent transactions handled
- [x] All changes logged in audit trail
- [x] Data export working
- [x] Backups automated

#### POS Functionality ✅
- [x] Scan product to add to cart
- [x] Customer search and selection
- [x] Loyalty points redemption
- [x] Multiple payment methods
- [x] Receipt prints automatically
- [x] Offline mode works
- [x] Draft carts persist

#### Operations ✅
- [x] Bulk import products
- [x] Bulk update prices
- [x] Generate barcodes
- [x] Stock receiving workflow
- [x] Stock transfer between locations
- [x] Approval workflows functional

#### Reporting ✅
- [x] Real sales data (not demo)
- [x] Accurate analytics
- [x] Export to PDF/Excel
- [x] Scheduled reports
- [x] Profit/loss analysis

#### Security ✅
- [x] Granular permissions enforced
- [x] Discount limits working
- [x] Manager approval required for overrides
- [x] Audit trail complete
- [x] Cost prices hidden from cashiers

#### Integration ✅
- [x] API versioned and documented
- [x] Mobile endpoints ready
- [x] Marketplace APIs functional
- [x] WhatsApp integration working
- [x] Social media orders importable

---

## Part 4: Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Hardware compatibility issues | Medium | High | Test with multiple scanner/printer models early |
| Concurrent transaction conflicts | Medium | Critical | Implement optimistic locking with comprehensive tests |
| Offline sync data conflicts | Low | High | Design conflict resolution strategy upfront |
| Performance degradation at scale | Medium | Medium | Load testing from Week 11, optimize early |
| Third-party API downtime | Low | Medium | Implement fallback mechanisms and queues |
| Data loss during migration | Low | Critical | Multiple backups before each migration |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Staff resistance to change | High | Medium | Comprehensive training, show time savings |
| Hardware cost overruns | Medium | Low | Research costs early, budget for equipment |
| Integration delays | Medium | Medium | Phase integrations, don't block core features |
| Scope creep | High | High | Strict feature prioritization, stick to plan |

---

## Part 5: Next Steps

### Immediate Actions (This Week)

1. **Review this document** - Confirm priorities and timeline
2. **Procure hardware** - Order barcode scanner and thermal printer for testing
3. **Setup Cloudinary/S3** - For image storage
4. **Start Week 1 implementation** - Begin with barcode scanning

### Decision Points

**Need Your Input On:**
1. **Image Storage:** Cloudinary (easier, paid) vs S3 (cheaper, more setup)?
2. **Multi-Location:** Deploy now or wait until single location is proven?
3. **Offline POS:** Priority now or after core features solid?
4. **WhatsApp Integration:** Use official API (expensive) or third-party (risky)?

---

## Appendix

### Recommended Hardware
- **Barcode Scanner:** Zebra DS2278 or Honeywell Voyager 1400g (~$200)
- **Receipt Printer:** Epson TM-T88VI or Star TSP143IIIU (~$300)
- **Cash Drawer:** APG Vasario 1616 (~$150)
- **Tablet for POS:** iPad 10.9" or Android tablet (~$400)

### Technology Stack Additions
- **Barcode:** @zxing/browser or QuaggaJS
- **Images:** Cloudinary SDK or AWS S3 SDK
- **Receipts:** node-thermal-printer or StarPRNT SDK
- **PDF Export:** jsPDF + jsPDF-AutoTable
- **Excel:** ExcelJS or xlsx
- **Offline:** Workbox (Service Worker) + Dexie.js (IndexedDB)
- **Caching:** Redis for session and data caching
- **Monitoring:** Sentry for errors, LogRocket for session replay

---

**This document represents a complete roadmap to production. No compromises. Every feature essential for commercial success.**

**Ready to start Week 1?**
