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

dotenv.config();

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('FATAL: SESSION_SECRET environment variable is not set.');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:6699'
  ],
  credentials: true, // Allow cookies
}));
app.use(express.json());

// Session Middleware Instances
const createSessionMiddleware = (name: string) => session({
  name,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/WettenHalls',
    collectionName: 'sessions',
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
  }
});

const managementSession = createSessionMiddleware('management.sid');
const homepageSession = createSessionMiddleware('homepage.sid');

// Dynamic Session Selection Middleware
app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin;
  const managementOrigin = process.env.MANAGEMENT_ORIGIN || 'http://localhost:5173';
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

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Backend Node Express TS running with Session support',
  });
});

app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});