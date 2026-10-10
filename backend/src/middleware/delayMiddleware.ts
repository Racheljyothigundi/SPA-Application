import { Request, Response, NextFunction } from 'express';

export const delayMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const delayParam = req.query.delay;
  if (!delayParam) return next();

  let delayMs = parseInt(delayParam as string, 10);
  if (isNaN(delayMs) || delayMs < 0) delayMs = 0;
  if (delayMs > 5000) delayMs = 5000; // Cap at 5000ms max

  setTimeout(() => {
    next();
  }, delayMs);
};