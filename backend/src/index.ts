import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { db } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// REQ-SEC-005: Security Headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// REQ-SEC-003: CORS Policy
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true // Required to allow HTTP-only cookies
}));

app.use(express.json());
app.use(cookieParser());

// REQ-AUTH-008: Rate limiting for Authentication endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after a minute.' }
});

// Apply rate limiter strictly to auth routes
app.use('/api/auth', authLimiter);

// Health Check Endpoint (Tests server and database)
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT NOW() AS current_time');
    res.status(200).json({ 
      status: 'SPARS API is running smoothly', 
      db_time: result.rows[0].current_time 
    });
  } catch (error) {
    console.error('DB Connection Error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});