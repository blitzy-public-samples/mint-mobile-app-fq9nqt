// @version react ^18.2.0
// @version react-router-dom ^6.0.0

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Goal, GoalType, GoalStatus } from '../../types/models.types';
import { useGoals } from '../../hooks/useGoals';
import ProgressBar from '../../components/common/ProgressBar';
import DashboardLayout from '@/layouts/DashboardLayout';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner';

/**
 * HUMAN TASKS:
 * 1. Configure error tracking service integration
 * 2. Set up real-time notification webhooks
 * 3. Review accessibility compliance with screen reader testing
 * 4. Validate goal amount input formatting across different locales
 */

interface GoalDetailsState {
  goal: Goal | null;
  isLoading: boolean;
  error: string | null;
  isEditing: boolean;
}

/**
 * Detailed view component for managing and tracking individual financial goals
 * Implements requirements from:
 * - Financial goal setting and progress monitoring (Technical Specification/1.2 Scope/Core Features)
 * - User Interface Design (Technical Specification/8.1.4 Budget Creation/Edit)
 */
const GoalDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchGoalById, updateExistingGoal, updateProgress, removeGoal } = useGoals();

  // Initialize component state
  const [state, setState] = useState<GoalDetailsState>({
    goal: null,
    isLoading: true,
    error: null,
    isEditing: false
  });

  // Form state for editing
  const [formData, setFormData] = useState<Partial<Goal>>({});

  /**
   * Loads goal data on component mount and handles errors
   * Implements Technical Specification/1.2 Scope/Core Features
   */
  const loadGoalData = useCallback(async () => {
    if (!id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const goalData = await fetchGoalById(id);
      setState(prev => ({
        ...prev,
        goal: goalData,
        isLoading: false,
        error: null
      }));
      setFormData(goalData);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load goal details. Please try again.'
      }));
    }
  }, [id, fetchGoalById]);

  useEffect(() => {
    loadGoalData();
  }, [loadGoalData]);

  function updateProgressState(newAmount: number) {
    setState(prev => ({ ...prev, goal: { ...prev.goal, currentAmount: newAmount } }));
  }

  /**
   * Handles goal progress updates with validation
   * Implements Technical Specification/8.1.4 Budget Creation/Edit
   */
  const handleUpdateProgress = async (newAmount: number) => {
    if (!state.goal?.id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Validate input amount
      if (newAmount < 0 || newAmount > state.goal.targetAmount) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Invalid progress amount'
        }));
        return;
      }

      await updateProgress(state.goal.id, newAmount);
      await loadGoalData();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to update goal progress. Please try again.'
      }));
    }
  };

  /**
   * Handles goal deletion with confirmation
   * Implements Technical Specification/1.2 Scope/Core Features
   */
  const handleDelete = async () => {
    if (!state.goal?.id) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this goal? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await removeGoal(state.goal.id);
      navigate('/goals');
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to delete goal. Please try again.'
      }));
    }
  };

  /**
   * Handles form submission for goal updates
   * Implements Technical Specification/8.1.4 Budget Creation/Edit
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.goal?.id || !formData) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await updateExistingGoal(state.goal.id, formData).then(async () => {
        setState(prev => ({ ...prev, isEditing: false, }));
        await loadGoalData();
      }).catch(e => setState(prev => ({ ...prev, error: e.message, isLoading: false })));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to update goal. Please try again.'
      }));
    }
  };

  /**
   * Calculates progress percentage for visualization
   */
  const calculateProgress = (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100);
  };

  /**
   * Determines progress bar variant based on goal status
   */
  const getProgressVariant = (status: GoalStatus): 'default' | 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'AT_RISK':
        return 'danger';
      case 'ON_TRACK':
        return 'default';
      default:
        return 'warning';
    }
  };

  const ErrorDetails = state.error ? (
    <div
      role="alert"
      className="text-sm text-red-700"
    >
      {state.error}
    </div>
  ) : null;

  if (state.isLoading) {
    return (
      <DashboardLayout>
        <div className="w-full h-full flex justify-center items-center" role="alert" aria-busy="true">
          <Spinner size="large" color="primary" ariaLabel="Loading goal details" />
        </div>
      </DashboardLayout >
    );
  }

  if (!state.goal) {
    return <DashboardLayout><div>Goal not found</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6" aria-label="Goal details">
        {state.isEditing ? (

          <form onSubmit={handleSubmit} className="space-y-6">
            <h1 className="text-2xl font-bold mb-6">Edit Goal</h1>
            <div className="space-y-2">
              <label htmlFor="name" className="block font-medium">Goal Name</label>
              <input
                type="text"
                id="name"
                value={formData.name || ''}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="block font-medium">Goal Type</label>
              <select
                id="type"
                className="w-full px-4 py-2 border rounded-md"
                value={formData.type || ''}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as GoalType }))}
                required
              >
                <option value="SAVINGS">Savings</option>
                <option value="DEBT_PAYMENT">Debt Payment</option>
                <option value="INVESTMENT">Investment</option>
                <option value="EMERGENCY_FUND">Emergency Fund</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="targetAmount" className="block font-medium">Target Amount</label>
              <input
                type="number"
                id="targetAmount"
                value={formData.targetAmount || ''}
                onChange={e => setFormData(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
                min={0}
                step={1}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="targetDate" className="block font-medium">Target Date</label>
              <input
                className="w-full px-4 py-2 border rounded-md"
                type="date"
                id="targetDate"
                value={formData.targetDate}
                onChange={e => setFormData(prev => ({ ...prev, targetDate: e.target.value as Date }))}
                required
              />
              {ErrorDetails}
            </div>
            
            <div className="flex justify-end gap-4">
              {/* <Button type="submit" disabled={state.isLoading}>
                Save Changes
              </button> */}

              {/* <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, isEditing: false }))}
              >
                Cancel
              </button> */}

              <Button
                variant="secondary"
                onClick={() => setState(prev => ({ ...prev, isEditing: false, error: null }))}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                type="submit"
                disabled={state.isLoading}
                isLoading={state.isLoading}
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="goal-view">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {state.goal.name}
                </h1>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setState(prev => ({ ...prev, isEditing: true, error: null }))}
                  className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
                  aria-label="Edit goal"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-error-500 text-white rounded hover:bg-error-600"
                  aria-label="Delete goal"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="info-item">
                <span className="block font-medium">Type:</span>
                <span>{state.goal.type}</span>
              </div>
              <div className="info-item">
                <span className="block font-medium">Target Amount:</span>
                <span>{state.goal.targetAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
              </div>
              <div className="info-item">
                <span className="block font-medium">Current Amount:</span>
                <span>{state.goal.currentAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
              </div>
              <div className="info-item">
                <span className="block font-medium">Target Date:</span>
                <span>{new Date(state.goal.targetDate).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="block font-medium">Status:</span>
                <span className={`status-badge ${state.goal.status.toLowerCase()}`}>
                  {state.goal.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="goal-progress mt-4" aria-label="Goal progress">
              <ProgressBar
                value={state.goal.currentAmount}
                max={state.goal.targetAmount}
                variant={getProgressVariant(state.goal.status)}
                label="Progress"
                showPercentage
                ariaLabel={`Goal progress: ${calculateProgress(state.goal.currentAmount, state.goal.targetAmount)}%`}
              />
            </div>

            <div className="progress-update mt-4 space-y-2">
              <span className="block font-medium">Update Progress:</span>
              <div className="flex flex-col justify-end gap-4">
                <input
                  type="number"
                  min={0}
                  max={state.goal.targetAmount}
                  step={1}
                  value={state.goal.currentAmount}
                  onChange={e => updateProgressState(Number(e.target.value))}
                  aria-label="Update current amount"
                />
                {ErrorDetails}
                <Button
                  variant="secondary"
                  onClick={() => navigate('/goals')}
                  type="button"
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  onClick={() => handleUpdateProgress(state.goal?.currentAmount ?? 0)}
                  disabled={state.isLoading}
                  isLoading={state.isLoading}
                >
                  Update
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GoalDetails;