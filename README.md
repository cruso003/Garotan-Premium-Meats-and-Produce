# Garotan Premium Meats & Produce - Management System

A comprehensive business management system for cold-chain food retail and distribution business in Liberia.

## Features

### Phase 1 (MVP)
- **User Authentication & Role Management**: Secure login with role-based access control
- **Product Management**: Complete CRUD operations for products
- **Basic Inventory**: Stock receiving, adjustments, and current levels tracking
- **Point of Sale (POS)**: Fast checkout with multiple payment methods, barcode scanning
- **Customer Management**: Customer database with loyalty program
- **Sales Reports**: Daily, weekly, monthly sales analytics
- **Dashboard**: Real-time KPIs and business insights

### Future Phases
- Order management and delivery tracking
- Mobile app for delivery drivers
- Advanced inventory (FIFO, expiry tracking)
- Cold room temperature monitoring
- B2B credit management
- Marketing campaigns
- Subscriptions

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Web Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Mobile**: React Native, TypeScript
- **Real-time**: Socket.io
- **Authentication**: JWT tokens

## Project Structure

```
garotan-management-system/
├── backend/          # Node.js API server
├── web/             # React web dashboard
├── mobile/          # React Native mobile app
├── docs/            # Documentation
└── scripts/         # Utility scripts
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14
- Docker (optional, for containerized deployment)

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd Garotan-Premium-Meats-and-Produce
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Set up the database

```bash
# Create PostgreSQL database
createdb garotan_db

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

### 5. Start development servers

```bash
# Start both backend and web frontend
npm run dev

# Or start individually:
npm run dev:backend
npm run dev:web
npm run dev:mobile
```

The services will be available at:
- Backend API: http://localhost:3000
- Web Dashboard: http://localhost:5173
- API Documentation: http://localhost:3000/api-docs

## Development

### Available Scripts

- `npm run dev` - Start backend and web in development mode
- `npm run build` - Build all projects for production
- `npm run test` - Run tests across all projects
- `npm run lint` - Lint code across all projects
- `npm run format` - Format code with Prettier
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

### Database Migrations

```bash
# Create a new migration
cd backend
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy
```

## Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

### Using Docker

```bash
docker-compose up -d
```

## Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [User Guide](./docs/USER_GUIDE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## Architecture

The system follows Clean Architecture principles:
- **Presentation Layer**: React web app, React Native mobile app
- **Application Layer**: Express API endpoints, WebSocket handlers
- **Domain Layer**: Business logic, use cases
- **Infrastructure Layer**: Database (Prisma), external services

## Security

- HTTPS only in production
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt (cost factor 12)
- SQL injection prevention (parameterized queries)
- XSS and CSRF protection
- Rate limiting on API endpoints
- Input validation and sanitization

## Offline Support

- **POS**: Queue transactions when offline, sync when connection restored
- **Mobile App**: View orders and update status offline, sync on reconnection

## Contributing

This is a private project for Garotan Premium Meats & Produce.

## License

UNLICENSED - Proprietary software

## Support

For issues and questions, contact the development team.

---

Built with ❤️ for Garotan Premium Meats & Produce
