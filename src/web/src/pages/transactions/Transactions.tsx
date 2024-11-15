// @version: react ^18.0.0
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransactionList, TransactionListProps } from '../../components/transactions/TransactionList';
import { TransactionFilters } from '../../components/transactions/TransactionFilters';
import { useTransactions } from '../../hooks/useTransactions';
import { Transaction } from '../../types/models.types';
import styles from './Transactions.module.css';

// Human tasks:
// 1. Verify WCAG 2.1 AA compliance for all interactive elements
// 2. Test keyboard navigation flow with screen readers
// 3. Validate color contrast ratios for all text elements
// 4. Configure analytics tracking for transaction interactions
// 5. Test responsive layout breakpoints across devices

/**
 * Main transactions page component implementing:
 * - Transaction tracking and categorization (Technical Specification/1.2 Scope/Core Features)
 * - Data export and reporting capabilities (Technical Specification/1.2 Scope/Core Features)
 * - Mobile-first design (Technical Specification/1.1 System Overview)
 */
const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Initialize filter state
  const [filters, setFilters] = useState<TransactionPageFilters>({
    startDate: null,
    endDate: null,
    categoryId: null,
    searchTerm: '',
    amountRange: { min: null, max: null }
  });

  // Initialize pagination state
  const [pageSize] = useState(20);

  // Get transactions data and operations
  const {
    transactions,
    loading,
    error,
    totalCount,
    hasMore,
    fetchTransactions
  } = useTransactions({
    startDate: filters.startDate,
    endDate: filters.endDate,
    categoryId: filters.categoryId || undefined,
    query: filters.searchTerm
  });

  // Handle filter changes with debouncing
  const handleFilterChange = useCallback((newFilters: TransactionPageFilters) => {
    setFilters(newFilters);
    
    // Update URL query parameters
    const searchParams = new URLSearchParams();
    if (newFilters.startDate) searchParams.set('startDate', newFilters.startDate.toISOString());
    if (newFilters.endDate) searchParams.set('endDate', newFilters.endDate.toISOString());
    if (newFilters.categoryId) searchParams.set('category', newFilters.categoryId);
    if (newFilters.searchTerm) searchParams.set('search', newFilters.searchTerm);
    if (newFilters.amountRange.min) searchParams.set('minAmount', newFilters.amountRange.min.toString());
    if (newFilters.amountRange.max) searchParams.set('maxAmount', newFilters.amountRange.max.toString());
    
    window.history.replaceState(null, '', `?${searchParams.toString()}`);

    // Announce filter changes to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent = 'Transaction filters updated';
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);

    // Reset to first page and fetch with new filters
    fetchTransactions(1, pageSize);
  }, [pageSize, fetchTransactions]);

  // Handle transaction row click navigation
  const handleTransactionClick = useCallback((transaction: Transaction) => {
    navigate(`/transactions/${transaction.id}`, {
      state: { transaction }
    });
  }, [navigate]);

  // Handle export functionality
  const handleExport = useCallback(async () => {
    try {
      const response = await fetch('/api/transactions/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      // Show error notification
    }
  }, [filters]);

  // Initialize filters from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFilters: TransactionPageFilters = {
      startDate: params.get('startDate') ? new Date(params.get('startDate')!) : null,
      endDate: params.get('endDate') ? new Date(params.get('endDate')!) : null,
      categoryId: params.get('category') || null,
      searchTerm: params.get('search') || '',
      amountRange: {
        min: params.get('minAmount') ? parseFloat(params.get('minAmount')) : null,
        max: params.get('maxAmount') ? parseFloat(params.get('maxAmount')) : null
      }
    };
    setFilters(urlFilters);
    fetchTransactions(1, pageSize);
  }, [pageSize, fetchTransactions]);

  return (
    <main className={styles['transactions-page']} role="main">
      <header className={styles.header}>
        <h1>Transactions</h1>
        <button
          onClick={handleExport}
          className={styles['export-button']}
          aria-label="Export transactions"
        >
          Export
        </button>
      </header>

      <section className={styles.content}>
        <TransactionFilters
          onFilterChange={handleFilterChange}
          initialFilters={filters}
          className={styles.filters}
          ariaLabel="Transaction filters"
        />

        {error ? (
          <div 
            className={styles.error} 
            role="alert"
            aria-live="assertive"
          >
            Failed to load transactions: {error}
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            loading={loading}
            totalCount={totalCount}
            hasMore={hasMore}
            onTransactionClick={handleTransactionClick}
            className={styles['transaction-list']}
            pageSize={pageSize}
            ariaLabel="Transactions list"
          />
        )}
      </section>

      <style jsx>{`
        .transactions-page {
          padding: var(--spacing-4);
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-4);
        }

        .export-button {
          padding: var(--spacing-2) var(--spacing-4);
          background-color: var(--color-primary-400);
          color: var(--color-white);
          border: none;
          border-radius: var(--radius-md);
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .export-button:hover {
          background-color: var(--color-primary-dark);
        }

        .export-button:focus {
          outline: 2px solid var(--color-primary-400);
          outline-offset: 2px;
        }

        .content {
          display: grid;
          gap: var(--spacing-4);
        }

        .filters {
          background: var(--color-background-light);
          padding: var(--spacing-4);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .transaction-list {
          background: var(--color-white);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
        }

        .error {
          padding: var(--spacing-4);
          background-color: var(--color-error-light);
          color: var(--color-error);
          border-radius: var(--radius-md);
          text-align: center;
        }

        @media (max-width: 768px) {
          .transactions-page {
            padding: var(--spacing-2);
          }

          .header {
            flex-direction: column;
            gap: var(--spacing-2);
            align-items: flex-start;
          }

          .content {
            gap: var(--spacing-2);
          }

          .filters {
            padding: var(--spacing-2);
            border-radius: var(--radius-md);
          }

          .transaction-list {
            border-radius: var(--radius-md);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .export-button {
            transition: none;
          }
        }

        @media (forced-colors: active) {
          .export-button {
            border: 1px solid ButtonText;
          }
        }
      `}</style>
    </main>
  );
};

export default TransactionsPage;