/**
 * HUMAN TASKS:
 * 1. Verify form validation messages are properly translated
 * 2. Test form submission with large datasets
 * 3. Validate accessibility of form controls with screen readers
 * 4. Review error message styling and placement
 */

// Third-party imports
// @version: react ^18.2.0
import React, { useState, useCallback } from 'react';
// @version: react-hook-form ^7.0.0
import { useForm, useFieldArray } from 'react-hook-form';
// @version: react-router-dom ^6.0.0
import { useNavigate } from 'react-router-dom';

// Internal imports
import { Budget, BudgetPeriod } from '../../types/models.types';
import Button from '../../components/common/Button';
import useBudgets from '../../hooks/useBudgets';
import Dashboard from '../dashboard/Dashboard';
import DashboardLayout from '@/layouts/DashboardLayout';

// Interface for form data with validation
interface BudgetFormData {
  name: string;
  period: BudgetPeriod;
  amount: number;
  categories: Array<{
    name: string;
    amount: number;
  }>;
}

/**
 * Budget creation page component implementing the design system specifications
 * Addresses requirements:
 * - Budget Creation (Technical Specification/1.2 Scope/Core Features)
 * - User Interface Design (Technical Specification/8.1.4 Budget Creation/Edit)
 */
const CreateBudget: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { createBudget, isLoading, error } = useBudgets();

  // Initialize form with validation rules
  const {
    register,
    control,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm<BudgetFormData>({
    defaultValues: {
      name: '',
      period: 'MONTHLY' as BudgetPeriod,
      amount: 0,
      categories: [{ name: '', amount: 0 }]
    },
    mode: 'onChange'
  });

  // Setup field array for dynamic category management
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories'
  });

  // Watch total amount for validation
  const watchAmount = watch('amount');
  const watchCategories = watch('categories');

  /**
   * Handles adding a new budget category
   * Implements category management functionality
   */
  const handleAddCategory = useCallback(() => {
    append({ name: '', amount: 0 });
  }, [append]);

  /**
   * Handles removing a budget category
   * Implements category management functionality
   */
  const handleRemoveCategory = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  /**
   * Validates that category amounts don't exceed total budget
   */
  const validateCategoryAmounts = useCallback(() => {
    const totalCategoryAmount = watchCategories.reduce(
      (sum, category) => sum + (Number(category.amount) || 0),
      0
    );
    return totalCategoryAmount <= watchAmount;
  }, [watchAmount, watchCategories]);

  /**
   * Handles form submission with validation
   * Implements budget creation with proper error handling
   */
  const onSubmit = async (formData: BudgetFormData) => {
    try {
      setSubmitting(true);

      // Validate category amounts
      if (!validateCategoryAmounts()) {
        setError('amount', { message: 'Category amounts exceed total budget' });
        setSubmitting(false);
        return;
      }

      // Create budget
      await createBudget({
        name: formData.name,
        period: formData.period,
        amount: Number(formData.amount),
        categories: formData.categories.map(category => ({
          name: category.name,
          amount: Number(category.amount)
        }))
      });

      // Navigate to budgets list on success
      navigate('/budgets');
    } catch (err) {
      console.error('Failed to create budget:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Budget</h1>

        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
          {/* Budget Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block font-medium">
              Budget Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full px-4 py-2 border rounded-md"
              {...register('name', {
                required: 'Budget name is required',
                minLength: {
                  value: 3,
                  message: 'Budget name must be at least 3 characters'
                }
              })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* Budget Period */}
          <div className="space-y-2">
            <label htmlFor="period" className="block font-medium">
              Budget Period
            </label>
            <select
              id="period"
              className="w-full px-4 py-2 border rounded-md"
              {...register('period', { required: 'Budget period is required' })}
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            {errors.period && (
              <p className="text-red-500 text-sm">{errors.period.message}</p>
            )}
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <label htmlFor="amount" className="block font-medium">
              Total Amount
            </label>
            <input
              id="amount"
              type="number"
              min={0}
              step={1}
              className="w-full px-4 py-2 border rounded-md"
              {...register('amount', {
                required: 'Total amount is required',
                min: {
                  value: 0,
                  message: 'Amount must be greater than 0'
                }
              })}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm">{errors.amount.message}</p>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Budget Categories</h2>
              <Button
                variant="secondary"
                onClick={handleAddCategory}
                type="button"
                aria-label="Add category"
              >
                Add Category
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-start">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-md"
                    placeholder="Category name"
                    {...register(`categories.${index}.name`, {
                      required: 'Category name is required'
                    })}
                  />
                  {errors.categories?.[index]?.name && (
                    <p className="text-red-500 text-sm">
                      {errors.categories[index].name?.message}
                    </p>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-full px-4 py-2 border rounded-md"
                    placeholder="Amount"
                    {...register(`categories.${index}.amount`, {
                      required: 'Category amount is required',
                      min: {
                        value: 0,
                        message: 'Amount must be greater than 0'
                      }
                    })}
                  />
                  {errors.categories?.[index]?.amount && (
                    <p className="text-red-500 text-sm">
                      {errors.categories[index].amount?.message}
                    </p>
                  )}
                </div>
                {fields.length > 1 && (
                  <Button
                    variant="danger"
                    onClick={() => handleRemoveCategory(index)}
                    type="button"
                    aria-label={`Remove category ${index + 1}`}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Error Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/budgets')}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting || isLoading}
              isLoading={submitting || isLoading}
            >
              Create Budget
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateBudget;