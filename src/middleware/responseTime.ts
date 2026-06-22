import { Request, Response, NextFunction } from 'express';

export const responseTime = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Already set by routes; log here too
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
  });
  next();
};
