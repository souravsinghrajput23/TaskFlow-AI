import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error handler caught:', err);
  
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    message,
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
