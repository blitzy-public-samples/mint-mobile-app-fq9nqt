/**
 * Main dashboard page component that provides a comprehensive financial overview
 * with accounts, budgets, goals, and recent transactions.
 * 
 * Requirements addressed:
 * - Dashboard Overview (Technical Specification/8.1.2 Main Dashboard)
 *   Comprehensive financial overview with accounts, budgets, and transactions
 * - Mobile-First Design (Technical Specification/1.1 System Overview)
 *   Responsive dashboard layout optimized for mobile devices
 */

// @version: react ^18.0.0
import React, { useEffect, useState } from 'react';
// @version: react-router-dom ^6.0.0
import { useNavigate } from 'react-router-dom';

// Internal components
import { AccountsSummary } from '../../components/dashboard/AccountsSummary';
import { BudgetOverview } from '../../components/dashboard/BudgetOverview';
import { RecentTransactions } from '../../components/dashboard/RecentTransactions';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';

// Human tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards
// 2. Test screen reader compatibility and navigation flow
// 3. Validate touch target sizes on mobile devices
// 4. Review loading states and error messages with UX team

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [isAuthenticated, navigate]);

  // Handle account click navigation
  const handleAccountClick = (accountId: string) => {
    if (!accountId) return;
    navigate(`/accounts/${accountId}`);
  };

  // Handle transaction click navigation
  const handleTransactionClick = (transactionId: string) => {
    if (!transactionId) return;
    navigate(`/transactions/${transactionId}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div 
          className="dashboard-loading"
          role="status"
          aria-busy="true"
          aria-label="Loading dashboard content"
        >
          Loading your financial overview...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div 
          className="dashboard-error"
          role="alert"
          aria-live="polite"
        >
          {error}
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div 
        className="dashboard-container"
        role="main"
        aria-label="Dashboard content"
      >
        {/* Welcome message with user's name */}
        <header className="dashboard-header">
          <h1>Welcome, {user?.firstName || 'User'}</h1>
          <p className="last-updated">
            Last updated: {new Date().toLocaleString()}
          </p>
        </header>

        {/* Main dashboard grid layout */}
        <div className="dashboard-grid">
          {/* Accounts summary section */}
          <section 
            className="dashboard-section"
            aria-label="Accounts section"
          >
            <AccountsSummary
              onAccountClick={handleAccountClick}
            />
          </section>

          {/* Budget overview section */}
          <section 
            className="dashboard-section"
            aria-label="Budget overview section"
          >
            <BudgetOverview
              showCategories={true}
              maxItems={5}
            />
          </section>

          {/* Recent transactions section */}
          <section 
            className="dashboard-section"
            aria-label="Recent transactions section"
          >
            <RecentTransactions
              limit={5}
              onTransactionClick={handleTransactionClick}
            />
          </section>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: var(--spacing-4);
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
        }

        .dashboard-header {
          margin-bottom: var(--spacing-6);
        }

        .dashboard-header h1 {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-2);
        }

        .last-updated {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .dashboard-grid {
          display: grid;
          gap: var(--spacing-6);
          grid-template-columns: 1fr;
        }

        .dashboard-section {
          background: var(--color-background-card);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .dashboard-loading,
        .dashboard-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          text-align: center;
          padding: var(--spacing-6);
        }

        .dashboard-error {
          color: var(--color-error);
        }

        .retry-button {
          margin-top: var(--spacing-4);
          padding: var(--spacing-2) var(--spacing-4);
          min-height: 44px;
          min-width: 44px;
          background-color: var(--color-primary);
          color: var(--color-text-inverse);
          border: none;
          border-radius: var(--border-radius-md);
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .retry-button:hover {
          background-color: var(--color-primary-dark);
        }

        .retry-button:focus {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        /* Tablet breakpoint */
        @media (min-width: 768px) {
          .dashboard-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .dashboard-section:last-child {
            grid-column: 1 / -1;
          }
        }

        /* Desktop breakpoint */
        @media (min-width: 1024px) {
          .dashboard-container {
            padding: var(--spacing-6);
          }

          .dashboard-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .dashboard-section:last-child {
            grid-column: 2 / -1;
          }
        }

        /* High contrast mode */
        @media (forced-colors: active) {
          .dashboard-section {
            border: 1px solid CanvasText;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .retry-button {
            transition: none;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default Dashboard;