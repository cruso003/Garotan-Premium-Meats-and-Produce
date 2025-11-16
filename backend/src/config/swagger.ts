import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Garotan Management System API',
      version: '1.0.0',
      description: `
        Comprehensive business management system API for Garotan Premium Meats & Produce.

        ## Features
        - POS/Transaction management
        - Customer relationship management (CRM)
        - Inventory management with FIFO
        - Sales reports and analytics
        - User and role management

        ## Authentication
        Most endpoints require JWT authentication. Use the /auth/login endpoint to get an access token.
        Include the token in the Authorization header: \`Bearer <token>\`

        ## Base URL
        ${config.node.env === 'production' ? 'https://api.garotan.com' : 'http://localhost:3000'}/api
      `,
      contact: {
        name: 'Garotan Premium Meats & Produce',
        email: 'support@garotan.com',
      },
      license: {
        name: 'UNLICENSED',
        url: '#',
      },
    },
    servers: [
      {
        url: config.node.env === 'production'
          ? 'https://api.garotan.com/api'
          : `http://localhost:${config.server.port}${config.server.apiPrefix}`,
        description: config.node.env === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token from /auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            phone: { type: 'string', nullable: true },
            role: {
              type: 'string',
              enum: ['ADMIN', 'STORE_MANAGER', 'CASHIER', 'COLD_ROOM_ATTENDANT', 'SALES_MANAGER', 'DELIVERY_COORDINATOR', 'DRIVER', 'ACCOUNTANT'],
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE'],
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sku: { type: 'string' },
            barcode: { type: 'string', nullable: true },
            name: { type: 'string' },
            category: {
              type: 'string',
              enum: ['CHICKEN', 'BEEF', 'PORK', 'PRODUCE', 'VALUE_ADDED', 'OTHER'],
            },
            subcategory: { type: 'string', nullable: true },
            unitOfMeasure: {
              type: 'string',
              enum: ['KG', 'PIECES', 'TRAYS', 'BOXES', 'LITERS'],
            },
            costPrice: { type: 'string' },
            retailPrice: { type: 'string' },
            wholesalePrice: { type: 'string' },
            minStockLevel: { type: 'integer' },
            storageLocation: {
              type: 'string',
              enum: ['CHILLER', 'FREEZER', 'PRODUCE_SECTION', 'DRY_STORAGE'],
            },
            shelfLifeDays: { type: 'integer', nullable: true },
            supplier: { type: 'string', nullable: true },
            imageUrl: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            currentStock: { type: 'number', description: 'Calculated field' },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email', nullable: true },
            customerType: {
              type: 'string',
              enum: ['RETAIL', 'B2B_RESTAURANT', 'B2B_HOTEL', 'B2B_INSTITUTION'],
            },
            address: { type: 'string', nullable: true },
            loyaltyPoints: { type: 'integer' },
            loyaltyTier: {
              type: 'string',
              enum: ['BRONZE', 'SILVER', 'GOLD'],
            },
            creditLimit: { type: 'string', nullable: true },
            paymentTermsDays: { type: 'integer', nullable: true },
            isActive: { type: 'boolean' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            transactionNumber: { type: 'string' },
            customerId: { type: 'string', nullable: true },
            transactionDate: { type: 'string', format: 'date-time' },
            subtotal: { type: 'string' },
            discount: { type: 'string' },
            tax: { type: 'string' },
            total: { type: 'string' },
            paymentMethod: {
              type: 'string',
              enum: ['CASH', 'MOBILE_MONEY_MTN', 'MOBILE_MONEY_ORANGE', 'CARD', 'CREDIT', 'SPLIT'],
            },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
            },
            loyaltyPointsEarned: { type: 'integer' },
            loyaltyPointsRedeemed: { type: 'integer' },
            isVoided: { type: 'boolean' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Products',
        description: 'Product catalog management',
      },
      {
        name: 'Transactions',
        description: 'POS transactions and sales',
      },
      {
        name: 'Customers',
        description: 'Customer relationship management',
      },
      {
        name: 'Inventory',
        description: 'Stock and inventory management',
      },
      {
        name: 'Reports',
        description: 'Sales reports and analytics',
      },
      {
        name: 'Users',
        description: 'User and role management',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
