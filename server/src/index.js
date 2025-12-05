import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import snippetRoutes from './routes/snippet.routes.js';
import snippetController from './controllers/snippet.controller.js';

dotenv.config();

const app = express();
// CORS configuration
// Allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:5173', // Vite default dev server
  'http://localhost:4173', // Vite preview port
  'http://localhost:3000', // Alternative local port
  process.env.FRONTEND_URL, // Production frontend URL from env
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    // Also allow Vercel domains (vercel.app, vercel.com)
    const isVercelDomain = origin.includes('vercel.app') || origin.includes('vercel.com');
    const isAllowed = allowedOrigins.includes(origin) || 
                     allowedOrigins.some(allowed => allowed && origin.includes(allowed)) ||
                     isVercelDomain;
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}, Vercel domains`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Simple request logger for debugging route hits
app.use((req, _res, next) => {
  console.log(`[req] ${req.method} ${req.path}`);
  next();
});

// Setup morgan logging in development (optional)
if (process.env.NODE_ENV === 'development') {
  import('morgan')
    .then((morgan) => {
      app.use(morgan.default('dev'));
      console.log('Morgan logging enabled');
    })
    .catch(() => {
      // Morgan is optional, continue without it
      console.log('Morgan logging not available (optional dependency)');
    });
}

app.get('/', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'configured' : 'not configured'
  });
});

// Public endpoint for browsing snippets
app.get('/api/snippets/public', snippetController.getPublicSnippets);

app.use('/api/auth', authRoutes);
app.use('/api/snippets', snippetRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Catch uncaught exceptions (synchronous errors not caught elsewhere)
// process.on('uncaughtException', (err) => {
//   console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
//   console.error(err.name, err.message);
//   // It's unsafe to continue running after an uncaught exception
//   process.exit(1);
// });

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});