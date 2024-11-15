// @version axios ^1.4.0

import { ApiResponse, PaginatedResponse } from '../../types/api.types';
import { Goal, GoalType, GoalStatus } from '../../types/models.types';
import { createApiRequest, handleApiError } from '../../utils/api.utils';
import { API_CONFIG } from '../../config/api.config';
import { AxiosError } from 'axios';

/**
 * Human Tasks:
 * 1. Ensure axios ^1.4.0 is added to package.json dependencies
 * 2. Configure API monitoring for goal-related endpoints
 * 3. Set up error tracking for goal progress validation failures
 * 4. Review and adjust goal progress update thresholds if needed
 */

// API endpoints for goals management
const GOALS_API_ENDPOINTS = {
  GET_GOALS: '/api/v1/goals',
  GET_GOAL: '/api/v1/goals/:id',
  CREATE_GOAL: '/api/v1/goals',
  UPDATE_GOAL: '/api/v1/goals/:id',
  DELETE_GOAL: '/api/v1/goals/:id',
  UPDATE_PROGRESS: '/api/v1/goals/:id/progress'
} as const;

// Interface for goal creation parameters
interface CreateGoalParams {
  name: string;
  type: GoalType;
  targetAmount: number;
  targetDate: Date;
  description?: string;
}

// Interface for goal update parameters
interface UpdateGoalParams {
  name?: string;
  targetAmount?: number;
  targetDate?: Date;
  description?: string;
}

// Interface for goal progress update parameters
interface UpdateProgressParams {
  currentAmount: number;
}

// Interface for goal filtering parameters
interface GetGoalsParams {
  page?: number;
  limit?: number;
  type?: GoalType;
  status?: GoalStatus;
}

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Financial goal setting and progress monitoring
 * Retrieves paginated list of user's financial goals with filtering options
 */
export async function getGoals(params: GetGoalsParams = {}): Promise<PaginatedResponse<Goal>> {
  try {
    const api = createApiRequest({
      includeAuth: true,
      timeout: API_CONFIG.TIMEOUT,
      retryOnError: true,
      maxRetries: 0
    });

    const response = await api.get(GOALS_API_ENDPOINTS.GET_GOALS, {
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        type: params.type,
        status: params.status
      }
    });

    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
}

/**
 * Implements Technical Specification/8.3.1 REST API Endpoints
 * Retrieves a specific goal by ID with full details
 */
export async function getGoalById(id: string): Promise<ApiResponse<Goal>> {
  try {
    const api = createApiRequest({
      includeAuth: true,
      timeout: API_CONFIG.TIMEOUT
    });

    const response = await api.get(GOALS_API_ENDPOINTS.GET_GOAL.replace(':id', id));
    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
}

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Financial goal setting and progress monitoring
 * Creates a new financial goal with validation
 */
export async function createGoal(goalData: CreateGoalParams): Promise<ApiResponse<Goal>> {
  try {
    const api = createApiRequest({
      includeAuth: true,
      timeout: API_CONFIG.TIMEOUT
    });

    // Validate required fields
    if (!goalData.name || !goalData.type || !goalData.targetAmount || !goalData.targetDate) {
      throw new Error('Missing required goal fields');
    }

    // Validate target amount
    if (goalData.targetAmount <= 0) {
      throw new Error('Target amount must be greater than zero');
    }

    // Validate target date is in the future
    if (new Date(goalData.targetDate) <= new Date()) {
      throw new Error('Target date must be in the future');
    }

    const response = await api.post(GOALS_API_ENDPOINTS.CREATE_GOAL, {
      ...goalData,
      targetDate: new Date(goalData.targetDate).toISOString()
    });

    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
}

/**
 * Implements Technical Specification/8.3.1 REST API Endpoints
 * Updates an existing goal with partial data
 */
export async function updateGoal(id: string, goalData: UpdateGoalParams): Promise<ApiResponse<Goal>> {
  try {
    const api = createApiRequest({
      includeAuth: true,
      timeout: API_CONFIG.TIMEOUT
    });

    // Validate target amount if provided
    if (goalData.targetAmount !== undefined && goalData.targetAmount <= 0) {
      throw new Error('Target amount must be greater than zero');
    }

    // Validate target date if provided
    if (goalData.targetDate && new Date(goalData.targetDate) <= new Date()) {
      throw new Error('Target date must be in the future');
    }

    const response = await api.put(
      GOALS_API_ENDPOINTS.UPDATE_GOAL.replace(':id', id),
      {
        ...goalData,
        targetDate: goalData.targetDate ? new Date(goalData.targetDate).toISOString() : undefined
      }
    );

    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
}

/**
 * Implements Technical Specification/8.3.1 REST API Endpoints
 * Deletes a goal with confirmation
 */
export async function deleteGoal(id: string): Promise<ApiResponse<void>> {
  try {
    const api = createApiRequest({
      includeAuth: true,
      timeout: API_CONFIG.TIMEOUT
    });

    const response = await api.delete(GOALS_API_ENDPOINTS.DELETE_GOAL.replace(':id', id));
    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
}

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Financial goal setting and progress monitoring
 * Updates the progress of a goal with validation
 */
export async function updateGoalProgress(
  id: string,
  progressData: UpdateProgressParams
): Promise<ApiResponse<Goal>> {
  try {
    const api = createApiRequest({
      includeAuth: true,
      timeout: API_CONFIG.TIMEOUT
    });

    // Validate progress amount
    if (progressData.currentAmount < 0) {
      throw new Error('Current amount cannot be negative');
    }

    // Get current goal to validate against target
    const currentGoal = await getGoalById(id);
    if (progressData.currentAmount > currentGoal.data.targetAmount) {
      throw new Error('Current amount cannot exceed target amount');
    }

    const response = await api.patch(
      GOALS_API_ENDPOINTS.UPDATE_PROGRESS.replace(':id', id),
      progressData
    );

    return response.data;
  } catch (error) {
    throw handleApiError(error as AxiosError);
  }
}