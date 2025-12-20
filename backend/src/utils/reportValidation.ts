/**
 * Input Validation and Sanitization for Financial Reports
 */

import { ValidationError } from './reportErrors';

export const validateDateRange = (startDate: string, endDate: string): { start: Date; end: Date } => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    throw new ValidationError('Invalid start date format. Use YYYY-MM-DD', { startDate });
  }

  if (isNaN(end.getTime())) {
    throw new ValidationError('Invalid end date format. Use YYYY-MM-DD', { endDate });
  }

  if (start > end) {
    throw new ValidationError('Start date must be before end date', { startDate, endDate });
  }

  const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365 * 5) {
    throw new ValidationError('Date range cannot exceed 5 years', { days: daysDiff });
  }

  if (daysDiff < 0) {
    throw new ValidationError('Invalid date range', { days: daysDiff });
  }

  return { start, end };
};

export const validateObjectId = (id: string, fieldName: string = 'id'): void => {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  if (!objectIdPattern.test(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`, { [fieldName]: id });
  }
};

export const validatePaginationParams = (page?: string | number, limit?: string | number): { page: number; limit: number } => {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 100;

  if (pageNum < 1) {
    throw new ValidationError('Page must be greater than 0', { page: pageNum });
  }

  if (limitNum < 1 || limitNum > 1000) {
    throw new ValidationError('Limit must be between 1 and 1000', { limit: limitNum });
  }

  return { page: pageNum, limit: limitNum };
};

export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
};

export const validateReportType = (reportType: string): void => {
  const validTypes = [
    'profit-loss',
    'balance-sheet',
    'cash-flow',
    'trial-balance',
    'general-ledger',
    'accounts-receivable',
    'accounts-payable',
    'expense-report',
    'revenue-report'
  ];

  if (!validTypes.includes(reportType)) {
    throw new ValidationError('Invalid report type', { reportType, validTypes });
  }
};

export const validateExportFormat = (format: string): void => {
  const validFormats = ['pdf', 'excel', 'csv', 'json'];
  
  if (!validFormats.includes(format)) {
    throw new ValidationError('Invalid export format', { format, validFormats });
  }
};
