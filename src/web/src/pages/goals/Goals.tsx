/**
 * Main goals page component that displays financial goals and their progress
 * with mobile-first responsive design and accessibility features.
 * 
 * Requirements addressed:
 * - Financial goal setting and progress monitoring (Technical Specification/1.2 Scope/Core Features)
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 */

// @version: react ^18.2.0
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Internal imports
import { Goal } from '../../types/models.types';
import { useGoals } from '../../hooks/useGoals';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

// Human tasks:
// 1. Configure analytics tracking for goal interactions
// 2. Set up error monitoring for goal operations
// 3. Review and test screen reader announcements
// 4. Validate touch target sizes on mobile devices

const Goals: React.FC = () => {
  const navigate = useNavigate();
  const {
    goals,
    isLoading,
    error,
    fetchGoals
  } = useGoals();

  // Fetch goals on component mount
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Navigation handlers
  const handleCreateGoal = () => {
    navigate('/goals/create');
  };

  const handleGoalClick = (goalId: string) => {
    navigate(`/goals/${goalId}`);
  };

  // Calculate progress percentage for goal
  const calculateProgress = (current: number, target: number): number => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  // Get status color based on goal status
  const getStatusColor = (status: Goal['status']): string => {
    const colors = {
      NOT_STARTED: 'text-neutral-500',
      IN_PROGRESS: 'text-blue-500',
      ON_TRACK: 'text-green-500',
      AT_RISK: 'text-red-500',
      COMPLETED: 'text-purple-500'
    };
    return colors[status];
  };

  // Format currency amount
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Financial Goals
        </h1>
        <Button
          variant="primary"
          onClick={handleCreateGoal}
          aria-label="Create new financial goal"
        >
          Create Goal
        </Button>
      </header>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700"
        >
          {error}
        </div>
      )}

      {/* Goals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <Card
            key={goal.id}
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => handleGoalClick(goal.id)}
            testId={`goal-card-${goal.id}`}
          >
            <div className="space-y-4">
              {/* Goal header */}
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                  {goal.name}
                </h3>
                <span
                  className={`px-2 py-1 text-sm rounded-full ${getStatusColor(goal.status)}`}
                >
                  {goal.status.replace('_', ' ')}
                </span>
              </div>

              {/* Goal progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>
                    {calculateProgress(goal.currentAmount, goal.targetAmount)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${calculateProgress(
                        goal.currentAmount,
                        goal.targetAmount
                      )}%`
                    }}
                    role="progressbar"
                    aria-valuenow={calculateProgress(
                      goal.currentAmount,
                      goal.targetAmount
                    )}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>

              {/* Goal amounts */}
              <div className="flex justify-between items-baseline">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Current</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(goal.currentAmount)}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm text-gray-500">Target</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(goal.targetAmount)}
                  </p>
                </div>
              </div>

              {/* Goal deadline */}
              <div className="text-sm text-gray-500">
                Target Date:{' '}
                {new Date(goal.targetDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {!isLoading && goals.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            No goals yet
          </h2>
          <p className="text-gray-500 mb-6">
            Create your first financial goal to start tracking your progress
          </p>
          <Button
            variant="primary"
            onClick={handleCreateGoal}
            aria-label="Create your first financial goal"
          >
            Create Your First Goal
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <Card key={index} loading={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Goals;