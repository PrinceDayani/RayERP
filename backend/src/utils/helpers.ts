import { Response } from 'express';
import { Document } from 'mongoose';

// User-supplied text reaches Mongo as a regex in search filters; anything that
// carries regex syntax must be escaped first.
export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface ListParams {
  page: number;
  limit: number;
  skip: number;
  // True when the caller supplied any paging or sorting parameter. Endpoints
  // that predate pagination keep returning a bare array unless asked not to,
  // so existing consumers are unaffected.
  paginate: boolean;
  search: string | null;
  sort: Record<string, 1 | -1>;
}

export const parseListParams = (
  query: any,
  options: {
    sortMap: Record<string, Record<string, 1 | -1>>;
    defaultSort: string;
    defaultLimit?: number;
    maxLimit?: number;
  }
): ListParams => {
  const { sortMap, defaultSort, defaultLimit = 25, maxLimit = 100 } = options;

  const hasPageParam = query.page !== undefined || query.limit !== undefined;
  const requestedSort = typeof query.sort === 'string' ? query.sort : undefined;

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const parsedLimit = parseInt(query.limit, 10);
  const limit = Math.min(Math.max(1, parsedLimit || defaultLimit), maxLimit);

  const rawSearch = typeof query.q === 'string' ? query.q.trim() : '';

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    paginate: hasPageParam,
    search: rawSearch ? rawSearch.slice(0, 200) : null,
    sort: (requestedSort && sortMap[requestedSort]) || sortMap[defaultSort]
  };
};

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