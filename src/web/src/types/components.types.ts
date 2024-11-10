/**
 * TypeScript type definitions for React components in the Mint Replica Lite web application
 * Addresses requirements:
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 * - Component Architecture (Technical Specification/6.1.1 Core Application Components)
 */

// Third-party imports
// @version: react ^18.0.0
import { ReactNode } from 'react';
// @version: chart.js ^4.0.0
import { ChartOptions } from 'chart.js';

// Internal imports
import { Account, Transaction } from './models.types';

/**
 * Button style variants following design system specifications
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'success';

/**
 * Button size options following design system specifications
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Supported input types with validation
 */
export type InputType = 'text' | 'password' | 'email' | 'number' | 'date' | 'tel' | 'search';

/**
 * Supported chart types for financial visualizations
 */
export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'radar';

/**
 * Props interface for custom button component following design system specifications
 */
export interface ButtonProps {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  isLoading?: boolean;
}

/**
 * Props interface for card container component with loading state
 */
export interface CardProps {
  title: string;
  children: ReactNode;
  loading?: boolean;
  className?: string;
  testId?: string;
  elevated?: boolean;
}

/**
 * Props interface for custom input component with validation support
 */
export interface InputProps {
  type: InputType;
  name: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  helperText?: string;
}

/**
 * Props interface for chart components with responsive options
 */
export interface ChartProps {
  data: any[];
  options: ChartOptions;
  type: ChartType;
  height?: string;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
}

/**
 * Props interface for account summary card with sync functionality
 */
export interface AccountCardProps {
  account: Account;
  loading?: boolean;
  onSync: () => void;
  onClick: () => void;
  showBalance?: boolean;
  className?: string;
}

/**
 * Props interface for transaction list item with category display
 */
export interface TransactionItemProps {
  transaction: Transaction;
  showCategory?: boolean;
  onClick: () => void;
  highlightPending?: boolean;
  className?: string;
}