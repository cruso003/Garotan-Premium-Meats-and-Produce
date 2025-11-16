# Setup Guide - Garotan Management System

This guide will help you set up the Garotan Premium Meats & Produce Management System for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **PostgreSQL** >= 14 ([Download](https://www.postgresql.org/download/)) OR
- **Docker** & **Docker Compose** (recommended for easier setup)
- **Git** ([Download](https://git-scm.com/))

## Quick Start (Recommended)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Garotan-Premium-Meats-and-Produce
```

### 2. Start Database with Docker

The easiest way to get started is using Docker Compose:

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Check if services are running
docker-compose ps
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379 (optional, for future features)

### 3. Install Dependencies

```bash
# Install all dependencies for all workspaces
npm install
```

### 4. Set Up Environment Variables

```bash
# Copy example environment file
cp backend/.env.example backend/.env

# The default values should work with Docker Compose
# Edit if needed:
# nano backend/.env
```

### 5. Set Up the Database

```bash
# Generate Prisma Client
cd backend
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database with sample data
npm run seed
```

You should see output showing default user credentials.

### 6. Start Development Servers

```bash
# From the root directory
cd ..

# Start backend (from root)
npm run dev:backend

# In a new terminal, start web frontend (once created)
# npm run dev:web
```

The backend API will be available at: **http://localhost:3000**

### 7. Test the API

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@garotan.com","password":"Password123!"}'
```

## Manual Setup (Without Docker)

If you prefer not to use Docker:

### 1. Install PostgreSQL

Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)

### 2. Create Database

```bash
# Using psql
createdb garotan_db

# Or using SQL
psql -U postgres
CREATE DATABASE garotan_db;
\q
```

### 3. Update Environment Variables

Edit `backend/.env` with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/garotan_db"
```

### 4. Continue from Step 3 of Quick Start

Follow steps 3-7 from the Quick Start guide above.

## Default User Credentials

After seeding the database, you can log in with these accounts:

### Admin
- **Email:** admin@garotan.com
- **Password:** Password123!
- **Access:** Full system access

### Store Manager
- **Email:** manager@garotan.com
- **Password:** Password123!
- **Access:** POS, Inventory, Customers, Reports

### Cashier
- **Email:** cashier1@garotan.com
- **Password:** Password123!
- **Access:** POS only

### Sales Manager
- **Email:** sales@garotan.com
- **Password:** Password123!
- **Access:** Customers, Orders, Marketing, Reports

### Driver
- **Email:** driver1@garotan.com
- **Password:** Password123!
- **Access:** Mobile app, assigned orders

**IMPORTANT:** Change these passwords in production!

## Project Structure

```
Garotan-Premium-Meats-and-Produce/
├── backend/                 # Node.js API server
│   ├── prisma/             # Database schema and migrations
│   │   ├── schema.prisma   # Prisma schema
│   │   └── seed.ts         # Seed script
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   ├── app.ts          # Express app setup
│   │   └── index.ts        # Server entry point
│   └── package.json
├── web/                     # React web dashboard (to be created)
├── mobile/                  # React Native app (to be created)
├── docs/                    # Documentation
├── docker-compose.yml       # Docker services
├── package.json            # Root package.json (workspaces)
└── README.md
```

## Available Scripts

### Root Level

```bash
npm run dev              # Start backend and web in dev mode
npm run dev:backend      # Start backend only
npm run dev:web          # Start web only
npm run dev:mobile       # Start mobile app
npm run build            # Build all projects
npm run test             # Run tests for all projects
npm run lint             # Lint all projects
npm run format           # Format code with Prettier
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
```

### Backend Only

```bash
cd backend

npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server
npm run migrate          # Run migrations
npm run seed             # Seed database
npm run studio           # Open Prisma Studio
npm test                 # Run tests
npm run lint             # Lint code
```

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

```
POST   /api/auth/login              Login
POST   /api/auth/refresh            Refresh access token
POST   /api/auth/logout             Logout
GET    /api/auth/me                 Get current user
POST   /api/auth/change-password    Change password
```

### Product Endpoints

```
GET    /api/products                List all products
GET    /api/products/low-stock      Get low stock products
GET    /api/products/:id            Get product by ID
GET    /api/products/sku/:sku       Get product by SKU
GET    /api/products/barcode/:code  Get product by barcode
POST   /api/products                Create product
PUT    /api/products/:id            Update product
DELETE /api/products/:id            Delete product
```

For detailed API documentation, see [docs/API.md](./API.md)

## Database Management

### Prisma Studio

Prisma Studio is a visual database browser:

```bash
npm run db:studio
```

Opens at: http://localhost:5555

### Migrations

```bash
# Create a new migration
cd backend
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Backup Database

```bash
# Using pg_dump
pg_dump -U garotan -d garotan_db > backup.sql

# Restore
psql -U garotan -d garotan_db < backup.sql
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change the port in backend/.env
PORT=3001
```

### Database Connection Error

1. Verify PostgreSQL is running:
   ```bash
   # Docker
   docker-compose ps

   # Manual installation
   pg_isready
   ```

2. Check DATABASE_URL in backend/.env

3. Verify database exists:
   ```bash
   psql -U garotan -l
   ```

### Prisma Client Generation Error

```bash
cd backend
npx prisma generate
```

### Permission Errors

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules
```

## Development Tips

### Hot Reload

The backend uses `tsx watch` for hot reload. Changes to TypeScript files will automatically restart the server.

### Logging

Logs are stored in `backend/logs/`:
- `error.log` - Error logs only
- `combined.log` - All logs

In development, logs also appear in the console with color coding.

### Environment Variables

Never commit `.env` files to Git. Use `.env.example` as a template.

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix

# Format code
npm run format
```

## Next Steps

1. ✅ Backend API is running
2. ⏳ Build the web frontend (React + Vite)
3. ⏳ Build the mobile app (React Native)
4. ⏳ Implement remaining API endpoints (Inventory, Customers, POS, etc.)
5. ⏳ Add WebSocket support for real-time features
6. ⏳ Deploy to production

## Need Help?

- Check the [API Documentation](./API.md)
- Review the [Database Schema](./DATABASE.md)
- Read the [User Guide](./USER_GUIDE.md)
- Contact the development team

---

Happy coding! 🚀
