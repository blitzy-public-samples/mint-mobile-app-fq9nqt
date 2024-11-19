// @version react ^18.0.0

import { useState, useCallback, useEffect } from 'react';
import { Transaction } from '../types/models.types';
import {
  getTransactions,
  updateTransaction,
  categorizeTransaction,
  searchTransactions,
} from '../services/api/transactions.api';

/**
 * Human Tasks:
 * 1. Configure WebSocket connection settings in environment variables
 * 2. Set up error tracking service integration
 * 3. Configure transaction sync performance monitoring
 * 4. Review and adjust pagination settings for production load
 */

// Interface for transaction filtering options
interface TransactionFilters {
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  query?: string;
}

// Interface for transaction state management
interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
}

// Default pagination settings
const DEFAULT_PAGE_SIZE = 20;
const INITIAL_STATE: TransactionState = {
  transactions: [],
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  hasMore: true,
};

/**
 * Custom hook for managing transactions state and operations with real-time updates
 * Implements requirements:
 * - Transaction Management (Technical Specification/1.2 Scope/Core Features)
 * - Real-time Data Synchronization (Technical Specification/5.1 High-Level Architecture Overview)
 */
export function useTransactions(filters: TransactionFilters = {}) {
  const [state, setState] = useState<TransactionState>(INITIAL_STATE);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchTransactions = useCallback(async (
    page: number = 1,
    limit: number = DEFAULT_PAGE_SIZE,
    shouldAppend: boolean = false
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await getTransactions({
        page,
        limit,
        accountId: filters.accountId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        categoryId: filters.categoryId,
      });

      setState(prev => ({
        transactions: shouldAppend ? [...prev.transactions, ...response.data] : response.data,
        loading: false,
        error: null,
        totalCount: response.total,
        currentPage: page,
        hasMore: response.total > (page * limit),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
      }));
    }
  }, [filters.accountId, filters.startDate, filters.endDate, filters.categoryId]);

  const fetchTransactionsCurrentPage = useCallback(async (page: number,
    limit: number) => {
    fetchTransactions(page, limit, false);
  }, [fetchTransactions]);


  const fetchMoreTransactions = useCallback(async () => {
      fetchTransactions(state.currentPage + 1, DEFAULT_PAGE_SIZE, true)
  }, [state.currentPage, fetchTransactions]);

  // Handle transaction updates
  const handleUpdateTransaction = useCallback(async (
    transactionId: string,
    updateData: Partial<Transaction>
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await updateTransaction(transactionId, updateData);

      setState(prev => ({
        ...prev,
        loading: false,
        transactions: prev.transactions.map(t =>
          t.id === transactionId ? response.data : t
        ),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update transaction',
      }));
    }
  }, []);

  // Handle transaction categorization
  const handleCategorizeTransaction = useCallback(async (
    transactionId: string,
    categoryId: string
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await categorizeTransaction(transactionId, categoryId);

      setState(prev => ({
        ...prev,
        loading: false,
        transactions: prev.transactions.map(t =>
          t.id === transactionId ? response.data : t
        ),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to categorize transaction',
      }));
    }
  }, []);

  // Handle transaction search
  const handleSearchTransactions = useCallback(async (
    query: string,
    page: number = 1,
    limit: number = DEFAULT_PAGE_SIZE
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await searchTransactions({
        query,
        page,
        limit,
        sortBy: 'date',
        sortDirection: 'desc',
      });

      setState(prev => ({
        transactions: response.data,
        loading: false,
        error: null,
        totalCount: response.total,
        currentPage: page,
        hasMore: response.total > (page * limit),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to search transactions',
      }));
    }
  }, []);

  // Effect to handle real-time updates and filter changes
  useEffect(() => {
    // Reset state when filters change
    setState(INITIAL_STATE);

    // Initial fetch with new filters
    fetchTransactions(1, DEFAULT_PAGE_SIZE, false);

    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:8080');

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);

      if (update.type === 'TRANSACTION_UPDATE') {
        setState(prev => ({
          ...prev,
          transactions: prev.transactions.map(t =>
            t.id === update.data.id ? update.data : t
          ),
        }));
      }
    };

    return () => {
      ws.close();
    };
  }, [fetchTransactions]);

  return {
    ...state,
    fetchTransactions: fetchTransactionsCurrentPage,
    fetchMoreTransactions: () => fetchMoreTransactions,
    updateTransaction: handleUpdateTransaction,
    categorizeTransaction: handleCategorizeTransaction,
    searchTransactions: handleSearchTransactions,
  };
}