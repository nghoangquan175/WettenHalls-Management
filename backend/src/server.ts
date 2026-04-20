import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import articleRoutes from './routes/articleRoutes';
import uploadRoutes from './routes/uploadRoutes';
import navigationRoutes from './routes/navigationRoutes';
import { errorHandler } from './middleware/errorHandler';

import { apiReference } from '@scalar/express-api-reference';
import { specs } from './config/swagger';

dotenv.config();

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('FATAL: SESSION_SECRET environment variable is not set.');
}

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

// Middleware
app.use(
  cors({
    origin: [
      process.env.MANAGEMENT_ORIGIN || 'http://localhost:5173',
      process.env.HOMEPAGE_ORIGIN || 'http://localhost:6699',
      'http://localhost:5174',
    ],
    credentials: true, // Allow cookies
  })
);

app.use(express.json());

// Session Middleware Instances
const isProduction = process.env.NODE_ENV === 'production';
const useHTTPS = process.env.USE_HTTPS === 'true';

const createSessionMiddleware = (name: string) =>
  session({
    name,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:
        process.env.MONGODB_URI || 'mongodb://localhost:27017/WettenHalls',
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      // In production, 'secure' must be true ONLY if using HTTPS.
      // If using direct IP (HTTP), 'secure' must be false.
      secure: isProduction && useHTTPS,
      httpOnly: true,
      // If using HTTPS, 'none' is required for cross-site (if frontend/backend on different domains).
      // If using HTTP (IP), 'lax' is required because 'none' without 'secure' is blocked by browsers.
      sameSite: useHTTPS ? 'none' : 'lax',
    },
  });

const managementSession = createSessionMiddleware('management.sid');
const homepageSession = createSessionMiddleware('homepage.sid');

// Dynamic Session Selection Middleware
app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin;
  const managementOrigin =
    process.env.MANAGEMENT_ORIGIN || 'http://localhost:5173';
  const homepageOrigin = process.env.HOMEPAGE_ORIGIN || 'http://localhost:6699';

  if (origin === managementOrigin) {
    return managementSession(req, res, next);
  } else if (origin === homepageOrigin) {
    return homepageSession(req, res, next);
  }

  // Default to management if unknown or not provided
  managementSession(req, res, next);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/navigation', navigationRoutes);

// API Documentation - Only show in development or if SHOW_DOCS is true
if (!isProduction || process.env.SHOW_DOCS === 'true') {
  app.use(
    '/api-docs',
    apiReference({
      spec: {
        content: specs,
      },
    })
  );
}

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Backend Node Express TS running with Session support',
  });
});

// Connect to Database
connectDB();

app.use(errorHandler);

// For Docker/Azure deployment: always listen
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

export default app;
