# Garotan Management System - Web Dashboard

Modern React-based dashboard for managing the Garotan Premium Meats & Produce business operations.

## Features

- **Authentication** - Secure login with JWT tokens and automatic refresh
- **Dashboard** - Real-time KPIs, sales metrics, and alerts
- **Point of Sale (POS)** - Quick checkout interface with cart management
- **Product Management** - Complete product catalog with categories and pricing
- **Customer Management** - CRM with loyalty program tracking
- **Inventory Management** - Stock tracking, low stock alerts, and expiry monitoring

## Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing with protected routes
- **Zustand** - Lightweight state management
- **Axios** - HTTP client with interceptors
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Modern icon library
- **React Hook Form** - Form handling and validation

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
web/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── layout/        # Layout components (sidebar, topbar)
│   │   └── common/        # Reusable UI components
│   ├── pages/
│   │   ├── auth/          # Login page
│   │   ├── dashboard/     # Dashboard with KPIs
│   │   ├── pos/           # Point of Sale
│   │   ├── products/      # Product management
│   │   ├── customers/     # Customer management
│   │   └── inventory/     # Inventory tracking
│   ├── lib/
│   │   └── api.ts         # Axios client with interceptors
│   ├── store/
│   │   └── auth.ts        # Zustand auth store
│   ├── types/
│   │   └── index.ts       # TypeScript type definitions
│   ├── App.tsx            # Main app with routing
│   └── main.tsx           # App entry point
├── public/                # Static assets
└── index.html            # HTML entry point
```

## Environment Variables

The app uses Vite's proxy configuration to forward `/api` requests to the backend.

To customize the backend URL, edit `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

## Authentication

The app uses JWT-based authentication:

1. Login with email and password
2. Receive access token (15 min) and refresh token (7 days)
3. Tokens stored in localStorage
4. Automatic token refresh on 401 responses
5. Protected routes redirect to login if unauthenticated

### Demo Credentials

- **Admin**: admin@garotan.com / Password123!
- **Manager**: manager@garotan.com / Password123!
- **Cashier**: cashier@garotan.com / Password123!

## API Integration

The app communicates with the backend API at `/api`:

- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `GET /api/reports/dashboard` - Dashboard KPIs
- `GET /api/products` - List products
- `GET /api/customers` - List customers
- `GET /api/inventory/low-stock` - Low stock items
- `GET /api/inventory/near-expiry` - Near expiry batches

See backend API documentation at `http://localhost:3000/api-docs`

## Styling

The app uses Tailwind CSS with custom brand colors:

- **Primary** (Green) - #2D5016 - Farm/freshness theme
- **Secondary** (Blue) - #0077BE - Trust/cold-chain
- **Accent** (Orange) - #FF6B35 - Energy/CTAs

Custom component classes are defined in `src/index.css`:
- `.btn`, `.btn-primary` - Button styles
- `.input` - Input field styles
- `.card` - Card container styles
- `.table-header` - Table header styles

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting (inherited from root)

### Path Aliases

The following path aliases are configured:

- `@/` → `./src/`
- `@/components/*` → `./src/components/*`
- `@/pages/*` → `./src/pages/*`
- `@/lib/*` → `./src/lib/*`
- `@/store/*` → `./src/store/*`
- `@/types/*` → `./src/types/*`
- `@/utils/*` → `./src/utils/*`

### Adding New Pages

1. Create page component in `src/pages/[module]/[PageName].tsx`
2. Add route to `src/App.tsx`
3. Add navigation link to `src/components/layout/Layout.tsx`

## License

Proprietary - © 2025 Garotan Premium Meats & Produce
