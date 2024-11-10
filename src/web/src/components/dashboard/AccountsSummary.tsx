/**
 * A React component that displays a summary of user's financial accounts on the dashboard
 * with proper currency formatting and responsive layout.
 * 
 * Requirements addressed:
 * - Account Overview (Technical Specification/8.1.2 Main Dashboard)
 *   Displays accounts overview with balances and proper grouping
 * - Mobile-First Design (Technical Specification/1.1 System Overview)
 *   Implements responsive design for optimal mobile display
 */

// @version: react ^18.0.0
import React, { useEffect, useState, useCallback, useMemo } from 'react';

// Internal imports
import { Account, AccountType } from '../../types/models.types';
import { Card } from '../common/Card';
import { getAccounts } from '../../services/api/accounts.api';
import { formatCurrency } from '../../utils/currency.utils';

// Human tasks:
// 1. Verify proper error tracking is configured
// 2. Confirm accessibility color contrast ratios
// 3. Test touch target sizes on mobile devices
// 4. Validate currency formatting for all supported locales

interface AccountsSummaryProps {
  loading?: boolean;
  accounts?: Account[];
  onAccountClick?: (accountId: string) => void;
}

// Custom hook for managing accounts data and loading state
const useAccountsData = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const response = await getAccounts();
        setAccounts(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch accounts'));
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  return { accounts, loading, error };
};

// Helper function to calculate total balance across active accounts
const calculateTotalBalance = (accounts: Account[]): number => {
  return accounts
    .filter(account => account.isActive)
    .reduce((total, account) => total + account.balance, 0);
};

// Helper function to group accounts by type
const groupAccountsByType = (accounts: Account[]): Record<AccountType, Account[]> => {
  const activeAccounts = accounts.filter(account => account.isActive);
  
  return activeAccounts.reduce((groups, account) => {
    const type = account.accountType;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    // Sort accounts by balance within each group
    groups[type].sort((a, b) => b.balance - a.balance);
    return groups;
  }, {} as Record<AccountType, Account[]>);
};

const AccountsSummary: React.FC<AccountsSummaryProps> = ({
  loading: externalLoading,
  accounts: externalAccounts,
  onAccountClick
}) => {
  // Use external accounts if provided, otherwise fetch from API
  const { accounts: fetchedAccounts, loading: fetchLoading, error } = useAccountsData();
  const accounts = externalAccounts || fetchedAccounts;
  const loading = externalLoading !== undefined ? externalLoading : fetchLoading;

  // Memoize calculations to prevent unnecessary re-renders
  const totalBalance = useMemo(() => calculateTotalBalance(accounts), [accounts]);
  const groupedAccounts = useMemo(() => groupAccountsByType(accounts), [accounts]);

  // Handle account click events
  const handleAccountClick = useCallback((accountId: string) => {
    if (onAccountClick) {
      onAccountClick(accountId);
    }
  }, [onAccountClick]);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 'var(--spacing-4)',
    },
    totalBalance: {
      fontSize: 'var(--font-size-xl)',
      fontWeight: 'var(--font-weight-bold)',
      color: 'var(--color-text-primary)',
      textAlign: 'center' as const,
      margin: 'var(--spacing-4) 0',
    },
    accountGroup: {
      marginBottom: 'var(--spacing-4)',
    },
    groupTitle: {
      fontSize: 'var(--font-size-md)',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--color-text-secondary)',
      marginBottom: 'var(--spacing-2)',
    },
    accountList: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 'var(--spacing-3)',
    },
    accountItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'var(--spacing-3)',
      backgroundColor: 'var(--color-background-secondary)',
      borderRadius: 'var(--border-radius-md)',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      minHeight: '44px', // Minimum touch target size
    },
    accountName: {
      fontSize: 'var(--font-size-sm)',
      color: 'var(--color-text-primary)',
    },
    accountBalance: {
      fontSize: 'var(--font-size-sm)',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--color-text-primary)',
    },
    error: {
      color: 'var(--color-error)',
      textAlign: 'center' as const,
      padding: 'var(--spacing-4)',
    },
  };

  return (
    <Card
      title="Accounts Overview"
      loading={loading}
      testId="accounts-summary"
    >
      <div style={styles.container}>
        {error ? (
          <div style={styles.error} role="alert">
            Failed to load accounts. Please try again later.
          </div>
        ) : (
          <>
            <div style={styles.totalBalance}>
              <div>Total Balance</div>
              <div>{formatCurrency(totalBalance)}</div>
            </div>

            {Object.entries(groupedAccounts).map(([type, accounts]) => (
              <div key={type} style={styles.accountGroup}>
                <h3 style={styles.groupTitle}>{type}</h3>
                <div style={styles.accountList}>
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      style={styles.accountItem}
                      onClick={() => handleAccountClick(account.id)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleAccountClick(account.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${type} account with balance ${formatCurrency(account.balance)}`}
                    >
                      <span style={styles.accountName}>
                        {account.institutionId}
                      </span>
                      <span style={styles.accountBalance}>
                        {formatCurrency(account.balance, account.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </Card>
  );
};

export default AccountsSummary;