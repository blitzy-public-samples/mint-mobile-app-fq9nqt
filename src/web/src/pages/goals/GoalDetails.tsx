// @version react ^18.2.0
// @version react-router-dom ^6.0.0

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Goal, GoalType, GoalStatus } from '../../types/models.types';
import { useGoals } from '../../hooks/useGoals';
import ProgressBar from '../../components/common/ProgressBar';
import DashboardLayout from '@/layouts/DashboardLayout';

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
        throw new Error('Invalid progress amount');
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
      await updateExistingGoal(state.goal.id, formData);
      setState(prev => ({ ...prev, isEditing: false }));
      await loadGoalData();
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

  if (state.isLoading) {
    return <div aria-label="Loading goal details">Loading...</div>;
  }

  if (state.error) {
    return (
      <div role="alert" className="error-message">
        {state.error}
      </div>
    );
  }

  if (!state.goal) {
    return <div>Goal not found</div>;
  }

  return (
    <DashboardLayout>
      <div className="goal-details" aria-label="Goal details">
        {state.isEditing ? (
          <form onSubmit={handleSubmit} className="goal-edit-form">
            <div className="form-group">
              <label htmlFor="name">Goal Name</label>
              <input
                type="text"
                id="name"
                value={formData.name || ''}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Goal Type</label>
              <select
                id="type"
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

            <div className="form-group">
              <label htmlFor="targetAmount">Target Amount</label>
              <input
                type="number"
                id="targetAmount"
                value={formData.targetAmount || ''}
                onChange={e => setFormData(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="targetDate">Target Date</label>
              <input
                type="date"
                id="targetDate"
                value={formData.targetDate ? new Date(formData.targetDate).toISOString().split('T')[0] : ''}
                onChange={e => setFormData(prev => ({ ...prev, targetDate: new Date(e.target.value) }))}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={state.isLoading}>
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, isEditing: false }))}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="goal-view">
            <div className="goal-header">
              <h1>{state.goal.name}</h1>
              <div className="goal-actions">
                <button
                  onClick={() => setState(prev => ({ ...prev, isEditing: true }))}
                  aria-label="Edit goal"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="delete-button"
                  aria-label="Delete goal"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="goal-info">
              <div className="info-item">
                <span className="label">Type:</span>
                <span>{state.goal.type}</span>
              </div>
              <div className="info-item">
                <span className="label">Target Amount:</span>
                <span>{state.goal.targetAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
              </div>
              <div className="info-item">
                <span className="label">Current Amount:</span>
                <span>{state.goal.currentAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
              </div>
              <div className="info-item">
                <span className="label">Target Date:</span>
                <span>{new Date(state.goal.targetDate).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="label">Status:</span>
                <span className={`status-badge ${state.goal.status.toLowerCase()}`}>
                  {state.goal.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="goal-progress" aria-label="Goal progress">
              <ProgressBar
                value={state.goal.currentAmount}
                max={state.goal.targetAmount}
                variant={getProgressVariant(state.goal.status)}
                label="Progress"
                showPercentage
                ariaLabel={`Goal progress: ${calculateProgress(state.goal.currentAmount, state.goal.targetAmount)}%`}
              />
            </div>

            <div className="progress-update">
              <h2>Update Progress</h2>
              <div className="progress-form">
                <input
                  type="number"
                  min="0"
                  max={state.goal.targetAmount}
                  step="0.01"
                  value={state.goal.currentAmount}
                  onChange={e => handleUpdateProgress(Number(e.target.value))}
                  aria-label="Update current amount"
                />
                <button
                  onClick={() => handleUpdateProgress(state.goal?.currentAmount ?? 0)}
                  disabled={state.isLoading}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GoalDetails;