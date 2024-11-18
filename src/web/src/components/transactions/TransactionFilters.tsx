// @version: react ^18.0.0
import React, { useState, useCallback } from 'react';
import { Transaction, TransactionCategory } from '../../types/models.types';
import Dropdown from '../common/Dropdown';
import { formatDate, getDateRange } from '../../utils/date.utils';

const styles = {};

// Styles are defined in the CSS modules specification
// import styles from './TransactionFilters.module.css';

/**
 * Interface defining available transaction filters
 */
interface TransactionFilters {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  category: TransactionCategory | 'ALL';
  amountRange: {
    min: number | null;
    max: number | null;
  };
  pending: boolean | null;
  searchTerm: string;
}

/**
 * Props interface for TransactionFilters component
 */
interface TransactionFiltersProps {
  onFilterChange: (filters: TransactionFilters) => void;
  initialFilters: TransactionFilters;
  className?: string;
  ariaLabel?: string;
}

/**
 * A React component that provides filtering controls for transaction lists
 * Implements requirements from:
 * - Transaction tracking and categorization (Technical Specification/1.2 Scope/Core Features)
 * - Transaction List Layout (Technical Specification/8.1.2 Screen Layouts)
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 */
const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  onFilterChange,
  initialFilters,
  className = '',
  ariaLabel = 'Transaction filters'
}) => {
  // State for managing filter values
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);

  // Debounced filter change handler
  const handleFilterChange = useCallback((changes: Partial<TransactionFilters>) => {
    const newFilters = { ...filters, ...changes };

    // Validate amount range values
    if (newFilters.amountRange.min !== null && newFilters.amountRange.max !== null) {
      if (newFilters.amountRange.min > newFilters.amountRange.max) {
        [newFilters.amountRange.min, newFilters.amountRange.max] = 
        [newFilters.amountRange.max, newFilters.amountRange.min];
      }
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  // Category options for dropdown
  const categoryOptions = [
    { value: 'ALL', label: 'All Categories' },
    { value: 'INCOME', label: 'Income' },
    { value: 'SHOPPING', label: 'Shopping' },
    { value: 'GROCERIES', label: 'Groceries' },
    { value: 'TRANSPORT', label: 'Transport' },
    { value: 'UTILITIES', label: 'Utilities' },
    { value: 'ENTERTAINMENT', label: 'Entertainment' },
    { value: 'HEALTHCARE', label: 'Healthcare' },
    { value: 'OTHER', label: 'Other' }
  ];

  // Date range options
  const dateRangeOptions = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 90 Days' },
    { value: 'year', label: 'Last Year' }
  ];

  return (
    <div 
      className={`${styles['filters-container']} ${className}`}
      role="region"
      aria-label={ariaLabel}
    >
      {/* Search Input */}
      <div className={styles['filter-row']}>
        <div className={styles['filter-group']}>
          <label htmlFor="search" className="sr-only">Search transactions</label>
          <input
            id="search"
            type="text"
            className={styles['search-input']}
            placeholder="Search transactions..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
            aria-label="Search transactions"
          />
        </div>
      </div>

      <div className={styles['filter-row']}>
        {/* Date Range Filter */}
        <div className={styles['filter-group']}>
          <label id="date-range-label">Date Range</label>
          <Dropdown
            options={dateRangeOptions}
            value={dateRangeOptions[0].value}
            onChange={(value) => {
              const range = getDateRange(value as 'week' | 'month' | 'quarter' | 'year');
              handleFilterChange({ dateRange: range });
            }}
            ariaLabel="date-range-label"
          />
        </div>

        {/* Category Filter */}
        <div className={styles['filter-group']}>
          <label id="category-label">Category</label>
          <Dropdown
            options={categoryOptions}
            value={filters.category}
            onChange={(value) => handleFilterChange({ 
              category: value as TransactionCategory | 'ALL' 
            })}
            ariaLabel="category-label"
          />
        </div>

        {/* Amount Range Filter */}
        <div className={styles['filter-group']}>
          <label>Amount Range</label>
          <div className={styles['amount-inputs']}>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Min"
              value={filters.amountRange.min ?? ''}
              onChange={(e) => handleFilterChange({
                amountRange: {
                  ...filters.amountRange,
                  min: e.target.value ? parseFloat(e.target.value) : null
                }
              })}
              aria-label="Minimum amount"
            />
            <span aria-hidden="true">to</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Max"
              value={filters.amountRange.max ?? ''}
              onChange={(e) => handleFilterChange({
                amountRange: {
                  ...filters.amountRange,
                  max: e.target.value ? parseFloat(e.target.value) : null
                }
              })}
              aria-label="Maximum amount"
            />
          </div>
        </div>

        {/* Pending Status Filter */}
        <div className={styles['filter-group']}>
          <label>
            <input
              type="checkbox"
              checked={filters.pending === true}
              onChange={(e) => handleFilterChange({
                pending: e.target.checked ? true : null
              })}
              aria-label="Show pending transactions only"
            />
            <span className="ml-2">Pending Only</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;