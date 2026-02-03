/**
 * Frontend Date Formatter with Timezone Support
 */

/**
 * Format date with user's timezone from localStorage or browser
 */
export const formatDate = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get timezone from localStorage or use browser default
  const timezone = localStorage.getItem('userTimezone') || 
                   Intl.DateTimeFormat().resolvedOptions().timeZone;
  
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
 * Format date as relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
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
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) > 1 ? 's' : ''} ago`;
  
  return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) > 1 ? 's' : ''} ago`;
};

/**
 * Format date for display (short format)
 */
export const formatDateShort = (date: Date | string): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format time only
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timezone = localStorage.getItem('userTimezone') || 
                   Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone
  });
};

/**
 * Set user timezone in localStorage
 */
export const setUserTimezone = (timezone: string): void => {
  localStorage.setItem('userTimezone', timezone);
};

/**
 * Get user timezone from localStorage or browser
 */
export const getUserTimezone = (): string => {
  return localStorage.getItem('userTimezone') || 
         Intl.DateTimeFormat().resolvedOptions().timeZone;
};
