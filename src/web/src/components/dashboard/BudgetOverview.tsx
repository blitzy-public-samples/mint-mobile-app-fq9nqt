/**
 * HUMAN TASKS:
 * 1. Verify color contrast ratios for progress bar variants meet WCAG 2.1 AA standards
 * 2. Test with screen readers to ensure budget information is properly announced
 * 3. Validate component behavior with different viewport sizes and budget data states
 * 4. Review and adjust error message content with UX team
 */

// React v18.2.0
import React from 'react';
import { ProgressBar } from '../common/ProgressBar';
import { Budget } from '../../types/models.types';
import useBudgets from '../../hooks/useBudgets';

interface BudgetOverviewProps {
  className?: string;
  showCategories?: boolean;
  maxItems?: number;
}

/**
 * Calculates the progress percentage for a budget with validation
 * @param spent Current amount spent
 * @param amount Total budget amount
 * @returns Progress percentage between 0 and 100
 */
const calculateBudgetProgress = (spent: number, amount: number): number => {
  // Validate input values are non-negative
  if (spent < 0 || amount <= 0) {
    return 0;
  }

  // Calculate percentage and round to 2 decimal places
  const percentage = (spent / amount) * 100;
  return Math.min(Math.round(percentage * 100) / 100, 100);
};

/**
 * Determines the progress bar variant based on spending percentage
 * @param percentage Current spending percentage
 * @returns Progress bar variant type
 */
const getProgressVariant = (percentage: number): 'default' | 'warning' | 'danger' => {
  if (percentage >= 100) {
    return 'danger';
  }
  if (percentage >= 80) {
    return 'warning';
  }
  return 'default';
};

/**
 * A dashboard component that displays an overview of user budgets with progress bars
 * and spending analysis, supporting real-time updates and accessibility features.
 * 
 * Requirements addressed:
 * - Budget Creation and Monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Budget Status Display (Technical Specification/8.1.2 Main Dashboard)
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 */
const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  className = '',
  showCategories = true,
  maxItems = 5
}) => {
  const {
    budgets,
    isLoading,
    error,
    spendingAnalysis
  } = useBudgets();

  // Early return for loading state
  if (isLoading) {
    return (
      <div 
        className={`budget-overview ${className}`}
        aria-busy="true"
        aria-label="Loading budget information"
      >
        <div className="budget-overview__loading">
          Loading budgets...
        </div>
      </div>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <div 
        className={`budget-overview ${className}`}
        role="alert"
        aria-live="polite"
      >
        <div className="budget-overview__error">
          Unable to load budget information. Please try again later.
        </div>
      </div>
    );
  }

  // Early return for no budgets
  if (!budgets.length) {
    return (
      <div 
        className={`budget-overview ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="budget-overview__empty">
          No active budgets found. Create a budget to start tracking your spending.
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`budget-overview ${className}`}
      role="region"
      aria-label="Budget Overview"
    >
      {/* Overall spending summary */}
      <div className="budget-overview__summary">
        <h2 className="budget-overview__title">Budget Overview</h2>
        <div className="budget-overview__total">
          <span>Total Spent: ${spendingAnalysis.spent.toLocaleString()}</span>
          <span>Remaining: ${spendingAnalysis.remaining.toLocaleString()}</span>
        </div>
      </div>

      {/* Budget progress bars */}
      <div className="budget-overview__budgets">
        {budgets.slice(0, maxItems).map((budget: Budget) => {
          const progress = calculateBudgetProgress(budget.spent, budget.amount);
          const variant = getProgressVariant(progress);

          return (
            <div 
              key={budget.id}
              className="budget-overview__item"
            >
              <ProgressBar
                value={budget.spent}
                max={budget.amount}
                variant={variant}
                label={budget.name}
                showPercentage
                ariaLabel={`${budget.name} budget progress: ${progress}% spent`}
                className="budget-overview__progress"
              />

              {/* Category breakdown */}
              {showCategories && budget.categories && (
                <div className="budget-overview__categories">
                  {budget.categories.map(category => {
                    const categoryProgress = calculateBudgetProgress(
                      category.spent,
                      category.amount
                    );
                    const categoryVariant = getProgressVariant(categoryProgress);

                    return (
                      <ProgressBar
                        key={category.id}
                        value={category.spent}
                        max={category.amount}
                        variant={categoryVariant}
                        label={category.name}
                        showPercentage
                        ariaLabel={`${category.name} category progress: ${categoryProgress}% spent`}
                        className="budget-overview__category-progress"
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more budgets indicator */}
      {budgets.length > maxItems && (
        <div 
          className="budget-overview__more"
          aria-label={`${budgets.length - maxItems} more budgets available`}
        >
          +{budgets.length - maxItems} more budgets
        </div>
      )}

      <style jsx>{`
        .budget-overview {
          padding: 1.5rem;
          background: var(--color-background);
          border-radius: 0.5rem;
          box-shadow: var(--shadow-sm);
        }

        .budget-overview__title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--color-text-primary);
        }

        .budget-overview__summary {
          margin-bottom: 2rem;
        }

        .budget-overview__total {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .budget-overview__item {
          margin-bottom: 1.5rem;
        }

        .budget-overview__categories {
          margin-top: 1rem;
          padding-left: 1rem;
        }

        .budget-overview__category-progress {
          margin-bottom: 0.75rem;
        }

        .budget-overview__more {
          text-align: center;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-top: 1rem;
        }

        .budget-overview__loading,
        .budget-overview__error,
        .budget-overview__empty {
          text-align: center;
          padding: 2rem;
          color: var(--color-text-secondary);
        }

        .budget-overview__error {
          color: var(--color-error);
        }

        @media (max-width: 768px) {
          .budget-overview {
            padding: 1rem;
          }

          .budget-overview__total {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BudgetOverview;