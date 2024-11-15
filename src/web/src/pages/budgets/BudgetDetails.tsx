/**
 * HUMAN TASKS:
 * 1. Configure error tracking service for budget operations monitoring
 * 2. Set up analytics tracking for budget interactions
 * 3. Review and test accessibility features with screen readers
 * 4. Validate color contrast ratios for budget category indicators
 */

// React v18.2.0
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom'; // v6.0.0

// Internal imports
import { Budget } from '../../types/models.types';
import useBudgets from '../../hooks/useBudgets';
import ProgressBar from '../../components/common/ProgressBar';
import DashboardLayout from '@/layouts/DashboardLayout';

/**
 * Calculates the percentage of budget spent
 * @param spent Amount spent
 * @param amount Total budget amount
 * @returns Percentage value between 0-100
 */
const calculateSpendingPercentage = (spent: number, amount: number): number => {
  if (spent < 0 || amount <= 0) return 0;
  const percentage = (spent / amount) * 100;
  return Math.min(Math.round(percentage * 100) / 100, 100);
};

/**
 * Determines the progress bar variant based on spending percentage
 * @param percentage Current spending percentage
 * @returns Progress bar variant type
 */
const getProgressVariant = (percentage: number): 'success' | 'warning' | 'danger' => {
  if (percentage < 80) return 'success';
  if (percentage < 90) return 'warning';
  return 'danger';
};

/**
 * Detailed budget view component that displays comprehensive information about a specific budget
 * Implements requirements:
 * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Budget Management (Technical Specification/6.1.1 Core Application Components)
 * - Budget View UI (Technical Specification/8.1.2 Screen Layouts)
 */
const BudgetDetails: React.FC = () => {
  // Get budget ID from URL parameters
  const { id } = useParams<{ id: string }>();

  // Initialize budget management hook
  const {
    budgets,
    isLoading,
    error,
    updateBudget,
    deleteBudget,
    spendingAnalysis
  } = useBudgets();

  // Local state for current budget and edit mode
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Find and set current budget when budgets or ID changes
  useEffect(() => {
    if (id && budgets.length > 0) {
      const budget = budgets.find(b => b.id === id);
      setCurrentBudget(budget || null);
    }
  }, [id, budgets]);

  // Handle budget update
  const handleUpdateBudget = useCallback(async (updatedData: Partial<Budget>) => {
    if (!currentBudget) return;

    try {
      await updateBudget(currentBudget.id, updatedData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update budget:', error);
    }
  }, [currentBudget, updateBudget]);

  // Handle budget deletion
  const handleDeleteBudget = useCallback(async () => {
    if (!currentBudget) return;

    try {
      await deleteBudget(currentBudget.id);
      // Navigation will be handled by the router
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  }, [currentBudget, deleteBudget]);

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !currentBudget) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-xl font-semibold text-error-500">
            {error || 'Budget not found'}
          </h2>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const overallSpendingPercentage = calculateSpendingPercentage(
    currentBudget.spent,
    currentBudget.amount
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Budget Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentBudget.name}
            </h1>
            <p className="text-gray-600">
              {new Date(currentBudget.startDate).toLocaleDateString()} -
              {new Date(currentBudget.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
              aria-label="Edit budget"
            >
              Edit
            </button>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="px-4 py-2 bg-error-500 text-white rounded hover:bg-error-600"
              aria-label="Delete budget"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>
          <ProgressBar
            value={currentBudget.spent}
            max={currentBudget.amount}
            variant={getProgressVariant(overallSpendingPercentage)}
            label="Total Budget"
            showPercentage
            ariaLabel={`Overall budget progress: ${overallSpendingPercentage}% spent`}
          />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Total Budget</p>
              <p className="text-xl font-semibold">
                ${currentBudget.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Remaining</p>
              <p className="text-xl font-semibold">
                ${(currentBudget.amount - currentBudget.spent).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Category Breakdown</h2>
          <div className="space-y-6">
            {currentBudget.categories.map(category => {
              const categoryPercentage = calculateSpendingPercentage(
                category.spent,
                category.amount
              );
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-gray-600">
                      ${category.spent.toLocaleString()} / ${category.amount.toLocaleString()}
                    </span>
                  </div>
                  <ProgressBar
                    value={category.spent}
                    max={category.amount}
                    variant={getProgressVariant(categoryPercentage)}
                    showPercentage
                    ariaLabel={`${category.name} budget progress: ${categoryPercentage}% spent`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Spending Analysis */}
        {spendingAnalysis && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">Spending Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {spendingAnalysis.categories.map(category => (
                <div key={category.name} className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium mb-2">{category.name}</h3>
                  <p className="text-2xl font-bold">
                    ${category.spent.toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    {category.percentage.toFixed(1)}% of total spending
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditing && currentBudget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
              <h2 className="text-xl font-semibold mb-4">Edit Budget</h2>
              {/* Edit form implementation */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateBudget(currentBudget)}
                  className="px-4 py-2 bg-primary-500 text-white rounded"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Delete Budget</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this budget? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBudget}
                  className="px-4 py-2 bg-error-500 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BudgetDetails;