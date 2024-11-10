// @version react ^18.2.0

import React from 'react';
import { Goal, GoalStatus } from '../../types/models.types';
import { useGoals } from '../../hooks/useGoals';
import ProgressBar from '../common/ProgressBar';

/**
 * Human Tasks:
 * 1. Verify color contrast ratios for progress bar variants meet WCAG 2.1 AA standards
 * 2. Test with screen readers to ensure progress information is properly announced
 * 3. Validate component behavior with different viewport sizes
 */

interface GoalsProgressProps {
  limit?: number;
  className?: string;
}

/**
 * Determines the progress bar variant based on goal progress percentage
 * @param currentAmount Current amount saved towards goal
 * @param targetAmount Target amount for goal completion
 * @returns Progress bar variant (success, warning, or default)
 */
const calculateProgressVariant = (currentAmount: number, targetAmount: number): 'success' | 'warning' | 'default' => {
  const progress = (currentAmount / targetAmount) * 100;
  
  if (progress >= 100) {
    return 'success';
  }
  if (progress < 50) {
    return 'warning';
  }
  return 'default';
};

/**
 * A dashboard component that displays the user's financial goals and their progress
 * towards completion, supporting real-time updates and accessibility features.
 * 
 * Requirements addressed:
 * - Financial goal setting and progress monitoring (Technical Specification/1.2 Scope/Core Features)
 * - Goals progress visualization in the main dashboard with responsive design (Technical Specification/8.1.2 Main Dashboard)
 */
const GoalsProgress: React.FC<GoalsProgressProps> = ({ 
  limit = 5,
  className = ''
}) => {
  const { goals, isLoading, error } = useGoals();

  if (isLoading) {
    return (
      <div className={`goals-progress-loading ${className}`} role="status">
        <span className="sr-only">Loading goals progress...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`goals-progress-error ${className}`} role="alert">
        <p>Failed to load goals progress. Please try again later.</p>
      </div>
    );
  }

  if (!goals?.length) {
    return (
      <div className={`goals-progress-empty ${className}`}>
        <p>No financial goals set. Start by creating your first goal!</p>
      </div>
    );
  }

  // Sort goals by progress percentage in descending order
  const sortedGoals = [...goals]
    .sort((a, b) => {
      const progressA = (a.currentAmount / a.targetAmount) * 100;
      const progressB = (b.currentAmount / b.targetAmount) * 100;
      return progressB - progressA;
    })
    .slice(0, limit);

  const getStatusLabel = (status: GoalStatus): string => {
    switch (status) {
      case 'COMPLETED':
        return 'Goal achieved!';
      case 'ON_TRACK':
        return 'On track';
      case 'AT_RISK':
        return 'At risk';
      case 'IN_PROGRESS':
        return 'In progress';
      case 'NOT_STARTED':
        return 'Not started';
      default:
        return '';
    }
  };

  return (
    <div className={`goals-progress ${className}`}>
      <h2 className="goals-progress-title">Financial Goals Progress</h2>
      <div className="goals-progress-list">
        {sortedGoals.map((goal) => {
          const progressVariant = calculateProgressVariant(goal.currentAmount, goal.targetAmount);
          const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
          const formattedCurrent = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(goal.currentAmount);
          const formattedTarget = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(goal.targetAmount);

          return (
            <div 
              key={goal.id} 
              className="goal-item"
              role="region"
              aria-label={`Progress for goal: ${goal.name}`}
            >
              <div className="goal-header">
                <h3 className="goal-name">{goal.name}</h3>
                <span className="goal-status" aria-label={`Status: ${getStatusLabel(goal.status)}`}>
                  {getStatusLabel(goal.status)}
                </span>
              </div>
              <div className="goal-progress">
                <ProgressBar
                  value={goal.currentAmount}
                  max={goal.targetAmount}
                  variant={progressVariant}
                  label={`${formattedCurrent} of ${formattedTarget}`}
                  showPercentage
                  ariaLabel={`Goal progress: ${Math.round(progressPercentage)}% complete`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .goals-progress {
          padding: 1.5rem;
          background: var(--card-bg);
          border-radius: 0.5rem;
          box-shadow: var(--card-shadow);
        }

        .goals-progress-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }

        .goals-progress-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .goal-item {
          padding: 1rem;
          background: var(--card-bg-secondary);
          border-radius: 0.375rem;
          border: 1px solid var(--border-color);
        }

        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .goal-name {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
        }

        .goal-status {
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          background: var(--status-bg);
          color: var(--status-text);
        }

        .goal-progress {
          margin-top: 0.5rem;
        }

        .goals-progress-loading,
        .goals-progress-error,
        .goals-progress-empty {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
          background: var(--card-bg);
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
        }

        @media (max-width: 768px) {
          .goals-progress {
            padding: 1rem;
          }

          .goal-item {
            padding: 0.75rem;
          }

          .goal-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default GoalsProgress;