// @version axios ^1.4.0

import { mockTransactions } from '@/mocks/mockData';
import { ApiResponse, PaginatedResponse } from '../../types/api.types';
import { Transaction } from '../../types/models.types';
import { createApiRequest } from '../../utils/api.utils';

/**
 * Human Tasks:
 * 1. Configure API rate limiting thresholds in the API gateway
 * 2. Set up monitoring for transaction sync performance
 * 3. Configure error tracking for failed transaction operations
 * 4. Review and adjust pagination limits for production load
 */

// Default request configuration
const apiRequest = createApiRequest({
  includeAuth: true,
  headers: {},
  timeout: 30000,
  withCredentials: true,
  retryOnError: true,
  maxRetries: 0
});

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Transaction Management
 * Retrieves a paginated list of transactions with comprehensive filtering options
 */
export async function getTransactions({
  page = 1,
  limit = 20,
  accountId,
  startDate,
  endDate,
  categoryId
}: {
  page: number;
  limit: number;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
}): Promise<PaginatedResponse<Transaction>> {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(accountId && { accountId }),
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() }),
      ...(categoryId && { categoryId })
    });

    const response = await apiRequest.get<PaginatedResponse<Transaction>>(
      `/transactions?${queryParams.toString()}`
    );
    return response.data;
  } catch (error) {
    console.warn('Using mock transaction data:', error);
    
    // Filter transactions based on query parameters
    let filtered = [...mockTransactions];
    
    if (accountId) {
      filtered = filtered.filter(t => t.accountId === accountId);
    }
    if (startDate) {
      filtered = filtered.filter(t => t.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(t => t.date <= endDate);
    }
    if (categoryId) {
      filtered = filtered.filter(t => t.categoryId === categoryId);
    }

    // Calculate pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      page,
      limit,
      total: filtered.length,
      hasMore: filtered.length > end,
      totalPages: Math.ceil(filtered.length / limit)
    };
  }
}

/**
 * Implements Technical Specification/8.3.1 REST API Endpoints
 * Retrieves detailed information for a single transaction
 */
export async function getTransactionById(
  transactionId: string
): Promise<ApiResponse<Transaction>> {
  if (!transactionId?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error('Invalid transaction ID format');
  }

  const response = await apiRequest.get<ApiResponse<Transaction>>(
    `/transactions/${transactionId}`
  );
  return response.data;
}

/**
 * Implements Technical Specification/8.3.1 REST API Endpoints
 * Updates an existing transaction with partial data
 */
export async function updateTransaction(
  transactionId: string,
  updateData: Partial<Transaction>
): Promise<ApiResponse<Transaction>> {
  if (!transactionId?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error('Invalid transaction ID format');
  }

  // Validate required fields in updateData
  if ('amount' in updateData && typeof updateData.amount !== 'number') {
    throw new Error('Invalid amount format');
  }

  if ('date' in updateData && !(updateData.date instanceof Date)) {
    throw new Error('Invalid date format');
  }

  const response = await apiRequest.put<ApiResponse<Transaction>>(
    `/transactions/${transactionId}`,
    updateData
  );
  return response.data;
}

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Transaction Management
 * Updates the category of a transaction with validation
 */
export async function categorizeTransaction(
  transactionId: string,
  categoryId: string
): Promise<ApiResponse<Transaction>> {
  if (!transactionId?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error('Invalid transaction ID format');
  }

  if (!categoryId?.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error('Invalid category ID format');
  }

  const response = await apiRequest.patch<ApiResponse<Transaction>>(
    `/transactions/${transactionId}/category`,
    { categoryId }
  );
  return response.data;
}

/**
 * Implements Technical Specification/5.1 High-Level Architecture Overview - Data Synchronization
 * Searches transactions with advanced filtering and sorting capabilities
 */
export async function searchTransactions({
  query,
  page = 1,
  limit = 20,
  sortBy = 'date',
  sortDirection = 'desc'
}: {
  query: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}): Promise<PaginatedResponse<Transaction>> {
  // Validate search parameters
  if (!query?.trim()) {
    throw new Error('Search query is required');
  }

  if (page < 1 || limit < 1) {
    throw new Error('Invalid pagination parameters');
  }

  const allowedSortFields = ['date', 'amount', 'description'];
  if (!allowedSortFields.includes(sortBy)) {
    throw new Error('Invalid sort field');
  }

  const queryParams = new URLSearchParams({
    query: query.trim(),
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortDirection
  });

  const response = await apiRequest.get<PaginatedResponse<Transaction>>(
    `/transactions/search?${queryParams.toString()}`
  );
  return response.data;
}