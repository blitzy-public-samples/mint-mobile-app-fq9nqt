// @version: react ^18.0.0
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Table, { TableColumn } from '../../components/common/Table';
import Button from '../../components/common/Button';
import PlaidLink from '../../components/plaid/PlaidLink';
import { getAccounts, syncAccount } from '../../services/api/accounts.api';
import DashboardLayout from '@/layouts/DashboardLayout';

// Human tasks:
// 1. Verify color contrast ratios meet WCAG 2.1 AA standards
// 2. Test table interactions with screen readers
// 3. Validate touch target sizes on mobile devices
// 4. Configure Plaid environment variables
// 5. Set up error monitoring service integration

interface Account {
  id: string;
  institutionName: string;
  accountType: string;
  balance: number;
  currency: string;
  isActive: boolean;
  lastSynced: Date;
}

interface AccountsPageProps {
  className?: string;
}

/**
 * Custom hook for managing accounts state and operations
 * Implements Technical Specification/1.2 Scope/Core Features - Financial Account Integration
 */
const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAccounts();
      setAccounts(response.data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  return { accounts, loading, error, refreshAccounts };
};

/**
 * Main accounts page component that displays financial accounts with management options
 * Implements:
 * - Technical Specification/1.2 Scope/Core Features - Financial Account Management
 * - Technical Specification/8.1 User Interface Design/8.1.2 Main Dashboard
 * - Technical Specification/8.1.7 Mobile Responsive Considerations
 */
const AccountsPage: React.FC<AccountsPageProps> = ({ className }) => {
  const navigate = useNavigate();
  const { accounts, loading, error, refreshAccounts } = useAccounts();
  const [syncingAccounts, setSyncingAccounts] = useState<Set<string>>(new Set());

  // Handle manual account synchronization
  const handleAccountSync = useCallback(async (accountId: string) => {
    try {
      setSyncingAccounts(prev => new Set(prev).add(accountId));
      await syncAccount(accountId);
      await refreshAccounts();
    } catch (err) {
      console.error('Error syncing account:', err);
    } finally {
      setSyncingAccounts(prev => {
        const newSet = new Set(prev);
        newSet.delete(accountId);
        return newSet;
      });
    }
  }, [refreshAccounts]);

  // Handle navigation to account details
  const handleAccountClick = useCallback((account: Account) => {
    navigate(`/dashboard/accounts/${account.id}`);
  }, [navigate]);

  // Handle successful Plaid account linking
  const handlePlaidSuccess = useCallback(async (plaidData: any) => {
    try {
      await refreshAccounts();
    } catch (err) {
      console.error('Error processing Plaid success:', err);
    }
  }, [refreshAccounts]);

  // Define table columns with proper accessibility and responsive design
  const columns: TableColumn[] = [
    {
      key: 'institutionName',
      header: 'Institution',
      sortable: true,
      width: '25%',
    },
    {
      key: 'accountType',
      header: 'Type',
      sortable: true,
      width: '15%',
    },
    {
      key: 'balance',
      header: 'Balance',
      sortable: true,
      width: '20%',
      align: 'right',
      render: (account: Account) => (
        <span className={account.balance < 0 ? 'text-error-500' : 'text-success-500'}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: account.currency
          }).format(account.balance)}
        </span>
      ),
    },
    {
      key: 'lastSynced',
      header: 'Last Synced',
      sortable: true,
      width: '20%',
      render: (account: Account) => (
        <span>
          {new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
          }).format(new Date(account.lastSynced))}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '20%',
      render: (account: Account) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleAccountSync(account.id);
            }}
            disabled={!account.isActive || syncingAccounts.has(account.id)}
            ariaLabel={`Sync ${account.institutionName} account`}
          >
            {syncingAccounts.has(account.id) ? 'Syncing...' : 'Sync'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className={`p-4 space-y-6 ${className}`}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-semibold" id="accounts-heading">
            Financial Accounts
          </h1>
          <PlaidLink
            buttonText="Link New Account"
            onSuccess={handlePlaidSuccess}
            onExit={(err) => {
              if (err) console.error('Plaid exit error:', err);
            }}
            className="min-w-[150px]"
            ariaLabel="Link a new financial account"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="bg-error-50 text-error-700 p-4 rounded-md border border-error-200"
          >
            Error loading accounts. Please try again later.
          </div>
        )}

        <Table
          data={accounts}
          columns={columns}
          loading={loading}
          onRowClick={handleAccountClick}
          className="w-full"
          hoverable
          striped
          ariaLabel="Financial accounts table"
          summary="List of your linked financial accounts with balances and sync status"
        />

        <style jsx>{`
        .account-row {
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .account-row:hover {
          background-color: var(--color-background-hover);
        }

        @media (max-width: 768px) {
          .account-actions {
            flex-direction: column;
            gap: 0.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .account-row {
            transition: none;
          }
        }

        @media (forced-colors: active) {
          .account-row:hover {
            border: 2px solid CanvasText;
          }
        }
      `}</style>
      </div>
    </DashboardLayout>
  );
};

export default AccountsPage;