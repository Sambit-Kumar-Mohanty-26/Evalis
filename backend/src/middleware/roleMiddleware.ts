import { Request, Response, NextFunction } from 'express';

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized. Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Forbidden. You do not have permission to perform this action.' 
      });
      return;
    }

    next();
  };
};
