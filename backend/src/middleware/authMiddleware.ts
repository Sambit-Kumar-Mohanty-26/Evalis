import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string; tenantId: string };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized. No access token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
      userId: string;
      role: string;
      tenantId: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
  }
};