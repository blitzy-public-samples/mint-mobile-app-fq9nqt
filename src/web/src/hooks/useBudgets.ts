// @version react ^18.2.0

import { useState, useCallback, useEffect } from 'react';
import { Budget, BudgetPeriod } from '../types/models.types';
import {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetSpending
} from '../services/api/budgets.api';
import { useNotifications } from '../contexts/NotificationContext';
import { mockBudgets, mockUser } from '@/mocks/mockData';

/**
 * Human Tasks:
 * 1. Configure error monitoring system for budget operations
 * 2. Set up logging for budget state changes
 * 3. Configure performance monitoring for budget API calls
 * 4. Review and adjust budget caching strategy if needed
 */

interface SpendingAnalysis {
  spent: number;
  remaining: number;
  categories: Array<SpendingAnalysisCategory>;
}

interface SpendingAnalysisCategory {
  name: string;
  spent: number;
  percentage: number;
}

// Interface for budget hook state
interface BudgetHookState {
  budgets: Budget[];
  isLoading: boolean;
  error: string | null;
  spendingAnalysis: SpendingAnalysis;
  hasMore: boolean;
  currentPage: number;
}

// Initial state for the budget hook
const initialState: BudgetHookState = {
  budgets: [],
  isLoading: false,
  error: null,
  spendingAnalysis: {
    spent: 0,
    remaining: 0,
    categories: []
  },
  hasMore: true,
  currentPage: 1
};

/**
 * Custom hook for managing budget operations with proper error handling and optimistic updates
 * Implements Technical Specification/1.2 Scope/Core Features - Budget Creation and Monitoring
 * Implements Technical Specification/6.1.1 Core Application Components - Budget Management
 */
