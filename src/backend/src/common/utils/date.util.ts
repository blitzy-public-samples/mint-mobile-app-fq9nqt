// @ts-nocheck
/**
 * Date utility functions for the Mint Replica Lite backend application
 * 
 * Human Tasks:
 * 1. Verify that the timezone configuration in your deployment environment matches the UTC setting
 * 2. Ensure dayjs is added to your package.json dependencies
 */

// Third-party imports with versions
import dayjs from 'dayjs'; // ^1.11.0
import utc from 'dayjs/plugin/utc'; // ^1.11.0
import timezone from 'dayjs/plugin/timezone'; // ^1.11.0

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Constants
export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';
export const DEFAULT_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const TIMEZONE = 'UTC';

/**
 * Formats a date string or timestamp into a standardized format
 * @param date - Input date as string, number, or Date object
 * @param format - Desired output format (defaults to DEFAULT_DATE_FORMAT)
 * @returns Formatted date string
 * 
 * Requirements addressed:
 * - Transaction Processing Flow: Standardizes date formats for transaction records
 * - Data Architecture: Ensures consistent date formatting for storage
 */
export const formatDate = (
  date: string | number | Date,
  format: string = DEFAULT_DATE_FORMAT
): string => {
  return dayjs(date).tz(TIMEZONE).format(format);
};

/**
 * Parses a date string into a standardized Date object
 * @param dateString - Input date string
 * @returns Parsed Date object
 * 
 * Requirements addressed:
 * - Data Architecture: Ensures consistent date parsing for data retrieval
 */
export const parseDate = (dateString: string): Date => {
  return dayjs(dateString).tz(TIMEZONE).toDate();
};

/**
 * Gets the start date of the month for a given date
 * @param date - Input date as string or Date object
 * @returns First day of the month as Date object
 * 
 * Requirements addressed:
 * - Transaction Processing Flow: Supports monthly transaction aggregation
 */
export const getStartOfMonth = (date: string | Date): Date => {
  return dayjs(date).tz(TIMEZONE).startOf('month').toDate();
};

/**
 * Gets the end date of the month for a given date
 * @param date - Input date as string or Date object
 * @returns Last day of the month as Date object
 * 
 * Requirements addressed:
 * - Transaction Processing Flow: Supports monthly transaction aggregation
 */
export const getEndOfMonth = (date: string | Date): Date => {
  return dayjs(date).tz(TIMEZONE).endOf('month').toDate();
};

/**
 * Adds a specified number of days to a date
 * @param date - Input date as string or Date object
 * @param days - Number of days to add
 * @returns Date with added days
 * 
 * Requirements addressed:
 * - Transaction Processing Flow: Supports date calculations for transaction processing
 */
export const addDays = (date: string | Date, days: number): Date => {
  return dayjs(date).tz(TIMEZONE).add(days, 'day').toDate();
};

/**
 * Subtracts a specified number of days from a date
 * @param date - Input date as string or Date object
 * @param days - Number of days to subtract
 * @returns Date with subtracted days
 * 
 * Requirements addressed:
 * - Transaction Processing Flow: Supports date calculations for transaction processing
 */
export const subtractDays = (date: string | Date, days: number): Date => {
  return dayjs(date).tz(TIMEZONE).subtract(days, 'day').toDate();
};

/**
 * Checks if a date falls between two other dates
 * @param date - Date to check
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Boolean indicating if date is within range
 * 
 * Requirements addressed:
 * - Transaction Processing Flow: Supports date range validation for transaction filtering
 */
export const isDateBetween = (
  date: string | Date,
  startDate: string | Date,
  endDate: string | Date
): boolean => {
  const checkDate = dayjs(date).tz(TIMEZONE);
  const start = dayjs(startDate).tz(TIMEZONE);
  const end = dayjs(endDate).tz(TIMEZONE);
  return checkDate.isAfter(start) && checkDate.isBefore(end);
};

/**
 * Gets the difference between two dates in specified units
 * @param startDate - Start date
 * @param endDate - End date
 * @param unit - Unit of time measurement (e.g., 'day', 'month', 'year')
 * @returns Numeric difference in specified units
 * 
 * Requirements addressed:
 * - Transaction Processing Flow: Supports date difference calculations
 * - Data Architecture: Enables time-based data analysis
 */
export const getDateDifference = (
  startDate: string | Date,
  endDate: string | Date,
  unit: string
): number => {
  const start = dayjs(startDate).tz(TIMEZONE);
  const end = dayjs(endDate).tz(TIMEZONE);
  return end.diff(start, unit);
};