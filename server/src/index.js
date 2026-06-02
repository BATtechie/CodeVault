import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import prisma from './db/prisma.js';
import notificationRoutes from './routes/notification.routes.js';
import snippetRoutes from './routes/snippet.routes.js';
import teamRoutes from './routes/team.routes.js';
import { sendError, sendSuccess } from './utils/http.js';
import { csrfMiddleware, generateCsrfTokenMiddleware } from './middleware/csrf.js';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const configuredFrontendOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
].filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (!isProduction) {
        return callback(null, true);
      }

      const allowPreviewUrls = process.env.ALLOW_VERCEL_PREVIEWS === 'true';
      const isAllowed =
        configuredFrontendOrigins.includes(origin) ||
        (allowPreviewUrls && origin.endsWith('.vercel.app'));

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 25 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait a few minutes and try again.',
  },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProduction ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

const getDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'healthy';
  } catch (error) {
    console.error('Database health check failed:', error);
    return 'unhealthy';
  }
};

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use(generateCsrfTokenMiddleware);
app.use(csrfMiddleware);

app.get('/', (_req, res) =>
  sendSuccess(res, {
    message: 'CodeVault API is running.',
    data: {
      environment: process.env.NODE_ENV || 'development',
    },
  }),
);

app.get('/health', async (_req, res) => {
  const database = await getDatabaseHealth();

  return sendSuccess(res, {
    data: {
      status: database === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database,
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) =>
  sendError(res, {
    status: 404,
    message: `Route ${req.method} ${req.originalUrl} was not found.`,
  }),
);

app.use((error, _req, res, _next) => {
  console.error(error);

  return sendError(res, {
    status: error.statusCode || error.status || 500,
    message:
      error.message ||
      'An unexpected server error occurred.',
    details: isProduction ? undefined : { stack: error.stack },
  });
});

const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
  try {
    await prisma.$connect();

    app.listen(PORT, () => {
      console.log(`CodeVault API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start CodeVault API:', error);
    process.exit(1);
  }
};

startServer();
