import { Response } from 'express';
import { Document } from 'mongoose';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ResponseOptimizer {
  static paginate<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    const pages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };
  }

  static selectFields<T extends Document>(
    query: any,
    fields?: string[]
  ) {
    if (fields && fields.length > 0) {
      return query.select(fields.join(' '));
    }
    return query;
  }

  static async optimizedFind<T extends Document>(
    model: any,
    filter: any = {},
    options: {
      page?: number;
      limit?: number;
      sort?: any;
      populate?: string | string[];
      select?: string[];
      lean?: boolean;
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      sort = { createdAt: -1 },
      populate,
      select,
      lean = true
    } = options;

    const skip = (page - 1) * limit;

    // Build query
    let query = model.find(filter);
    
    if (lean) {
      query = query.lean();
    }
    
    if (select) {
      query = query.select(select.join(' '));
    }
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(pop => query = query.populate(pop));
      } else {
        query = query.populate(populate);
      }
    }
    
    // Execute query with pagination
    const [data, total] = await Promise.all([
      query.sort(sort).skip(skip).limit(limit),
      model.countDocuments(filter)
    ]);

    return this.paginate(data, total, page, limit);
  }

  static sendSuccess(
    res: Response,
    data: any,
    message: string = 'Success',
    statusCode: number = 200
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static sendError(
    res: Response,
    message: string = 'Error',
    statusCode: number = 500,
    error?: any
  ) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined,
      timestamp: new Date().toISOString()
    });
  }
}