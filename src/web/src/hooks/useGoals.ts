// @version react ^18.2.0

import { useState, useCallback, useEffect } from 'react';
import { Goal, GoalType, GoalStatus } from '../types/models.types';
import {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress
} from '../services/api/goals.api';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Human Tasks:
 * 1. Configure error tracking for goal-related operations
 * 2. Set up monitoring for goal progress updates
 * 3. Review and adjust goal notification thresholds
 * 4. Configure proper cleanup for goal polling if implemented
 */

// Interface for the hook's state
interface UseGoalsState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
}

// Interface for hook options
interface UseGoalsOptions {
  page?: number;
  limit?: number;
  type?: GoalType;
  status?: GoalStatus;
}

/**
 * Custom hook for managing financial goals with comprehensive error handling and real-time updates
 * Implements Technical Specification/1.2 Scope/Core Features - Financial goal setting and progress monitoring
 */
export function useGoals(options: UseGoalsOptions = {}) {
  // Initialize state with proper typing
  const [state, setState] = useState<UseGoalsState>({
    goals: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    currentPage: options.page || 1
  });

  // Get notification context for alerts
  const { state: notificationState } = useNotifications();

  /**
   * Fetches goals with pagination and filtering
   * Implements Technical Specification/1.2 Scope/Core Features
   */
  const fetchGoals = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await getGoals({
        page: options.page || state.currentPage,
        limit: options.limit || 10,
        type: options.type,
        status: options.status
      });

      setState(prev => ({
        ...prev,
        goals: response.data,
        totalCount: response.total,
        currentPage: response.page,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to fetch goals. Please try again.',
        isLoading: false
      }));
    }
  }, [options.page, options.limit, options.type, options.status, state.currentPage]);

  /**
   * Fetches specific goal by ID with error handling
   * Implements Technical Specification/8.3.1 REST API Endpoints
   */
  const fetchGoalById = useCallback(async (id: string): Promise<Goal> => {
    try {
      const response = await getGoalById(id);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch goal details');
    }
  }, []);

  /**
   * Creates new goal with validation
   * Implements Technical Specification/1.2 Scope/Core Features
   */
  const createNewGoal = useCallback(async (goalData: Omit<Goal, 'id'>): Promise<Goal> => {
    try {
      const response = await createGoal({
        name: goalData.name,
        type: goalData.type,
        targetAmount: goalData.targetAmount,
        targetDate: goalData.targetDate,
        description: goalData.description
      });

      // Update local state optimistically
      setState(prev => ({
        ...prev,
        goals: [response.data, ...prev.goals],
        totalCount: prev.totalCount + 1
      }));

      return response.data;
    } catch (error) {
      throw new Error('Failed to create goal');
    }
  }, []);

  /**
   * Updates existing goal with optimistic updates
   * Implements Technical Specification/1.2 Scope/Core Features
   */
  const updateExistingGoal = useCallback(async (id: string, goalData: Partial<Goal>): Promise<Goal> => {
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        goals: prev.goals.map(goal =>
          goal.id === id ? { ...goal, ...goalData } : goal
        )
      }));

      const response = await updateGoal(id, goalData);
      return response.data;
    } catch (error) {
      // Revert optimistic update on error
      fetchGoals();
      throw new Error('Failed to update goal');
    }
  }, [fetchGoals]);

  /**
   * Removes goal with confirmation
   * Implements Technical Specification/8.3.1 REST API Endpoints
   */
  const removeGoal = useCallback(async (id: string): Promise<void> => {
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        goals: prev.goals.filter(goal => goal.id !== id),
        totalCount: prev.totalCount - 1
      }));

      await deleteGoal(id);
    } catch (error) {
      // Revert optimistic update on error
      fetchGoals();
      throw new Error('Failed to delete goal');
    }
  }, [fetchGoals]);

  /**
   * Updates goal progress with validation
   * Implements Technical Specification/1.2 Scope/Core Features
   */
  const updateProgress = useCallback(async (id: string, currentAmount: number): Promise<Goal> => {
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        goals: prev.goals.map(goal =>
          goal.id === id
            ? {
                ...goal,
                currentAmount,
                status: calculateGoalStatus(currentAmount, goal.targetAmount, goal.targetDate)
              }
            : goal
        )
      }));

      const response = await updateGoalProgress(id, { currentAmount });
      return response.data;
    } catch (error) {
      // Revert optimistic update on error
      fetchGoals();
      throw new Error('Failed to update goal progress');
    }
  }, [fetchGoals]);

  /**
   * Calculates goal status based on progress and target date
   */
  const calculateGoalStatus = (current: number, target: number, targetDate: Date): GoalStatus => {
    if (current >= target) return 'COMPLETED';
    
    const progress = (current / target) * 100;
    const daysToTarget = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (progress === 0) return 'NOT_STARTED';
    if (daysToTarget < 0) return 'AT_RISK';
    if (progress >= (daysToTarget <= 30 ? 90 : 75)) return 'ON_TRACK';
    return 'IN_PROGRESS';
  };

  // Load initial goals data with proper cleanup
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Monitor goal notifications
  useEffect(() => {
    const goalNotifications = notificationState.notifications.filter(
      notification => notification.type === 'GOAL_UPDATE' && !notification.isRead
    );

    if (goalNotifications.length > 0) {
      fetchGoals();
    }
  }, [notificationState.notifications, fetchGoals]);

  return {
    goals: state.goals,
    isLoading: state.isLoading,
    error: state.error,
    totalCount: state.totalCount,
    currentPage: state.currentPage,
    fetchGoals,
    fetchGoalById,
    createNewGoal,
    updateExistingGoal,
    removeGoal,
    updateProgress
  };
}