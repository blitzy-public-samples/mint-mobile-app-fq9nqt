// @version: react ^18.0.0
import React, { useState, useCallback, useEffect } from 'react';
// @version: classnames ^2.3.2
import classNames from 'classnames';
import { Transaction } from '../../types/models.types';
import Table, { TableColumn } from '../common/Table';
import { useTransactions } from '../../hooks/useTransactions';

// Human tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards (4.5:1 for normal text)
// 2. Test touch target sizes on mobile devices (minimum 44x44 points)
// 3. Validate table markup with screen readers for proper navigation
// 4. Ensure sort indicators are visible in high contrast mode
// 5. Test with various screen readers to verify transaction amount announcements

export interface TransactionListProps {
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  pageSize?: number;
  className?: string;
  onTransactionClick?: (transaction: Transaction) => void;
  ariaLabel?: string;
}

const TransactionList: React.FC<TransactionListProps> = ({
  accountId,
  startDate,
  endDate,
  categoryId,
  pageSize = 10,
  className,
  onTransactionClick,
  ariaLabel = 'Transaction list',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const {
    transactions,
    loading,
    error,
    totalCount,
    fetchTransactions
  } = useTransactions({
    accountId,
    startDate,
    endDate,
    categoryId
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [accountId, startDate, endDate, categoryId]);

  const handleSort = useCallback((key: string) => {
    setSortKey(key);
    setSortDirection(prev => {
      const newDirection = key === sortKey ? (prev === 'asc' ? 'desc' : 'asc') : 'asc';
      // Announce sort change to screen readers
      // const announcement = `Table sorted by ${key} ${newDirection === 'asc' ? 'ascending' : 'descending'}`;
      // const ariaLive = document.createElement('div');
      // ariaLive.setAttribute('aria-live', 'polite');
      // ariaLive.textContent = announcement;
      // document.body.appendChild(ariaLive);
      // setTimeout(() => document.body.removeChild(ariaLive), 1000);
      return newDirection;
    });
  }, [sortKey]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    fetchTransactions(page, pageSize);
  }, [pageSize, fetchTransactions]);

  const getTableColumns = useCallback((): TableColumn[] => [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      width: '20%',
      align: 'left',
      render: (transaction: Transaction) => (
        <span className="date-cell">
          {new Date(transaction.date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      width: '40%',
      align: 'left',
      render: (transaction: Transaction) => (
        <div className="description-cell" title={transaction.description}>
          {transaction.description}
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      width: '20%',
      render: (transaction: Transaction) => (
        <span 
          className={classNames('amount-cell', {
            'amount-negative': transaction.amount < 0
          })}
          aria-label={`${transaction.amount < 0 ? 'Debit' : 'Credit'} ${Math.abs(transaction.amount).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
          })}`}
        >
          {Math.abs(transaction.amount).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
          })}
        </span>
      )
    },
    {
      key: 'categoryId',
      header: 'Category',
      sortable: true,
      width: '20%',
      align: 'left',
      render: (transaction: Transaction) => (
        <div className="category-cell">
          <span 
            className="category-indicator"
            style={{ backgroundColor: `var(--category-${transaction.categoryId}-color)` }}
            aria-hidden="true"
          />
          <span>{transaction.categoryId}</span>
        </div>
      )
    }
  ], []);

  if (error) {
    return (
      <div 
        className="error-message" 
        role="alert"
        aria-live="polite"
      >
        Failed to load transactions: {error}
      </div>
    );
  }

  return (
    <div className={classNames('transaction-list', className)}>
      <Table
        data={transactions}
        columns={getTableColumns()}
        loading={loading}
        hoverable={true}
        striped={true}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        onRowClick={onTransactionClick}
        ariaLabel={ariaLabel}
        summary="List of financial transactions with date, description, amount, and category"
      />

      <style>
        {`
          .transaction-list {
            width: 100%;
            border-radius: 8px;
            background: var(--color-background);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .date-cell {
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
          }

          .description-cell {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
          }

          .amount-cell {
            font-family: var(--font-mono);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
            color: var(--color-success);
          }

          .amount-cell.amount-negative {
            color: var(--color-error);
          }

          .category-cell {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .category-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
          }

          .error-message {
            padding: 1rem;
            border-radius: 4px;
            background-color: var(--color-error-light);
            color: var(--color-error);
            margin: 1rem 0;
          }

          @media (max-width: 768px) {
            .transaction-list {
              border-radius: 0;
              box-shadow: none;
            }

            .description-cell {
              max-width: 200px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .transaction-list * {
              transition: none !important;
            }
          }

          @media (forced-colors: active) {
            .category-indicator {
              border: 1px solid currentColor;
            }
          }
        `}
      </style>
    </div>
  );
};

export default TransactionList;