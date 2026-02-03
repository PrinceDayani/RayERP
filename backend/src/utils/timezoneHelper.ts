/**
 * Timezone Helper Utility
 * Provides timezone-aware date formatting
 */

/**
 * Format date with user's timezone
 */
export const formatDateWithTimezone = (
  date: Date | string,
  timezone: string = 'UTC',
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    ...options
  };
  
  return dateObj.toLocaleString('en-US', defaultOptions);
};

/**
 * Get current time in user's timezone
 */
export const getCurrentTimeInTimezone = (timezone: string = 'UTC'): string => {
  return formatDateWithTimezone(new Date(), timezone);
};

/**
 * Convert date to user's timezone
 */
export const convertToTimezone = (date: Date | string, timezone: string = 'UTC'): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const utcTime = dateObj.getTime();
  const offset = getTimezoneOffset(timezone);
  return new Date(utcTime + offset);
};

/**
 * Get timezone offset in milliseconds
 */
const getTimezoneOffset = (timezone: string): number => {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return tzDate.getTime() - utcDate.getTime();
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string, timezone: string = 'UTC'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  
  return formatDateWithTimezone(dateObj, timezone, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};
