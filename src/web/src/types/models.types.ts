// @human-task: Ensure crypto package is installed in package.json for UUID type support
// @version: crypto ^1.0.0

/**
 * Core domain model type definitions for the Mint Replica Lite web application
 * Addresses requirements:
 * - Core Features - Data Models (Technical Specification/1.2 Scope/Core Features)
 * - Database Schema (Technical Specification/8.2.1 Schema Design)
 */

// Type for supported account types in the system
export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT' | 'INVESTMENT' | 'LOAN';

// Type for categorizing financial transactions
export type TransactionCategory = 
  | 'INCOME' 
  | 'SHOPPING' 
  | 'GROCERIES' 
  | 'TRANSPORT' 
  | 'UTILITIES' 
  | 'ENTERTAINMENT' 
  | 'HEALTHCARE' 
  | 'OTHER';

// Type for budget tracking periods
export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

// Type for different kinds of financial goals
export type GoalType = 
  | 'SAVINGS' 
  | 'DEBT_PAYMENT' 
  | 'INVESTMENT' 
  | 'EMERGENCY_FUND' 
  | 'CUSTOM';

// Type for tracking goal achievement status
export type GoalStatus = 
  | 'NOT_STARTED' 
  | 'IN_PROGRESS' 
  | 'ON_TRACK' 
  | 'AT_RISK' 
  | 'COMPLETED';

// Interface representing a user in the system with complete profile and security information
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: Record<string, any>;
}

// Interface representing a financial account with balance and sync status
export interface Account {
  id: string;
  userId: string;
  institutionId: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  lastSynced: Date;
  isActive: boolean;
}

// Interface representing a financial transaction with amount and category
export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  amount: number;
  date: Date;
  description: string;
  pending: boolean;
  metadata: Record<string, any>;
}

// Interface representing a budget category with spending tracking
export interface BudgetCategory {
  id: string;
  budgetId: string;
  name: string;
  amount: number;
  spent: number;
  color: string;
}

// Interface representing a budget with period and category allocations
export interface Budget {
  id: string;
  userId: string;
  name: string;
  period: BudgetPeriod;
  amount: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  categories: BudgetCategory[];
}

// Interface representing a financial goal with progress tracking
export interface Goal {
  id: string;
  userId: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  status: GoalStatus;
}

// Interface representing an investment holding with cost basis tracking
export interface Investment {
  id: string;
  accountId: string;
  symbol: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
  lastUpdated: Date;
}