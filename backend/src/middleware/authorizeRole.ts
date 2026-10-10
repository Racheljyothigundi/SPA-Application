import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';

export const authorizeRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== requiredRole) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Action requires ${requiredRole} credentials.`
      });
      return;
    }
    next();
  };
};