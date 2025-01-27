// @version: react ^18.0.0
import React, { useCallback, useMemo } from 'react';
// @version: react-router-dom ^6.0.0
import { useNavigate } from 'react-router-dom';

// Internal imports
import Table, { TableColumn } from '../../components/common/Table';
import Button from '../../components/common/Button';
import useBudgets from '../../hooks/useBudgets';
import { formatCurrency } from '../../utils/currency.utils';
import type { Budget } from '../../types/models.types';
import DashboardLayout from '@/layouts/DashboardLayout';

// Human tasks:
// 1. Verify WCAG 2.1 compliance for budget table interactions
// 2. Test keyboard navigation flow through budget management interface
// 3. Validate screen reader announcements for budget operations
// 4. Review touch target sizes for mobile budget management
// 5. Test color contrast ratios in budget visualization elements

/**
 * Main budget management page component with comprehensive CRUD operations
 * Implements requirements:
 * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Budget Management UI (Technical Specification/8.1.4 Budget Creation/Edit)
 */
const Budgets: React.FC = () => {
  const navigate = useNavigate();
  const {
    budgets,
    isLoading,
    error,
    deleteBudget,
    spendingAnalysis,
    loadMore
  } = useBudgets();

  /**
   * Handles navigation to budget creation page
   * Implements requirement: Budget Management UI - Creation Flow
   */
  const handleCreateBudget = useCallback(() => {
    navigate('/budgets/create');
  }, [navigate]);

  /**
   * Handles navigation to budget edit page
   * Implements requirement: Budget Management UI - Edit Flow
   */
  const handleEditBudget = useCallback((budgetId: string) => {
    navigate(`/budgets/${budgetId}`);
  }, [navigate]);

  /**
   * Handles budget deletion with confirmation
   * Implements requirement: Budget Management UI - Deletion Flow
   */
  const handleDeleteBudget = useCallback(async (budgetId: string) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      await deleteBudget(budgetId);
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  }, [deleteBudget]);

  /**
   * Configures table columns with proper accessibility and responsive design
   * Implements requirement: Budget Management UI - Data Display
   */
  const columns: TableColumn[] = useMemo(() => [
    {
      key: 'name',
      header: 'Budget Name',
      sortable: true,
      render: (budget: Budget) => (
        <button
          onClick={() => handleEditBudget(budget.id)}
          className="text-left font-medium text-primary-600 hover:text-primary-800 focus:outline-none focus:underline"
          aria-label={`Edit budget: ${budget.name}`}
        >
          {budget.name}
        </button>
      )
    },
    {
      key: 'amount',
      header: 'Total Amount',
      sortable: true,
      render: (budget: Budget) => formatCurrency(budget.amount)
    },
    {
      key: 'spent',
      header: 'Spent',
      sortable: true,
      render: (budget: Budget) => formatCurrency(budget.spent || 0)
    },
    {
      key: 'remaining',
      header: 'Remaining',
      sortable: true,
      render: (budget: Budget) => formatCurrency(budget.amount - (budget.spent || 0))
    },
    {
      key: 'startDate',
      header: 'Start Date',
      sortable: true,
      render: (budget: Budget) => new Date(budget.startDate).toLocaleDateString()
    },
    {
      key: 'endDate',
      header: 'End Date',
      sortable: true,
      render: (budget: Budget) => new Date(budget.endDate).toLocaleDateString()
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'left',
      render: (budget: Budget) => (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={() => handleEditBudget(budget.id)}
            ariaLabel={`Edit budget: ${budget.name}`}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="small"
            onClick={() => handleDeleteBudget(budget.id)}
            ariaLabel={`Delete budget: ${budget.name}`}
          >
            Delete
          </Button>
        </div>
      )
    }
  ], [handleEditBudget, handleDeleteBudget]);

  const budgetsToDisplay = useMemo(() => {
    return budgets.map(budget => ({
      ...budget,
      remaining: budget.amount - (budget.spent || 0),
    }));
  }, [budgets]);

  return (
    <DashboardLayout>
      <div className='mx-auto max-w-6xl space-y-6'>
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Budget Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage your budgets to track spending
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleCreateBudget}
            ariaLabel="Create new budget"
          >
            Create Budget
          </Button>
        </div>

        {/* Spending Analysis Summary */}
        {spendingAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {formatCurrency(spendingAnalysis.spent + spendingAnalysis.remaining)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Spent</p>
              <p className="mt-1 text-xl font-semibold text-green-600">
                {formatCurrency(spendingAnalysis.spent)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Remaining</p>
              <p className="mt-1 text-xl font-semibold text-blue-600">
                {formatCurrency(spendingAnalysis.remaining)}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-200 rounded-md"
          >
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Budgets Table */}
        <Table
          data={budgetsToDisplay}
          columns={columns}
          loading={isLoading}
          defaultSortKey='startDate'
          defaultSortDirection='desc'
          ariaLabel="Budgets table"
          summary="List of all budgets with their amounts and status"
          hoverable
          striped
        />

        {/* Load More Button */}
        {budgets.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="secondary"
              onClick={loadMore}
              disabled={isLoading}
              ariaLabel="Load more budgets"
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}

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
      </div>
    </DashboardLayout>
  );
};

export default Budgets;