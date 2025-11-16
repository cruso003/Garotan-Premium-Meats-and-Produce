import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  node: {
    env: string;
  };
  server: {
    port: number;
    apiPrefix: string;
  };
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    webUrl: string;
    mobileUrl: string;
  };
  upload: {
    maxFileSize: number;
    uploadDir: string;
  };
  websocket: {
    port: number;
  };
}

export const config: Config = {
  node: {
    env: process.env.NODE_ENV || 'development',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || '/api',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'your-refresh-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    webUrl: process.env.WEB_URL || 'http://localhost:5173',
    mobileUrl: process.env.MOBILE_URL || 'exp://localhost:19000',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT || '3001', 10),
  },
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0 && config.node.env === 'production') {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

export default config;
