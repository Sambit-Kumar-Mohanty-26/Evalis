import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { db } from './config/db';

import institutionRoutes from './routes/institutionRoutes';
import authRoutes from './routes/authRoutes'; 
import academicRoutes from './routes/academicRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests from this IP, please try again after a minute.' }
});

app.use('/api/v1/auth', authLimiter);
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const result = await db.$queryRaw`SELECT NOW() AS current_time`;
    res.status(200).json({ 
      status: 'SPARS API is running smoothly', 
      db_time: result 
    });
  } catch (error) {
    console.error('DB Connection Error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});
app.use('/api/v1/institutions', institutionRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/academic', academicRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});