// @version: react ^18.0.0
// @version: react-router-dom ^6.0.0

/**
 * Account Details Page Component
 * Implements requirements:
 * - Financial Account Integration (Technical Specification/1.2 Scope/Core Features)
 * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
 * - Real-time Data Synchronization (Technical Specification/1.2 Scope/Technical Implementation)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Account, Transaction } from '../../types/models.types';
import { getAccountById, syncAccount } from '../../services/api/accounts.api';
import TransactionList from '../../components/transactions/TransactionList';
import AreaChart from '../../components/charts/AreaChart';

// Human Tasks:
// 1. Configure error monitoring service integration
// 2. Set up analytics tracking for account sync events
// 3. Verify accessibility compliance with WCAG 2.1 standards
// 4. Test real-time sync performance with different network conditions
// 5. Review and adjust error message content with UX team

interface AccountDetailsProps {}

const AccountDetails: React.FC<AccountDetailsProps> = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();

  // State management
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [balanceHistory, setBalanceHistory] = useState<Array<{ x: string; y: number }>>([]);

  // Fetch account details
  const fetchAccountDetails = useCallback(async () => {
    if (!accountId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getAccountById(accountId);
      setAccount(response.data);
      
      // Simulate balance history data (replace with actual API call)
      const today = new Date();
      const history = Array.from({ length: 30 }, (_, i) => ({
        x: new Date(today.getTime() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        y: response.data.balance + (Math.random() - 0.5) * 1000
      }));
      setBalanceHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account details');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchAccountDetails();
  }, [fetchAccountDetails]);

  // Handle manual account sync
  const handleSync = async () => {
    if (!accountId || syncing) return;

    try {
      setSyncing(true);
      setError(null);
      const response = await syncAccount(accountId);
      setAccount(response.data);
      // Show success message
      const syncMessage = document.createElement('div');
      syncMessage.setAttribute('role', 'status');
      syncMessage.setAttribute('aria-live', 'polite');
      syncMessage.textContent = 'Account synchronized successfully';
      document.body.appendChild(syncMessage);
      setTimeout(() => document.body.removeChild(syncMessage), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync account');
    } finally {
      setSyncing(false);
    }
  };

  // Handle transaction click
  const handleTransactionClick = useCallback((transaction: Transaction) => {
    navigate(`/dashboard/transactions/${transaction.id}`, {
      state: { accountId, transaction }
    });
  }, [accountId, navigate]);

  if (loading) {
    return (
      <div className="account-details-loading" role="status">
        <div className="loading-spinner" aria-hidden="true" />
        <span>Loading account details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-details-error" role="alert">
        <h2>Error Loading Account</h2>
        <p>{error}</p>
        <button 
          onClick={fetchAccountDetails}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="account-details-not-found" role="alert">
        <h2>Account Not Found</h2>
        <p>The requested account could not be found.</p>
        <button 
          onClick={() => navigate('/dashboard/accounts')}
          className="back-button"
        >
          Back to Accounts
        </button>
      </div>
    );
  }

  return (
    <div className="account-details">
      {/* Account Summary Section */}
      <section className="account-summary">
        <div className="account-header">
          <h1>Account Details</h1>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="sync-button"
            aria-busy={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync Account'}
          </button>
        </div>

        <div className="account-info">
          <div className="info-group">
            <label>Account Type</label>
            <span>{account.accountType}</span>
          </div>
          <div className="info-group">
            <label>Current Balance</label>
            <span className="balance">
              {account.balance.toLocaleString('en-US', {
                style: 'currency',
                currency: account.currency
              })}
            </span>
          </div>
          <div className="info-group">
            <label>Last Synced</label>
            <span>
              {new Date(account.lastSynced).toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      {/* Balance History Chart */}
      {/* <section className="balance-history">
        <h2>Balance History</h2>
        <div className="chart-container">
          <AreaChart
            data={balanceHistory}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: false
                },
                legend: {
                  display: false
                }
              },
              scales: {
                x: {
                  type: 'time',
                  time: {
                    unit: 'day'
                  },
                  title: {
                    display: true,
                    text: 'Date'
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: 'Balance'
                  },
                  ticks: {
                    callback: (value) => 
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: account.currency,
                        minimumFractionDigits: 0
                      }).format(value as number)
                  }
                }
              }
            }}
            height={300}
            fillColor="rgba(75, 192, 192, 0.2)"
            lineColor="rgb(75, 192, 192)"
          />
        </div>
      </section> */}

      {/* Transactions Section */}
      <section className="transactions">
        <h2>Recent Transactions</h2>
        <TransactionList
          accountId={accountId}
          pageSize={10}
          onTransactionClick={handleTransactionClick}
          className="transactions-list"
          ariaLabel={`Recent transactions for ${account.accountType} account`}
        />
      </section>

      <style jsx>{`
        .account-details {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .account-summary {
          background: var(--color-background-elevated);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .account-header h1 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--color-text-primary);
        }

        .sync-button {
          padding: 0.5rem 1rem;
          background: var(--color-primary-400);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .sync-button:disabled {
          background: var(--color-disabled);
          cursor: not-allowed;
        }

        .account-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .info-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .info-group label {
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .info-group .balance {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .balance-history,
        .transactions {
          background: var(--color-background-elevated);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .balance-history h2,
        .transactions h2 {
          margin: 0 0 1rem;
          font-size: 1.25rem;
          color: var(--color-text-primary);
        }

        .chart-container {
          height: 300px;
          margin-bottom: 1rem;
        }

        .account-details-loading,
        .account-details-error,
        .account-details-not-found {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
          padding: 2rem;
        }

        .loading-spinner {
          border: 4px solid var(--color-background);
          border-top: 4px solid var(--color-primary-400);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .retry-button,
        .back-button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: var(--color-primary-400);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .account-details {
            padding: 1rem;
          }

          .account-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .account-info {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
          }

          .sync-button {
            transition: none;
          }
        }

        @media (forced-colors: active) {
          .sync-button {
            border: 1px solid ButtonText;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountDetails;