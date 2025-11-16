import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('Password123!', 12);

  // ============================================================================
  // USERS
  // ============================================================================
  console.log('Creating users...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@garotan.com' },
    update: {},
    create: {
      email: 'admin@garotan.com',
      phone: '+231770000001',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const storeManager = await prisma.user.upsert({
    where: { email: 'manager@garotan.com' },
    update: {},
    create: {
      email: 'manager@garotan.com',
      phone: '+231770000002',
      name: 'John Manager',
      password: hashedPassword,
      role: 'STORE_MANAGER',
      status: 'ACTIVE',
    },
  });

  const cashier1 = await prisma.user.upsert({
    where: { email: 'cashier1@garotan.com' },
    update: {},
    create: {
      email: 'cashier1@garotan.com',
      phone: '+231770000003',
      name: 'Mary Cashier',
      password: hashedPassword,
      role: 'CASHIER',
      status: 'ACTIVE',
    },
  });

  const salesManager = await prisma.user.upsert({
    where: { email: 'sales@garotan.com' },
    update: {},
    create: {
      email: 'sales@garotan.com',
      phone: '+231770000004',
      name: 'David Sales',
      password: hashedPassword,
      role: 'SALES_MANAGER',
      status: 'ACTIVE',
    },
  });

  const driver1 = await prisma.user.upsert({
    where: { email: 'driver1@garotan.com' },
    update: {},
    create: {
      email: 'driver1@garotan.com',
      phone: '+231770000005',
      name: 'James Driver',
      password: hashedPassword,
      role: 'DRIVER',
      status: 'ACTIVE',
    },
  });

  console.log('✓ Users created');

  // ============================================================================
  // PRODUCTS
  // ============================================================================
  console.log('Creating products...');

  const products = await Promise.all([
    // Chicken products
    prisma.product.upsert({
      where: { sku: 'CHK-001' },
      update: {},
      create: {
        sku: 'CHK-001',
        barcode: '8901234567891',
        name: 'Whole Chicken',
        category: 'CHICKEN',
        subcategory: 'Fresh',
        unitOfMeasure: 'KG',
        costPrice: 3.50,
        retailPrice: 5.00,
        wholesalePrice: 4.50,
        minStockLevel: 50,
        storageLocation: 'CHILLER',
        shelfLifeDays: 7,
        supplier: 'Garotan Farm',
        description: 'Fresh whole chicken, farm-raised',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'CHK-002' },
      update: {},
      create: {
        sku: 'CHK-002',
        barcode: '8901234567892',
        name: 'Chicken Breast',
        category: 'CHICKEN',
        subcategory: 'Parts',
        unitOfMeasure: 'KG',
        costPrice: 4.00,
        retailPrice: 6.00,
        wholesalePrice: 5.50,
        minStockLevel: 30,
        storageLocation: 'CHILLER',
        shelfLifeDays: 5,
        supplier: 'Garotan Farm',
        description: 'Boneless chicken breast',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'CHK-003' },
      update: {},
      create: {
        sku: 'CHK-003',
        barcode: '8901234567893',
        name: 'Chicken Wings',
        category: 'CHICKEN',
        subcategory: 'Parts',
        unitOfMeasure: 'KG',
        costPrice: 3.00,
        retailPrice: 4.50,
        wholesalePrice: 4.00,
        minStockLevel: 25,
        storageLocation: 'CHILLER',
        shelfLifeDays: 5,
        supplier: 'Garotan Farm',
        description: 'Fresh chicken wings',
      },
    }),

    // Beef products
    prisma.product.upsert({
      where: { sku: 'BEEF-001' },
      update: {},
      create: {
        sku: 'BEEF-001',
        barcode: '8901234567894',
        name: 'Beef Sirloin',
        category: 'BEEF',
        subcategory: 'Premium Cuts',
        unitOfMeasure: 'KG',
        costPrice: 8.00,
        retailPrice: 12.00,
        wholesalePrice: 11.00,
        minStockLevel: 20,
        storageLocation: 'CHILLER',
        shelfLifeDays: 7,
        supplier: 'Local Supplier',
        description: 'Premium beef sirloin steak',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'BEEF-002' },
      update: {},
      create: {
        sku: 'BEEF-002',
        barcode: '8901234567895',
        name: 'Ground Beef',
        category: 'BEEF',
        subcategory: 'Minced',
        unitOfMeasure: 'KG',
        costPrice: 5.00,
        retailPrice: 7.50,
        wholesalePrice: 7.00,
        minStockLevel: 30,
        storageLocation: 'CHILLER',
        shelfLifeDays: 3,
        supplier: 'Local Supplier',
        description: 'Fresh ground beef',
      },
    }),

    // Pork products
    prisma.product.upsert({
      where: { sku: 'PORK-001' },
      update: {},
      create: {
        sku: 'PORK-001',
        barcode: '8901234567896',
        name: 'Pork Chops',
        category: 'PORK',
        subcategory: 'Cuts',
        unitOfMeasure: 'KG',
        costPrice: 6.00,
        retailPrice: 9.00,
        wholesalePrice: 8.50,
        minStockLevel: 20,
        storageLocation: 'CHILLER',
        shelfLifeDays: 5,
        supplier: 'Local Supplier',
        description: 'Fresh pork chops',
      },
    }),

    // Produce
    prisma.product.upsert({
      where: { sku: 'PROD-001' },
      update: {},
      create: {
        sku: 'PROD-001',
        barcode: '8901234567897',
        name: 'Tomatoes',
        category: 'PRODUCE',
        subcategory: 'Vegetables',
        unitOfMeasure: 'KG',
        costPrice: 1.50,
        retailPrice: 2.50,
        wholesalePrice: 2.20,
        minStockLevel: 50,
        storageLocation: 'PRODUCE_SECTION',
        shelfLifeDays: 7,
        supplier: 'Local Farms',
        description: 'Fresh red tomatoes',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PROD-002' },
      update: {},
      create: {
        sku: 'PROD-002',
        barcode: '8901234567898',
        name: 'Onions',
        category: 'PRODUCE',
        subcategory: 'Vegetables',
        unitOfMeasure: 'KG',
        costPrice: 1.00,
        retailPrice: 1.80,
        wholesalePrice: 1.60,
        minStockLevel: 40,
        storageLocation: 'PRODUCE_SECTION',
        shelfLifeDays: 14,
        supplier: 'Local Farms',
        description: 'Fresh yellow onions',
      },
    }),
    prisma.product.upsert({
      where: { sku: 'PROD-003' },
      update: {},
      create: {
        sku: 'PROD-003',
        barcode: '8901234567899',
        name: 'Lettuce',
        category: 'PRODUCE',
        subcategory: 'Vegetables',
        unitOfMeasure: 'PIECES',
        costPrice: 0.80,
        retailPrice: 1.50,
        wholesalePrice: 1.30,
        minStockLevel: 30,
        storageLocation: 'PRODUCE_SECTION',
        shelfLifeDays: 5,
        supplier: 'Local Farms',
        description: 'Fresh lettuce heads',
      },
    }),

    // Value-added products
    prisma.product.upsert({
      where: { sku: 'VA-001' },
      update: {},
      create: {
        sku: 'VA-001',
        barcode: '8901234567900',
        name: 'Marinated Chicken',
        category: 'VALUE_ADDED',
        subcategory: 'Ready to Cook',
        unitOfMeasure: 'TRAYS',
        costPrice: 5.00,
        retailPrice: 8.00,
        wholesalePrice: 7.50,
        minStockLevel: 20,
        storageLocation: 'CHILLER',
        shelfLifeDays: 3,
        supplier: 'Garotan Farm',
        description: 'Pre-marinated chicken ready to cook',
      },
    }),
  ]);

  console.log('✓ Products created');

  // ============================================================================
  // STOCK BATCHES
  // ============================================================================
  console.log('Creating stock batches...');

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await Promise.all(
    products.map((product, index) =>
      prisma.stockBatch.create({
        data: {
          productId: product.id,
          quantity: 100 + index * 10,
          expiryDate: index % 2 === 0 ? sevenDaysFromNow : fourteenDaysFromNow,
          supplier: product.supplier || 'Unknown',
          deliveryNote: `DN-2024-${String(index + 1).padStart(4, '0')}`,
        },
      })
    )
  );

  console.log('✓ Stock batches created');

  // ============================================================================
  // CUSTOMERS
  // ============================================================================
  console.log('Creating customers...');

  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { phone: '+231770123001' },
      update: {},
      create: {
        name: 'Alice Johnson',
        phone: '+231770123001',
        email: 'alice@example.com',
        customerType: 'RETAIL',
        address: 'Sinkor, Monrovia',
        loyaltyPoints: 150,
        loyaltyTier: 'SILVER',
        birthday: new Date('1985-03-15'),
      },
    }),
    prisma.customer.upsert({
      where: { phone: '+231770123002' },
      update: {},
      create: {
        name: 'Bob Smith',
        phone: '+231770123002',
        email: 'bob@example.com',
        customerType: 'RETAIL',
        address: 'Congo Town, Monrovia',
        loyaltyPoints: 50,
        loyaltyTier: 'BRONZE',
      },
    }),
    prisma.customer.upsert({
      where: { phone: '+231770123003' },
      update: {},
      create: {
        name: 'Royal Hotel Monrovia',
        phone: '+231770123003',
        email: 'procurement@royalhotel.lr',
        customerType: 'B2B_HOTEL',
        address: 'Mamba Point, Monrovia',
        assignedSalesRep: salesManager.id,
        loyaltyPoints: 500,
        loyaltyTier: 'GOLD',
        creditLimit: 5000,
        paymentTermsDays: 30,
      },
    }),
    prisma.customer.upsert({
      where: { phone: '+231770123004' },
      update: {},
      create: {
        name: 'Taste of Africa Restaurant',
        phone: '+231770123004',
        email: 'orders@tasteofafrica.lr',
        customerType: 'B2B_RESTAURANT',
        address: 'Broad Street, Monrovia',
        assignedSalesRep: salesManager.id,
        loyaltyPoints: 300,
        loyaltyTier: 'GOLD',
        creditLimit: 3000,
        paymentTermsDays: 14,
      },
    }),
    prisma.customer.upsert({
      where: { phone: '+231770123005' },
      update: {},
      create: {
        name: 'Mary Williams',
        phone: '+231770123005',
        customerType: 'RETAIL',
        address: 'Paynesville, Monrovia',
        loyaltyPoints: 25,
        loyaltyTier: 'BRONZE',
      },
    }),
  ]);

  console.log('✓ Customers created');

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================
  console.log('Creating sample transactions...');

  const transaction1 = await prisma.transaction.create({
    data: {
      transactionNumber: `TXN-${Date.now()}-001`,
      customerId: customers[0].id,
      cashierId: cashier1.id,
      subtotal: 25.00,
      discount: 2.50,
      tax: 0,
      total: 22.50,
      paymentMethod: 'CASH',
      paymentStatus: 'COMPLETED',
      loyaltyPointsEarned: 22,
      items: {
        create: [
          {
            productId: products[0].id, // Whole Chicken
            quantity: 2,
            unitPrice: 5.00,
            total: 10.00,
          },
          {
            productId: products[6].id, // Tomatoes
            quantity: 5,
            unitPrice: 2.50,
            total: 12.50,
          },
          {
            productId: products[8].id, // Lettuce
            quantity: 2,
            unitPrice: 1.50,
            total: 3.00,
          },
        ],
      },
    },
  });

  await prisma.loyaltyTransaction.create({
    data: {
      customerId: customers[0].id,
      type: 'EARNED',
      points: 22,
      transactionId: transaction1.id,
      description: 'Points earned from purchase',
    },
  });

  console.log('✓ Sample transactions created');

  // ============================================================================
  // ORDERS
  // ============================================================================
  console.log('Creating sample orders...');

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}-001`,
      customerId: customers[2].id, // Royal Hotel
      orderDate: now,
      deliveryDate: tomorrow,
      deliveryAddress: 'Mamba Point, Monrovia',
      deliveryTimeWindow: '08:00 - 10:00',
      status: 'CONFIRMED',
      assignedDriverId: driver1.id,
      paymentMethod: 'CREDIT',
      paymentStatus: 'PENDING',
      subtotal: 180.00,
      discount: 0,
      total: 180.00,
      items: {
        create: [
          {
            productId: products[0].id, // Whole Chicken
            quantity: 20,
            unitPrice: 4.50,
            total: 90.00,
          },
          {
            productId: products[3].id, // Beef Sirloin
            quantity: 10,
            unitPrice: 11.00,
            total: 110.00,
          },
        ],
      },
    },
  });

  console.log('✓ Sample orders created');

  // ============================================================================
  // SUBSCRIPTION PLANS
  // ============================================================================
  console.log('Creating subscription plans...');

  const familyPlan = await prisma.subscriptionPlan.create({
    data: {
      name: 'Family Weekly Pack',
      description: 'Perfect for a family of 4-6 people',
      frequency: 'WEEKLY',
      price: 45.00,
      items: {
        create: [
          {
            productId: products[0].id, // Whole Chicken
            quantity: 2,
          },
          {
            productId: products[4].id, // Ground Beef
            quantity: 2,
          },
          {
            productId: products[6].id, // Tomatoes
            quantity: 3,
          },
          {
            productId: products[7].id, // Onions
            quantity: 2,
          },
        ],
      },
    },
  });

  await prisma.subscription.create({
    data: {
      customerId: customers[0].id,
      planId: familyPlan.id,
      startDate: now,
      status: 'ACTIVE',
      frequency: 'WEEKLY',
      deliveryDay: 'Saturday',
      deliveryAddress: 'Sinkor, Monrovia',
      paymentStatus: 'COMPLETED',
      nextDelivery: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✓ Subscription plans created');

  // ============================================================================
  // COLD ROOM LOGS
  // ============================================================================
  console.log('Creating cold room logs...');

  await Promise.all([
    prisma.coldRoomLog.create({
      data: {
        section: 'CHILLER',
        temperature: 4.5,
        recordedBy: storeManager.id,
        notes: 'Temperature within normal range',
      },
    }),
    prisma.coldRoomLog.create({
      data: {
        section: 'FREEZER',
        temperature: -18.0,
        recordedBy: storeManager.id,
        notes: 'All systems functioning normally',
      },
    }),
    prisma.coldRoomLog.create({
      data: {
        section: 'PRODUCE',
        temperature: 12.0,
        recordedBy: storeManager.id,
        notes: 'Optimal temperature for produce',
      },
    }),
  ]);

  console.log('✓ Cold room logs created');

  // ============================================================================
  // EXPENSES
  // ============================================================================
  console.log('Creating sample expenses...');

  await Promise.all([
    prisma.expense.create({
      data: {
        expenseDate: now,
        category: 'UTILITIES',
        amount: 450.00,
        description: 'Electricity bill for January',
        approvedBy: admin.id,
      },
    }),
    prisma.expense.create({
      data: {
        expenseDate: now,
        category: 'SUPPLIES',
        amount: 120.00,
        description: 'Packaging materials',
        approvedBy: storeManager.id,
      },
    }),
  ]);

  console.log('✓ Sample expenses created');

  console.log('✅ Database seeding completed!');
  console.log('\n📝 Default Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Email: admin@garotan.com');
  console.log('  Password: Password123!');
  console.log('\nStore Manager:');
  console.log('  Email: manager@garotan.com');
  console.log('  Password: Password123!');
  console.log('\nCashier:');
  console.log('  Email: cashier1@garotan.com');
  console.log('  Password: Password123!');
  console.log('\nSales Manager:');
  console.log('  Email: sales@garotan.com');
  console.log('  Password: Password123!');
  console.log('\nDriver:');
  console.log('  Email: driver1@garotan.com');
  console.log('  Password: Password123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
