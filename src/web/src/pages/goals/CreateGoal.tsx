// @version: react ^18.2.0
// @version: react-hook-form ^7.0.0
// @version: react-router-dom ^6.0.0

import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Goal, GoalType, GoalStatus } from '../../types/models.types';
import { useGoals } from '../../hooks/useGoals';
import { Button } from '../../components/common/Button';

/**
 * HUMAN TASKS:
 * 1. Configure error tracking service for form submission errors
 * 2. Set up analytics tracking for goal creation events
 * 3. Review and adjust form validation rules based on business requirements
 * 4. Verify accessibility compliance with screen reader testing
 */

// Interface for form data with validation rules
interface CreateGoalFormData {
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
}

/**
 * CreateGoal component for financial goal creation
 * Implements requirements:
 * - Financial goal setting (Technical Specification/1.2 Scope/Core Features)
 * - User Interface Design (Technical Specification/8.1 User Interface Design/8.1.4 Goal Creation/Edit)
 */
const CreateGoal: React.FC = () => {
  const navigate = useNavigate();
  const { createNewGoal, isLoading, error } = useGoals();

  // Initialize form with validation rules
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm<CreateGoalFormData>({
    defaultValues: {
      currentAmount: 0,
      type: 'SAVINGS'
    }
  });

  // Watch form values for dynamic validation
  const targetAmount = watch('targetAmount');
  const currentAmount = watch('currentAmount');

  /**
   * Handles form submission with validation and error handling
   * Implements Technical Specification/1.2 Scope/Core Features
   */
  const onSubmit = async (data: CreateGoalFormData) => {
    try {
      // Validate amount constraints
      if (data.currentAmount > data.targetAmount) {
        setError('currentAmount', {
          type: 'manual',
          message: 'Current amount cannot exceed target amount'
        });
        return;
      }

      // Format goal data
      const goalData: Omit<Goal, 'id'> = {
        name: data.name.trim(),
        type: data.type,
        targetAmount: Number(data.targetAmount),
        currentAmount: Number(data.currentAmount),
        targetDate: new Date(data.targetDate),
        status: data.currentAmount === 0 ? 'NOT_STARTED' : 'IN_PROGRESS',
        userId: '' // Will be set by the API based on authenticated user
      };

      // Create new goal
      await createNewGoal(goalData);
      
      // Navigate to goals list on success
      navigate('/dashboard/goals');
    } catch (err) {
      setError('root', {
        type: 'manual',
        message: 'Failed to create goal. Please try again.'
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Goal</h1>

      <form 
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        {/* Goal Name Field */}
        <div>
          <label 
            htmlFor="name"
            className="block text-sm font-medium mb-1"
          >
            Goal Name
          </label>
          <input
            id="name"
            type="text"
            className="w-full px-4 py-2 border rounded-md"
            {...register('name', {
              required: 'Goal name is required',
              minLength: {
                value: 3,
                message: 'Goal name must be at least 3 characters'
              },
              maxLength: {
                value: 50,
                message: 'Goal name cannot exceed 50 characters'
              }
            })}
            aria-invalid={errors.name ? 'true' : 'false'}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Goal Type Field */}
        <div>
          <label 
            htmlFor="type"
            className="block text-sm font-medium mb-1"
          >
            Goal Type
          </label>
          <select
            id="type"
            className="w-full px-4 py-2 border rounded-md"
            {...register('type', {
              required: 'Please select a goal type'
            })}
            aria-invalid={errors.type ? 'true' : 'false'}
          >
            <option value="SAVINGS">Savings</option>
            <option value="DEBT_PAYMENT">Debt Payment</option>
            <option value="INVESTMENT">Investment</option>
            <option value="EMERGENCY_FUND">Emergency Fund</option>
            <option value="CUSTOM">Custom</option>
          </select>
          {errors.type && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {errors.type.message}
            </p>
          )}
        </div>

        {/* Target Amount Field */}
        <div>
          <label 
            htmlFor="targetAmount"
            className="block text-sm font-medium mb-1"
          >
            Target Amount
          </label>
          <input
            id="targetAmount"
            type="number"
            className="w-full px-4 py-2 border rounded-md"
            min="0"
            step="0.01"
            {...register('targetAmount', {
              required: 'Target amount is required',
              min: {
                value: 0.01,
                message: 'Target amount must be greater than 0'
              },
              validate: value => 
                value > (currentAmount || 0) || 
                'Target amount must be greater than current amount'
            })}
            aria-invalid={errors.targetAmount ? 'true' : 'false'}
          />
          {errors.targetAmount && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {errors.targetAmount.message}
            </p>
          )}
        </div>

        {/* Current Amount Field */}
        <div>
          <label 
            htmlFor="currentAmount"
            className="block text-sm font-medium mb-1"
          >
            Current Amount
          </label>
          <input
            id="currentAmount"
            type="number"
            className="w-full px-4 py-2 border rounded-md"
            min="0"
            step="0.01"
            {...register('currentAmount', {
              required: 'Current amount is required',
              min: {
                value: 0,
                message: 'Current amount cannot be negative'
              },
              validate: value => 
                value <= (targetAmount || 0) || 
                'Current amount cannot exceed target amount'
            })}
            aria-invalid={errors.currentAmount ? 'true' : 'false'}
          />
          {errors.currentAmount && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {errors.currentAmount.message}
            </p>
          )}
        </div>

        {/* Target Date Field */}
        <div>
          <label 
            htmlFor="targetDate"
            className="block text-sm font-medium mb-1"
          >
            Target Date
          </label>
          <input
            id="targetDate"
            type="date"
            className="w-full px-4 py-2 border rounded-md"
            {...register('targetDate', {
              required: 'Target date is required',
              validate: value => 
                new Date(value) > new Date() || 
                'Target date must be in the future'
            })}
            aria-invalid={errors.targetDate ? 'true' : 'false'}
          />
          {errors.targetDate && (
            <p className="text-red-500 text-sm mt-1" role="alert">
              {errors.targetDate.message}
            </p>
          )}
        </div>

        {/* Form Error Message */}
        {errors.root && (
          <div 
            className="p-4 bg-red-50 border border-red-200 rounded-md"
            role="alert"
          >
            <p className="text-red-500">{errors.root.message}</p>
          </div>
        )}

        {/* API Error Message */}
        {error && (
          <div 
            className="p-4 bg-red-50 border border-red-200 rounded-md"
            role="alert"
          >
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            Create Goal
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/dashboard/goals')}
            disabled={isLoading}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateGoal;