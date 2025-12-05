export const validateDateRange = (startDate: string, endDate: string): { valid: boolean; error?: string } => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }
  
  const maxRange = 365 * 2;
  const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff > maxRange) {
    return { valid: false, error: 'Date range cannot exceed 2 years' };
  }
  
  return { valid: true };
};

export const sanitizeAmount = (amount: number): number => {
  if (typeof amount !== 'number' || isNaN(amount)) return 0;
  return Math.round(amount * 100) / 100;
};

export const formatCurrency = (amount: number, locale: string = 'en-IN', currency: string = 'INR'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(sanitizeAmount(amount));
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${sanitizeAmount(value).toFixed(decimals)}%`;
};
