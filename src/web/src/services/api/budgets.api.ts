// @version axios ^1.4.0

import axios, { AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse } from '../../types/api.types';
import { Budget, BudgetPeriod } from '../../types/models.types';
import { API_CONFIG } from '../../config/api.config';
import { mockBudgets } from '@/mocks/mockData';

/**
 * Human Tasks:
 * 1. Ensure axios ^1.4.0 is added to package.json dependencies
 * 2. Configure error monitoring system to track budget-related API errors
 * 3. Set up logging for budget operations tracking
 * 4. Review and adjust API timeout settings for budget operations if needed
 */

// API endpoints for budget operations
const BUDGETS_API_ENDPOINTS = {
  BASE: '/budgets',
  GET_ALL: '/budgets',
  GET_BY_ID: '/budgets/:id',
  CREATE: '/budgets',
  UPDATE: '/budgets/:id',
  DELETE: '/budgets/:id',
  GET_CATEGORIES: '/budgets/categories',
  GET_SPENDING: '/budgets/:id/spending'
} as const;

// Types for budget-related requests
interface CreateBudgetData {
  name: string;
  amount: number;
  period: BudgetPeriod;
  categories: Array<{
    name: string;
    amount: number;
  }>;
}

interface BudgetSpendingResponse {
  spent: number;
  remaining: number;
  categories: Array<{
    name: string;
    spent: number;
    percentage: number;
  }>;
}

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Budget Management
 * Retrieves paginated list of user budgets with optional filtering by period
 */
export async function getBudgets(params: {
  page?: number;
  limit?: number;
  period?: BudgetPeriod;
}): Promise<PaginatedResponse<Budget>> {
  try {
    const response = await axios.get<PaginatedResponse<Budget>>(
      `${API_CONFIG.BASE_URL}${BUDGETS_API_ENDPOINTS.GET_ALL}`,
      {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          period: params.period
        },
        timeout: API_CONFIG.TIMEOUT,
        withCredentials: true
      }
    ).catch((error) => {
      console.log(error);

      const mockResponse = {
        data: {
          data: mockBudgets,
          page: params.page || 1,
          limit: params.limit || 10,
          total: mockBudgets.length,
          hasMore: false,
          totalPages: 1,
        }
      };
      return mockResponse as AxiosResponse<PaginatedResponse<Budget>>;
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching budgets:', error);
    throw error;
  }
}

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Budget Management
 * Retrieves a specific budget by ID with full category details
 */
export async function getBudgetById(budgetId: string): Promise<ApiResponse<Budget>> {
  try {
    if (!budgetId) {
      throw new Error('Budget ID is required');
    }

    const response = await axios.get<ApiResponse<Budget>>(
      `${API_CONFIG.BASE_URL}${BUDGETS_API_ENDPOINTS.GET_BY_ID.replace(':id', budgetId)}`,
      {
        timeout: API_CONFIG.TIMEOUT,
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching budget ${budgetId}:`, error);
    throw error;
  }
}

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Budget Management
 * Creates a new budget with categories and spending limits
 */
export async function createBudget(budgetData: CreateBudgetData): Promise<ApiResponse<Budget>> {
  try {
    // Validate budget data
    if (!budgetData.name || !budgetData.amount || !budgetData.period) {
      throw new Error('Invalid budget data: name, amount, and period are required');
    }

    // Validate category amounts don't exceed budget amount
    const totalCategoryAmount = budgetData.categories.reduce(
      (sum, category) => sum + category.amount,
      0
    );
    if (totalCategoryAmount > budgetData.amount) {
      throw new Error('Total category amounts cannot exceed budget amount');
    }

    const response = await axios.post<ApiResponse<Budget>>(
      `${API_CONFIG.BASE_URL}${BUDGETS_API_ENDPOINTS.CREATE}`,
      budgetData,
      {
        timeout: API_CONFIG.TIMEOUT,
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating budget:', error);
    throw error;
  }
}

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Budget Management
 * Updates an existing budget with partial data
 */
export async function updateBudget(
  budgetId: string,
  budgetData: Partial<Budget>
): Promise<ApiResponse<Budget>> {
  try {
    if (!budgetId) {
      throw new Error('Budget ID is required');
    }

    // Validate update data if amount or categories are being updated
    if (budgetData.amount && budgetData.categories) {
      const totalCategoryAmount = budgetData.categories.reduce(
        (sum, category) => sum + category.amount,
        0
      );
      if (totalCategoryAmount > budgetData.amount) {
        throw new Error('Total category amounts cannot exceed budget amount');
      }
    }

    const response = await axios.put<ApiResponse<Budget>>(
      `${API_CONFIG.BASE_URL}${BUDGETS_API_ENDPOINTS.UPDATE.replace(':id', budgetId)}`,
      budgetData,
      {
        timeout: API_CONFIG.TIMEOUT,
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating budget ${budgetId}:`, error);
    throw error;
  }
}

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Budget Management
 * Deletes a budget and its associated categories
 */
export async function deleteBudget(budgetId: string): Promise<ApiResponse<void>> {
  try {
    if (!budgetId) {
      throw new Error('Budget ID is required');
    }

    const response = await axios.delete<ApiResponse<void>>(
      `${API_CONFIG.BASE_URL}${BUDGETS_API_ENDPOINTS.DELETE.replace(':id', budgetId)}`,
      {
        timeout: API_CONFIG.TIMEOUT,
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting budget ${budgetId}:`, error);
    throw error;
  }
}

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Budget Management
 * Retrieves detailed spending analysis for a budget period
 */
export async function getBudgetSpending(
  budgetId: string,
  params: {
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<BudgetSpendingResponse>> {
  try {
    if (!budgetId) {
      throw new Error('Budget ID is required');
    }

    const response = await axios.get<ApiResponse<BudgetSpendingResponse>>(
      `${API_CONFIG.BASE_URL}${BUDGETS_API_ENDPOINTS.GET_SPENDING.replace(':id', budgetId)}`,
      {
        params: {
          startDate: params.startDate,
          endDate: params.endDate
        },
        timeout: API_CONFIG.TIMEOUT,
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching budget spending ${budgetId}:`, error);
    throw error;
  }
}