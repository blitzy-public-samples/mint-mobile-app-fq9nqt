/**
 * A reusable table component for displaying structured data with support for sorting,
 * pagination, and custom cell rendering. Implements WCAG 2.1 accessibility standards.
 * 
 * Requirements addressed:
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 *   Implements responsive table component with sorting and pagination
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 *   Ensures WCAG 2.1 compliance with proper ARIA attributes
 * - Mobile Responsive Considerations (Technical Specification/8.1.7 Mobile Responsive Considerations)
 *   Adapts layout for different screen sizes with proper touch targets
 */

// @version: react ^18.0.0
import React, { useMemo } from 'react';
// @version: classnames ^2.3.2
import classNames from 'classnames';
import { formatCurrency } from '../../utils/currency.utils';
import Spinner from './Spinner';

// Human tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards (4.5:1 for normal text)
// 2. Test touch target sizes on mobile devices (minimum 44x44 points)
// 3. Validate table markup with screen readers for proper navigation
// 4. Ensure sort indicators are visible in high contrast mode

export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: any) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps {
  data: any[];
  columns: TableColumn[];
  loading?: boolean;
  hoverable?: boolean;
  striped?: boolean;
  className?: string;
  onRowClick?: (item: any) => void;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  ariaLabel?: string;
  summary?: string;
}

const renderTableHeader = (
  columns: TableColumn[],
  sortKey?: string,
  sortDirection?: 'asc' | 'desc',
  onSort?: (key: string) => void
): React.ReactNode => {
  return (
    <thead>
      <tr>
        {columns.map((column) => {
          const isSorted = sortKey === column.key;
          const headerClasses = classNames('table-header', {
            sortable: column.sortable,
            'sorted-asc': isSorted && sortDirection === 'asc',
            'sorted-desc': isSorted && sortDirection === 'desc',
          });

          return (
            <th
              key={column.key}
              className={headerClasses}
              style={{ width: column.width }}
              aria-sort={
                isSorted
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined
              }
            >
              {column.sortable ? (
                <button
                  className="sort-button"
                  onClick={() => onSort?.(column.key)}
                  aria-label={`Sort by ${column.header} ${
                    isSorted
                      ? sortDirection === 'asc'
                        ? 'descending'
                        : 'ascending'
                      : ''
                  }`.trim()}
                >
                  {column.header}
                  {isSorted && (
                    <span className="sort-indicator" aria-hidden="true">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </button>
              ) : (
                <span>{column.header}</span>
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

const renderTableBody = (
  data: any[],
  columns: TableColumn[],
  onRowClick?: (item: any) => void
): React.ReactNode => {
  return (
    <tbody>
      {data.map((item, rowIndex) => (
        <tr
          key={item.id || rowIndex}
          onClick={() => onRowClick?.(item)}
          className={classNames('table-row', {
            clickable: !!onRowClick,
          })}
          tabIndex={onRowClick ? 0 : undefined}
          role={onRowClick ? 'button' : undefined}
          onKeyPress={(e) => {
            if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onRowClick(item);
            }
          }}
        >
          {columns.map((column) => {
            const cellValue = item[column.key];
            const cellContent = column.render
              ? column.render(item)
              : typeof cellValue === 'number'
              ? formatCurrency(cellValue)
              : cellValue;

            return (
              <td
                key={column.key}
                className={classNames('table-cell', {
                  [`align-${column.align || 'left'}`]: true,
                })}
                style={{ width: column.width }}
              >
                {cellContent}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
};

const Table: React.FC<TableProps> = ({
  data,
  columns,
  loading = false,
  hoverable = true,
  striped = true,
  className,
  onRowClick,
  pageSize,
  currentPage = 1,
  onPageChange,
  sortKey,
  sortDirection,
  onSort,
  ariaLabel,
  summary,
}) => {
  // Calculate paginated data
  const paginatedData = useMemo(() => {
    if (!pageSize) return data;
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, pageSize, currentPage]);

  // Calculate total pages
  const totalPages = pageSize ? Math.ceil(data.length / pageSize) : 0;

  const tableClasses = classNames(
    'table',
    {
      'table-hoverable': hoverable,
      'table-striped': striped,
      'table-loading': loading,
    },
    className
  );

  return (
    <div className="table-container">
      <table
        className={tableClasses}
        aria-label={ariaLabel}
        summary={summary}
        aria-busy={loading}
      >
        {renderTableHeader(columns, sortKey, sortDirection, onSort)}
        {renderTableBody(paginatedData, columns, onRowClick)}
      </table>

      {loading && (
        <div className="loading-overlay" aria-hidden="true">
          <Spinner size="large" color="primary" />
        </div>
      )}

      {pageSize && totalPages > 1 && (
        <div className="pagination" role="navigation" aria-label="Pagination">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info" aria-current="page">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      <style>
        {`
          .table-container {
            position: relative;
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            margin-bottom: 1rem;
          }

          .table-header {
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid var(--color-border);
            background-color: var(--color-background-secondary);
          }

          .table-cell {
            padding: 1rem;
            border-bottom: 1px solid var(--color-border);
          }

          .table-row {
            transition: background-color 0.2s ease;
          }

          .table-hoverable .table-row:hover {
            background-color: var(--color-background-hover);
          }

          .table-striped .table-row:nth-child(even) {
            background-color: var(--color-background-alternate);
          }

          .table-row.clickable {
            cursor: pointer;
          }

          .table-row.clickable:focus {
            outline: 2px solid var(--color-primary-400);
            outline-offset: -2px;
          }

          .sort-button {
            background: none;
            border: none;
            padding: 0;
            font: inherit;
            color: inherit;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            min-height: 44px;
            min-width: 44px;
          }

          .sort-button:focus {
            outline: 2px solid var(--color-primary-400);
            outline-offset: 2px;
          }

          .sort-indicator {
            font-size: 0.75rem;
            line-height: 1;
          }

          .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 255, 255, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .pagination {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-top: 1rem;
          }

          .pagination-button {
            padding: 0.5rem 1rem;
            min-height: 44px;
            min-width: 44px;
            border: 1px solid var(--color-border);
            background-color: var(--color-background);
            border-radius: 4px;
            cursor: pointer;
          }

          .pagination-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .pagination-button:focus {
            outline: 2px solid var(--color-primary-400);
            outline-offset: 2px;
          }

          .pagination-info {
            font-size: 0.875rem;
          }

          .align-left {
            text-align: left;
          }

          .align-center {
            text-align: center;
          }

          .align-right {
            text-align: right;
          }

          @media (max-width: 768px) {
            .table-cell,
            .table-header {
              padding: 0.75rem;
            }

            .pagination {
              flex-direction: column;
              gap: 0.5rem;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Table;