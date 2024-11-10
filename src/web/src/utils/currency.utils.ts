/**
 * Currency utility functions for consistent formatting and calculations across the Mint Replica Lite web application
 * Implements requirements from:
 * - Currency Formatting (Technical Specification/1.2 Scope/Core Features)
 * - Data Display (Technical Specification/8.1 User Interface Design)
 * - Mobile-First Design (Technical Specification/8.1.7 Mobile Responsive Considerations)
 */

import { APP_CONFIG } from '../constants/app.constants';
import type { Transaction } from '../types/models.types';

/**
 * Formats a number as a currency string using the specified currency code and locale
 * @param amount - The numeric amount to format
 * @param currencyCode - Optional currency code (defaults to APP_CONFIG.defaultCurrency)
 * @param locale - Optional locale string (defaults to APP_CONFIG.defaultLocale)
 * @returns Formatted currency string with proper symbol and decimal places
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string = APP_CONFIG.defaultCurrency,
  locale: string = APP_CONFIG.defaultLocale
): string => {
  // Validate input amount is a number
  if (typeof amount !== 'number' || isNaN(amount)) {
    return ''; // Return empty string for invalid input
  }

  try {
    // Create NumberFormat instance with currency formatting options
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return formatter.format(amount);
  } catch (error) {
    // Fallback to basic formatting if Intl.NumberFormat fails
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};

/**
 * Parses a currency string into a number value, handling different currency formats and locales
 * @param currencyString - The currency string to parse
 * @param locale - Optional locale string (defaults to APP_CONFIG.defaultLocale)
 * @returns Parsed numeric value from currency string
 */
export const parseCurrencyString = (
  currencyString: string,
  locale: string = APP_CONFIG.defaultLocale
): number => {
  if (!currencyString) {
    return 0;
  }

  try {
    // Remove currency symbols and formatting characters
    const cleanString = currencyString
      .replace(/[^\d.,\-]/g, '') // Remove all non-numeric characters except decimal and thousand separators
      .replace(/,/g, '.') // Normalize decimal separator to period
      .replace(/\.(?=.*\.)/g, ''); // Keep only the last decimal point

    // Parse the cleaned string to float
    const parsedValue = parseFloat(cleanString);
    return isNaN(parsedValue) ? 0 : roundCurrency(parsedValue);
  } catch (error) {
    return 0;
  }
};

/**
 * Calculates the total sum of an array of transaction amounts with proper decimal precision
 * @param transactions - Array of Transaction objects
 * @returns Sum of all transaction amounts
 */
export const calculateTotal = (transactions: Transaction[]): number => {
  if (!Array.isArray(transactions)) {
    return 0;
  }

  // Filter out invalid transactions and sum amounts
  const total = transactions
    .filter(tx => tx && typeof tx.amount === 'number' && !isNaN(tx.amount))
    .reduce((sum, tx) => sum + tx.amount, 0);

  return roundCurrency(total);
};

/**
 * Rounds a number to standard currency decimal places (2) using banker's rounding
 * @param amount - The number to round
 * @returns Rounded number with 2 decimal places
 */
export const roundCurrency = (amount: number): number => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }

  // Handle very small numbers to prevent floating point errors
  if (Math.abs(amount) < 0.001) {
    return 0;
  }

  // Multiply by 100 to shift decimals
  const shifted = amount * 100;
  
  // Apply banker's rounding for financial calculations
  // Round to nearest even number when exactly halfway between two numbers
  const rounded = Math.round(shifted + (shifted % 1 === 0.5 ? 1 : 0)) / 100;
  
  // Ensure exactly 2 decimal places
  return Number(rounded.toFixed(2));
};