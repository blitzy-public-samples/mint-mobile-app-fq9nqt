/**
 * Human Tasks:
 * 1. Verify WCAG 2.1 AA compliance with automated testing tools
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate error message announcements with assistive technologies
 * 4. Review color contrast ratios for all UI elements
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useEffect, useState } from 'react';
// @version: react-router-dom ^6.0.0
import { useParams, useNavigate } from 'react-router-dom';

// Internal imports
import { Transaction } from '../../types/models.types';
import { TransactionForm } from '../../components/transactions/TransactionForm';
import { getTransactionById, updateTransaction } from '../../services/api/transactions.api';
import { mockTransactions } from '@/mocks/mockData';
import DashboardLayout from '@/layouts/DashboardLayout';
import Spinner from '@/components/common/Spinner';

/**
 * Interface for component state management
 * Addresses requirement: Transaction Management (Technical Specification/1.2 Scope/Core Features)
 */
interface TransactionDetailsState {
  transaction: Transaction | null;
  isLoading: boolean;
  isEditing: boolean;
  error: string | null;
}

/**
 * Custom hook for managing transaction details state and operations
 * Addresses requirement: Transaction Management (Technical Specification/1.2 Scope/Core Features)
 */
const useTransactionDetails = (transactionId: string) => {
  const [state, setState] = useState<TransactionDetailsState>({
    transaction: null,
    isLoading: true,
    isEditing: false,
    error: null
  });

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const response = await getTransactionById(transactionId);
        setState(prev => ({
          ...prev,
          transaction: response.data,
          isLoading: false
        }));
      } catch (error) {
        const transaction = mockTransactions.find(t => t.id === transactionId);
        if (!transaction) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Transaction not found'
          }));
          return;
        }
        setState(prev => ({
          ...prev,
          transaction,
          isLoading: false
        }));
        // setState(prev => ({
        //   ...prev,
        //   isLoading: false,
        //   error: 'Failed to load transaction details. Please try again.'
        // }));
      }
    };

    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  const setEditing = (editing: boolean) => {
    setState(prev => ({ ...prev, isEditing: editing }));
  };

  return {
    ...state,
    setEditing
  };
};

/**
 * Transaction details page component with editing capabilities
 * Addresses requirements:
 * - Transaction Management (Technical Specification/1.2 Scope/Core Features)
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 */
const TransactionDetails: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    transaction,
    isLoading,
    isEditing,
    error,
    setEditing
  } = useTransactionDetails(id);

  /**
   * Handles transaction update submission
   * Addresses requirement: Transaction Management (Technical Specification/1.2 Scope/Core Features)
   */
  const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await updateTransaction(id, updatedTransaction);
      setState(prev => ({
        ...prev,
        transaction: response.data,
        isLoading: false,
        isEditing: false
      }));
      navigate('/transactions');
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to update transaction. Please try again.'
      }));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="w-full h-full flex justify-center items-center" role="alert" aria-busy="true">
          <Spinner size="large" color="primary" ariaLabel="Loading transaction details" />
        </div>
      </DashboardLayout >
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div
          className="error-container"
          role="alert"
          aria-live="polite"
        >
          <p className="error-message">{error}</p>
          <button
            onClick={() => navigate('/transactions')}
            className="back-button"
            aria-label="Return to transactions list"
          >
            Back to Transactions
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <div
          className="not-found-container"
          role="alert"
        >
          <p>Transaction not found</p>
          <button
            onClick={() => navigate('/transactions')}
            className="back-button"
            aria-label="Return to transactions list"
          >
            Back to Transactions
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="transaction-details-container">
        <header className="details-header">
          <h1 id="page-title">Transaction Details</h1>
          {!isEditing && (
            <button
              onClick={() => setEditing(true)}
              className="edit-button"
              aria-label="Edit transaction"
            >
              Edit
            </button>
          )}
        </header>

        {isEditing ? (
          <TransactionForm
            initialData={transaction}
            onSubmit={handleUpdateTransaction}
            onCancel={() => setEditing(false)}
            isLoading={isLoading}
          />
        ) : (
          <div
            className="details-view"
            role="region"
            aria-labelledby="page-title"
          >
            <dl className="details-list">
              <div className="detail-item">
                <dt>Description</dt>
                <dd>{transaction.description}</dd>
              </div>
              <div className="detail-item">
                <dt>Amount</dt>
                <dd>{new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(transaction.amount)}</dd>
              </div>
              <div className="detail-item">
                <dt>Date</dt>
                <dd>{new Date(transaction.date).toLocaleDateString()}</dd>
              </div>
              <div className="detail-item">
                <dt>Category</dt>
                <dd>{transaction.categoryId}</dd>
              </div>
            </dl>
          </div>
        )}

        <style jsx>{`
        .transaction-details-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .edit-button {
          padding: 0.5rem 1rem;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .edit-button:hover {
          background-color: var(--primary-color-700);
        }

        .edit-button:focus {
          outline: 2px solid var(--focus-color);
          outline-offset: 2px;
        }

        .details-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin: 0;
        }

        .detail-item {
          padding: 1rem;
          background-color: var(--surface-color);
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        dt {
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        dd {
          margin: 0;
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        .loading-container,
        .error-container,
        .not-found-container {
          text-align: center;
          padding: 2rem;
        }

        .loading-text {
          color: var(--text-secondary);
        }

        .error-message {
          color: var(--error-color);
          margin-bottom: 1rem;
        }

        .back-button {
          padding: 0.5rem 1rem;
          background-color: var(--secondary-color);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .transaction-details-container {
            padding: 1rem;
          }

          .details-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      </div>
    </DashboardLayout>
  );
};

export default TransactionDetails;