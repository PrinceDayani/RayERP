import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  next();
};

// Simple validation helpers
const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

// Recurring Entry Validations
export const validateRecurringEntry = (req: Request, res: Response, next: NextFunction) => {
  const { name, frequency, startDate, entries } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  if (!['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'].includes(frequency)) {
    return res.status(400).json({ success: false, message: 'Invalid frequency' });
  }
  if (!startDate) {
    return res.status(400).json({ success: false, message: 'Start date is required' });
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ success: false, message: 'Entries array is required' });
  }
  next();
};

export const validateSkipNext = (req: Request, res: Response, next: NextFunction) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  next();
};

export const validateVariables = (req: Request, res: Response, next: NextFunction) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  next();
};

export const validateApprovalConfig = (req: Request, res: Response, next: NextFunction) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  next();
};

export const validateBatchApprove = (req: Request, res: Response, next: NextFunction) => {
  const { entryIds } = req.body;
  if (!Array.isArray(entryIds) || entryIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Entry IDs array is required' });
  }
  next();
};

// Report Validations
export const validateDateRange = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'Start date and end date are required' });
  }
  next();
};

export const validateAccountId = (req: Request, res: Response, next: NextFunction) => {
  if (!isValidObjectId(req.params.accountId)) {
    return res.status(400).json({ success: false, message: 'Invalid account ID format' });
  }
  next();
};

export const validateFilter = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const validateScheduleEmail = (req: Request, res: Response, next: NextFunction) => {
  const { reportType, frequency, recipients, format } = req.body;
  if (!reportType || !frequency || !Array.isArray(recipients) || !format) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  next();
};

// Project Validations
export const validateObjectId = (field: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[field];
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: `Invalid ${field} format` });
    }
    next();
  };
};

export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const field of fields) {
      if (!req.body[field]) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }
    next();
  };
};

export const validateProjectStatus = (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  if (status && !['planning', 'active', 'on-hold', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid project status' });
  }
  next();
};

export const validatePriority = (req: Request, res: Response, next: NextFunction) => {
  const { priority } = req.body;
  if (priority && !['low', 'medium', 'high', 'critical'].includes(priority)) {
    return res.status(400).json({ success: false, message: 'Invalid priority' });
  }
  next();
};

export const validateTaskStatus = (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  if (status && !['todo', 'in-progress', 'review', 'completed', 'blocked'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid task status' });
  }
  next();
};
