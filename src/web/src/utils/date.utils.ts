/**
 * Date utility functions for standardized date handling across the Mint Replica Lite web application
 * Implements requirements from:
 * - Date Handling (Technical Specification/6.1.2 Core Application Components)
 * - Transaction History (Technical Specification/1.2 Scope/Core Features)
 * - Budget Period Calculations (Technical Specification/8.2.1 Schema Design)
 */

// date-fns v2.30.0
import { format, parseISO, addDays, subDays, differenceInDays } from 'date-fns';
import { APP_CONFIG } from '../constants/app.constants';

/**
 * Formats a date object or ISO string into a localized string using the application's default locale
 * @param date Date object or ISO string to format
 * @param formatString Format pattern to apply (e.g., 'yyyy-MM-dd', 'MMM d, yyyy')
 * @returns Formatted date string according to specified format and locale
 */
export const formatDate = (date: Date | string, formatString: string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString, {
    locale: APP_CONFIG.defaultLocale
  });
};

/**
 * Gets start and end dates for a specified period
 * @param period Period type ('week' | 'month' | 'quarter' | 'year')
 * @param referenceDate Reference date to calculate the range from
 * @returns Object containing start and end dates
 */
export const getDateRange = (
  period: 'week' | 'month' | 'quarter' | 'year',
  referenceDate: Date = new Date()
): { startDate: Date; endDate: Date } => {
  const endDate = new Date(referenceDate);
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = subDays(endDate, 6); // Last 7 days including today
      break;
    case 'month':
      startDate = subDays(endDate, 29); // Last 30 days including today
      break;
    case 'quarter':
      startDate = subDays(endDate, 89); // Last 90 days including today
      break;
    case 'year':
      startDate = subDays(endDate, 364); // Last 365 days including today
      break;
    default:
      throw new Error('Invalid period specified');
  }

  // Normalize dates to start/end of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

/**
 * Checks if a date falls within a specified range, inclusive of start and end dates
 * @param date Date to check
 * @param startDate Start of the range
 * @param endDate End of the range
 * @returns Boolean indicating if date is within range
 */
export const isDateInRange = (
  date: Date,
  startDate: Date,
  endDate: Date
): boolean => {
  // Normalize all dates to UTC midnight for consistent comparison
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  
  const normalizedStart = new Date(startDate);
  normalizedStart.setHours(0, 0, 0, 0);
  
  const normalizedEnd = new Date(endDate);
  normalizedEnd.setHours(23, 59, 59, 999);

  return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
};

/**
 * Returns a human-readable relative date string based on the current date
 * @param date Date to get relative string for
 * @returns Human readable relative date string
 */
export const getRelativeDateString = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffDays = differenceInDays(targetDate, today);

  switch (diffDays) {
    case 0:
      return 'Today';
    case 1:
      return 'Tomorrow';
    case -1:
      return 'Yesterday';
    default:
      if (diffDays > 1) {
        return `In ${diffDays} days`;
      } else {
        return `${Math.abs(diffDays)} days ago`;
      }
  }
};

/**
 * Calculates start and end dates for budget periods with remaining days
 * @param budgetPeriod Type of budget period ('WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY')
 * @returns Object containing period dates and remaining days
 */
export const calculateBudgetPeriodDates = (
  budgetPeriod: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
): { startDate: Date; endDate: Date; daysRemaining: number } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let startDate = new Date(today);
  let endDate = new Date(today);
  
  // Calculate period boundaries based on type
  switch (budgetPeriod) {
    case 'WEEKLY':
      // Start from beginning of current week (Sunday)
      startDate.setDate(today.getDate() - today.getDay());
      endDate = addDays(startDate, 6);
      break;
      
    case 'MONTHLY':
      // Start from beginning of current month
      startDate.setDate(1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
      
    case 'QUARTERLY':
      // Start from beginning of current quarter
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
      startDate = new Date(today.getFullYear(), quarterStartMonth, 1);
      endDate = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
      break;
      
    case 'YEARLY':
      // Start from beginning of current year
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
      break;
      
    default:
      throw new Error('Invalid budget period specified');
  }

  // Calculate remaining days
  const daysRemaining = differenceInDays(endDate, today);

  return {
    startDate,
    endDate,
    daysRemaining
  };
};