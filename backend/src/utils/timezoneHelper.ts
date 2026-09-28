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
 * The business timezone used for calendar-day boundaries (attendance days,
 * office hours). Read lazily so dotenv has loaded before first use.
 */
export const appTimezone = (): string => process.env.APP_TIMEZONE || 'Asia/Kolkata';

const wallClock = (at: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find(p => p.type === type)!.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
};

/**
 * The instant at which a wall-clock time occurs in `timezone`. Month is
 * 1-based; out-of-range days and months roll over like Date.UTC.
 */
export const zonedTimeToUtc = (
  year: number, month: number, day: number, hour = 0, minute = 0,
  timezone: string = appTimezone()
): Date => {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const w = wallClock(new Date(guess), timezone);
  const offset = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - guess;
  return new Date(guess - offset);
};

/**
 * Midnight in `timezone` of the calendar day containing `at`.
 */
export const startOfZonedDay = (at: Date = new Date(), timezone: string = appTimezone()): Date => {
  const w = wallClock(at, timezone);
  return zonedTimeToUtc(w.year, w.month, w.day, 0, 0, timezone);
};

/**
 * Midnight in `timezone`, `days` calendar days after the day containing `at`.
 */
export const addZonedDays = (at: Date, days: number, timezone: string = appTimezone()): Date => {
  const w = wallClock(at, timezone);
  return zonedTimeToUtc(w.year, w.month, w.day + days, 0, 0, timezone);
};

/**
 * Midnight in `timezone` of a calendar day given as YYYY-MM-DD, or of the day
 * containing any other parseable date. Null when the value is not a date.
 */
export const parseZonedDay = (value: unknown, timezone: string = appTimezone()): Date | null => {
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (m) return zonedTimeToUtc(+m[1], +m[2], +m[3], 0, 0, timezone);
  }
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : startOfZonedDay(d, timezone);
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
