import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({ message: `${paramName} parameter is required` });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: `Invalid ${paramName} format` });
    }
    
    next();
  };
};

export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }
    
    next();
  };
};

export const validateTaskStatus = (req: Request, res: Response, next: NextFunction) => {
  const validStatuses = ['todo', 'in-progress', 'review', 'completed'];
  const { status } = req.body;
  
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
    });
  }
  
  next();
};

export const validateProjectStatus = (req: Request, res: Response, next: NextFunction) => {
  const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
  const { status } = req.body;
  
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
    });
  }
  
  next();
};

export const validatePriority = (req: Request, res: Response, next: NextFunction) => {
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  const { priority } = req.body;
  
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ 
      message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
    });
  }
  
  next();
};

export const validateDateRange = (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.body;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ 
        message: 'Start date must be before end date' 
      });
    }
  }
  
  next();
};