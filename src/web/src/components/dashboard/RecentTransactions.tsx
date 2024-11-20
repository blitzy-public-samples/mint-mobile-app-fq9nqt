/**
 * A dashboard component that displays recent financial transactions with sorting,
 * filtering, and accessibility features.
 * 
 * Requirements addressed:
 * - Transaction tracking and categorization (Technical Specification/1.2 Scope/Core Features)
 * - Dashboard UI Components (Technical Specification/8.1.1 Design System Key)
 * - Mobile Responsive Design (Technical Specification/8.1.7 Mobile Responsive Considerations)
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 */

// @version: react ^18.0.0
import React, { useMemo, useCallback } from 'react';
// @version: date-fns ^2.30.0
import { formatDistanceToNow } from 'date-fns';

import { Transaction } from '../../types/models.types';
import Table, { TableColumn } from '../common/Table';
import { useTransactions } from '../../hooks/useTransactions';

// Human tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards
// 2. Test with screen readers for proper table navigation
// 3. Validate touch target sizes on mobile devices
// 4. Configure transaction limit based on performance metrics

interface RecentTransactionsProps {
  limit?: number;
  className?: string;
  onTransactionClick?: (transactionId: string) => void;
}

const formatAmount = (amount: number): React.ReactNode => {
  const isPositive = amount >= 0;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));

  return (
    <span
      className={`amount ${isPositive ? 'positive' : 'negative'}`}
      aria-label={`${isPositive ? 'Credit' : 'Debit'} ${formattedAmount}`}
    >
      {isPositive ? '+' : '-'}{formattedAmount}
      <style jsx>{`
        .amount {
          font-family: var(--font-mono);
          font-weight: 600;
        }
        .positive {
          color: var(--color-success);
        }
        .negative {
          color: var(--color-error);
        }
      `}</style>
    </span>
  );
};

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  limit = 5,
  className,
  onTransactionClick,
}) => {
  const {
    transactions,
    loading,
    error,
    fetchTransactions
  } = useTransactions();

  // Memoized table columns configuration
  const columns = useMemo<TableColumn[]>(() => [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      width: '20%',
      render: (transaction: Transaction) => (
        <span aria-label={transaction.date.toLocaleDateString()}>
          {formatDistanceToNow(transaction.date, { addSuffix: true })}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      width: '40%',
      render: (transaction: Transaction) => (
        <div className="description-cell">
          <span className="description">{transaction.description}</span>
          {transaction.categoryId && (
            <span
              className="category-tag"
              aria-label={`Category: ${transaction.categoryId}`}
            >
              {transaction.categoryId}
            </span>
          )}
          <style jsx>{`
            .description-cell {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
            }
            .description {
              font-weight: 500;
            }
            .category-tag {
              font-size: 0.75rem;
              padding: 0.125rem 0.5rem;
              background-color: var(--color-background-alternate);
              border-radius: 1rem;
              max-width: fit-content;
            }
          `}</style>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      width: '20%',
      align: 'right',
      render: (transaction: Transaction) => formatAmount(transaction.amount),
    },
  ], []);

  // Handle row click with keyboard support
  const handleRowClick = useCallback((transaction: Transaction) => {
    onTransactionClick?.(transaction.id);
  }, [onTransactionClick]);

  if (error) {
    return (
      <div
        className="error-container"
        role="alert"
        aria-live="polite"
      >
        <p>Failed to load transactions: {error}</p>
        <button
          onClick={() => fetchTransactions()}
          className="retry-button"
        >
          Retry
        </button>
        <style jsx>{`
          .error-container {
            padding: 1rem;
            border: 1px solid var(--color-error);
            border-radius: 0.5rem;
            background-color: var(--color-error-light);
            color: var(--color-error);
            text-align: center;
          }
          .retry-button {
            margin-top: 0.5rem;
            padding: 0.5rem 1rem;
            min-height: 44px;
            min-width: 44px;
            background-color: var(--color-error);
            color: white;
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
          }
          .retry-button:hover {
            background-color: var(--color-error-700);
          }
          .retry-button:focus {
            outline: 2px solid var(--color-error);
            outline-offset: 2px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className={`recent-transactions ${className || ''}`}
      aria-busy={loading}
    >
      <h2 className="budget-overview__title">Recent Transactions</h2>

      <Table
        data={transactions.slice(0, limit)}
        columns={columns}
        loading={loading}
        hoverable
        striped
        onRowClick={handleRowClick}
        ariaLabel="Recent Transactions"
        summary="List of recent financial transactions showing date, description, and amount"
      />
      <style jsx>{`
        .recent-transactions {
          background-color: var(--color-background);
          border-radius: 0.5rem;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .recent-transactions {
            border-radius: 0;
            box-shadow: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .recent-transactions * {
            transition: none !important;
          }
        }

        @media (forced-colors: active) {
          .recent-transactions {
            border: 1px solid CanvasText;
          }
        }
      `}</style>
    </div>
  );
};

export default RecentTransactions;