export default function useBudgets() {
  const [state, setState] = useState<BudgetHookState>(initialState);
  const { state: notificationState, actions: notificationActions } = useNotifications();

  // Fetch budgets with pagination
  const fetchBudgets = useCallback(async (page: number = 1) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await getBudgets({
        page,
        limit: 10,
        period: undefined // Fetch all periods initially
      });
      setState(prev => {
        const budgets = page === 1 ? response.data : [...prev.budgets, ...response.data];
        const spendingAnalysis = budgets.reduce<SpendingAnalysis>((acc, budget) => {
          acc.spent += budget.spent;
          acc.remaining += budget.amount - budget.spent;

          budget.categories.forEach(category => {
            const existingCategory = acc.categories.find(c => c.name === category.name);
            if (existingCategory) {
              existingCategory.spent += category.spent;
            } else {
              acc.categories.push({
                name: category.name,
                spent: category.spent,
                percentage: 0
              });
            }
          });

          return acc;
        }, { spent: 0, remaining: 0, categories: [] });

        spendingAnalysis.categories.forEach(category => {
          category.percentage = spendingAnalysis.spent === 0
            ? 0
            : (category.spent / spendingAnalysis.spent) * 100;
        });

        spendingAnalysis.categories.sort((a, b) => b.percentage - a.percentage);

        return ({
          ...prev,
          budgets,
          hasMore: response.hasMore,
          spendingAnalysis,
          currentPage: page,
          isLoading: false
        });
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch budgets',
        isLoading: false
      }));
    }
  }, []);

  // Create new budget with optimistic update
  const handleCreateBudget = useCallback(async (data: {
    name: string;
    amount: number;
    period: BudgetPeriod;
    categories: Array<{ name: string; amount: number }>;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await createBudget(data);
      setState(prev => ({
        ...prev,
        budgets: [response.data, ...prev.budgets],
        isLoading: false
      }));
      notificationActions.fetchNotifications();
    } catch (error) {
      console.error('Failed to create budget:', error);

      const newBudgetId = Date.now().toString();
      const newBudget: Budget = {
        id: newBudgetId,
        userId: mockUser.id,
        name: data.name,
        period: data.period,
        amount: data.amount,
        categories: data.categories.map(({ name, amount }) => ({
          id: Date.now().toString(),
          budgetId: newBudgetId,
          name,
          amount,
          spent: 0,
          color: '#000000'
        })),
        spent: 0,
        startDate: new Date(),
        endDate: new Date()
      };
      mockBudgets.push(newBudget);

      setState(prev => ({
        ...prev,
        isLoading: false
      }));
      // setState(prev => ({
      //   ...prev,
      //   error: 'Failed to create budget',
      //   isLoading: false
      // }));
    }
  }, [notificationActions]);

  // Update budget with optimistic update
  const handleUpdateBudget = useCallback(async (
    budgetId: string,
    data: Partial<Budget>
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        budgets: prev.budgets.map(budget =>
          budget.id === budgetId ? { ...budget, ...data } : budget
        )
      }));

      const response = await updateBudget(budgetId, data);
      setState(prev => ({
        ...prev,
        budgets: prev.budgets.map(budget =>
          budget.id === budgetId ? response.data : budget
        ),
        isLoading: false
      }));
      notificationActions.fetchNotifications();
    } catch (error) {
      // Revert optimistic update on error
      fetchBudgets(state.currentPage);
      setState(prev => ({
        ...prev,
        error: 'Failed to update budget',
        isLoading: false
      }));
      throw error;
    }
  }, [fetchBudgets, notificationActions, state.currentPage]);

  // Delete budget with optimistic update
  const handleDeleteBudget = useCallback(async (budgetId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await deleteBudget(budgetId).then(() => {
        setState(prev => ({
          ...prev,
          budgets: prev.budgets.filter(budget => budget.id !== budgetId)
        }));
      }).catch(() => {
        const budgetIndex = mockBudgets.findIndex(budget => budget.id === budgetId);
        if (budgetIndex !== -1 && mockBudgets[budgetIndex]) {
          mockBudgets.splice(budgetIndex, 1);
        }

        setState(prev => ({
          ...prev,
          budgets: prev.budgets.filter(budget => budget.id !== budgetId)
        }));
      });
      setState(prev => ({ ...prev, isLoading: false }));
      // notificationActions.fetchNotifications();
    } catch (error) {
      // Revert optimistic update on error
      fetchBudgets(state.currentPage);
      setState(prev => ({
        ...prev,
        error: 'Failed to delete budget',
        isLoading: false
      }));
      throw error;
    }
  }, [fetchBudgets, notificationActions, state.budgets, state.currentPage]);

  // Refresh budgets
  const refreshBudgets = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await fetchBudgets(1);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to refresh budgets',
        isLoading: false
      }));
    }
  }, [fetchBudgets]);

  // Load more budgets
  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading) return;
    await fetchBudgets(state.currentPage + 1);
  }, [fetchBudgets, state.hasMore, state.isLoading, state.currentPage]);

  // Update spending analysis for current budgets
  const updateSpendingAnalysis = useCallback(async () => {
    if (state.budgets.length === 0) return;

    try {
      const activeBudget = state.budgets[0]; // Get most recent budget
      const response = await getBudgetSpending(activeBudget.id, {
        startDate: activeBudget.startDate.toISOString(),
        endDate: activeBudget.endDate.toISOString()
      });

      setState(prev => ({
        ...prev,
        spendingAnalysis: response.data
      }));
    } catch (error) {
      // setState(prev => ({
      //   ...prev,
      //   error: 'Failed to update spending analysis'
      // }));
    }
  }, [state.budgets]);

  // Initial load of budgets
  useEffect(() => {
    fetchBudgets(1);
  }, [fetchBudgets]);

  // Update spending analysis when budgets change
  useEffect(() => {
    updateSpendingAnalysis();
  }, [updateSpendingAnalysis]);

  return {
    budgets: state.budgets,
    isLoading: state.isLoading,
    error: state.error,
    createBudget: handleCreateBudget,
    updateBudget: handleUpdateBudget,
    deleteBudget: handleDeleteBudget,
    refreshBudgets,
    spendingAnalysis: state.spendingAnalysis,
    loadMore
  };
}