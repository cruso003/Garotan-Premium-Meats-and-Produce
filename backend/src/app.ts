import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { logger, morganStream } from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { swaggerSpec } from './config/swagger';

const app: Application = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers (with CSP configured for Swagger UI)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
      },
    },
  })
);

// CORS
app.use(
  cors({
    origin: [config.cors.webUrl, config.cors.mobileUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// HTTP request logging
if (config.node.env === 'development') {
  app.use(morgan('dev', { stream: morganStream }));
} else {
  app.use(morgan('combined', { stream: morganStream }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================================================
// ROUTES
// ============================================================================

// Swagger API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Garotan API Documentation',
  })
);

// Swagger JSON
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use(config.server.apiPrefix, routes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Garotan Management System API',
    version: '1.0.0',
    documentation: `${config.server.apiPrefix}/docs`,
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
