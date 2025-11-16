# API Documentation

Base URL: `http://localhost:3000/api`

All endpoints (except authentication) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

All API responses follow this format:

### Success Response

```json
{
  "success": true,
  "message": "Optional success message",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    // Optional error details
  }
}
```

## Authentication

### Login

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "admin@garotan.com",
  "password": "Password123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@garotan.com",
      "name": "System Administrator",
      "role": "ADMIN",
      "status": "ACTIVE"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Refresh Token

```http
POST /api/auth/refresh
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User

```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <access_token>`

### Change Password

```http
POST /api/auth/change-password
```

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "oldPassword": "Password123!",
  "newPassword": "NewPassword123!"
}
```

### Logout

```http
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <access_token>`

Note: Logout is client-side (token removal). Server doesn't maintain session state.

## Products

### List Products

```http
GET /api/products?search=chicken&category=CHICKEN&page=1&limit=20
```

**Query Parameters:**

- `search` (optional): Search by name, SKU, or barcode
- `category` (optional): Filter by category (CHICKEN, BEEF, PORK, PRODUCE, VALUE_ADDED, OTHER)
- `isActive` (optional): Filter by active status (true/false)
- `storageLocation` (optional): Filter by storage location
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "sku": "CHK-001",
      "barcode": "8901234567891",
      "name": "Whole Chicken",
      "category": "CHICKEN",
      "unitOfMeasure": "KG",
      "retailPrice": "5.00",
      "wholesalePrice": "4.50",
      "currentStock": 125.5,
      "minStockLevel": 50,
      "storageLocation": "CHILLER"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Get Low Stock Products

```http
GET /api/products/low-stock
```

Returns products where `currentStock <= minStockLevel`

### Get Product by ID

```http
GET /api/products/:id
```

### Get Product by SKU

```http
GET /api/products/sku/:sku
```

Example: `GET /api/products/sku/CHK-001`

### Get Product by Barcode

```http
GET /api/products/barcode/:barcode
```

Example: `GET /api/products/barcode/8901234567891`

### Create Product

```http
POST /api/products
```

**Permissions:** ADMIN, STORE_MANAGER

**Request Body:**

```json
{
  "sku": "CHK-004",
  "barcode": "8901234567894",
  "name": "Chicken Drumsticks",
  "category": "CHICKEN",
  "subcategory": "Parts",
  "unitOfMeasure": "KG",
  "costPrice": 3.0,
  "retailPrice": 4.5,
  "wholesalePrice": 4.0,
  "minStockLevel": 30,
  "storageLocation": "CHILLER",
  "shelfLifeDays": 5,
  "supplier": "Garotan Farm",
  "description": "Fresh chicken drumsticks"
}
```

### Update Product

```http
PUT /api/products/:id
```

**Permissions:** ADMIN, STORE_MANAGER

**Request Body:** (all fields optional)

```json
{
  "name": "Updated Product Name",
  "retailPrice": 5.5,
  "minStockLevel": 40
}
```

### Delete Product

```http
DELETE /api/products/:id
```

**Permissions:** ADMIN, STORE_MANAGER

Note: This is a soft delete (sets `isActive` to false)

## Enums

### User Roles

```typescript
enum UserRole {
  ADMIN
  STORE_MANAGER
  CASHIER
  COLD_ROOM_ATTENDANT
  SALES_MANAGER
  DELIVERY_COORDINATOR
  DRIVER
  ACCOUNTANT
}
```

### Product Category

```typescript
enum ProductCategory {
  CHICKEN
  BEEF
  PORK
  PRODUCE
  VALUE_ADDED
  OTHER
}
```

### Unit of Measure

```typescript
enum UnitOfMeasure {
  KG
  PIECES
  TRAYS
  BOXES
  LITERS
}
```

### Storage Location

```typescript
enum StorageLocation {
  CHILLER
  FREEZER
  PRODUCE_SECTION
  DRY_STORAGE
}
```

### Payment Method

```typescript
enum PaymentMethod {
  CASH
  MOBILE_MONEY_MTN
  MOBILE_MONEY_ORANGE
  CARD
  CREDIT
  SPLIT
}
```

### Order Status

```typescript
enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  OUT_FOR_DELIVERY
  DELIVERED
  COMPLETED
  CANCELLED
  FAILED
}
```

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Headers:**
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Pagination

For endpoints that return lists:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Date/Time Format

All dates and times are in ISO 8601 format (UTC):

```
2024-01-15T14:30:00.000Z
```

## Decimal Values

All monetary and quantity values are returned as strings to preserve precision:

```json
{
  "retailPrice": "5.50",
  "quantity": "10.250"
}
```

---

## Upcoming Endpoints

The following endpoints are planned for future releases:

### Inventory
- `POST /api/inventory/receive` - Receive stock
- `POST /api/inventory/adjust` - Adjust stock
- `GET /api/inventory/batches` - Get FIFO batches
- `GET /api/inventory/near-expiry` - Get near-expiry items

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer
- `GET /api/customers/:id/history` - Purchase history
- `POST /api/customers/:id/loyalty/redeem` - Redeem loyalty points

### Transactions (POS)
- `POST /api/transactions` - Create sale
- `POST /api/transactions/:id/void` - Void sale
- `GET /api/transactions/:id` - Get receipt

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status
- `GET /api/orders/driver/:driverId` - Driver's orders

### Reports
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/inventory` - Inventory reports
- `GET /api/reports/financial` - Financial reports

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user

---

For questions or issues, please contact the development team.
