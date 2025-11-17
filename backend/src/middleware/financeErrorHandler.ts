import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface FinanceError extends Error {
  statusCode?: number;
  code?: string;
  keyValue?: any;
  errors?: any;
}

export const financeErrorHandler = (
  error: FinanceError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(error.errors || {}).map((err: any) => err.message);
    message = `Validation Error: ${errors.join(', ')}`;
  }

  // Mongoose duplicate key error
  if (error.code === '11000') {
    statusCode = 400;
    const field = Object.keys(error.keyValue || {})[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Finance-specific errors
  if (message.includes('debits must equal credits')) {
    statusCode = 400;
    message = 'Journal entry is not balanced - total debits must equal total credits';
  }

  if (message.includes('Period is locked')) {
    statusCode = 400;
    message = 'Cannot modify entries in a locked accounting period';
  }

  if (message.includes('Budget exceeded')) {
    statusCode = 400;
    message = 'Transaction exceeds approved budget limits';
  }

  // Log error
  logger.error('Finance Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const validateFinanceData = (req: Request, res: Response, next: NextFunction) => {
  // Common finance data validations
  if (req.body.amount && req.body.amount < 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount cannot be negative'
    });
  }

  if (req.body.lines && Array.isArray(req.body.lines)) {
    const totalDebits = req.body.lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
    const totalCredits = req.body.lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Journal entry is not balanced - total debits must equal total credits'
      });
    }
  }

  next();
};

export default financeErrorHandler;