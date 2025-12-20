/**
 * Custom Error Classes for Financial Reports
 * Provides structured error handling with proper HTTP status codes
 */

export class FinancialReportError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'FinancialReportError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}

export class ValidationError extends FinancialReportError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class DataIntegrityError extends FinancialReportError {
  constructor(message: string, details?: any) {
    super(message, 'DATA_INTEGRITY_ERROR', 422, details);
    this.name = 'DataIntegrityError';
  }
}

export class CacheError extends FinancialReportError {
  constructor(message: string, details?: any) {
    super(message, 'CACHE_ERROR', 500, details);
    this.name = 'CacheError';
  }
}

export class DatabaseError extends FinancialReportError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

export class AuthorizationError extends FinancialReportError {
  constructor(message: string = 'Unauthorized access', details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends FinancialReportError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
    this.name = 'RateLimitError';
  }
}
