import { Request, Response, NextFunction } from 'express';

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  sort: any;
  search?: string;
}

export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { page = '1', limit = '20', sort = '-createdAt', search } = req.query as PaginationQuery;
  
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
  const skip = (pageNum - 1) * limitNum;
  
  // Parse sort parameter
  let sortObj: any = {};
  if (sort) {
    const sortFields = sort.split(',');
    sortFields.forEach(field => {
      if (field.startsWith('-')) {
        sortObj[field.substring(1)] = -1;
      } else {
        sortObj[field] = 1;
      }
    });
  }
  
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    skip,
    sort: sortObj,
    search
  };
  
  next();
};

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      pagination?: PaginationOptions;
    }
  }
}