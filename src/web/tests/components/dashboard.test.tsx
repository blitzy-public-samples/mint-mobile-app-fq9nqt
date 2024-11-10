// @version: @testing-library/react ^14.0.0
import { render, screen, fireEvent, within } from '@testing-library/react';
// @version: @testing-library/jest-dom ^5.16.5
import '@testing-library/jest-dom';
// @version: @testing-library/user-event ^14.0.0
import userEvent from '@testing-library/user-event';
// @version: jest ^29.0.0
import { act } from 'react-dom/test-utils';

import AccountsSummary from '../../src/components/dashboard/AccountsSummary';
import BudgetOverview from '../../src/components/dashboard/BudgetOverview';
import RecentTransactions from '../../src/components/dashboard/RecentTransactions';

// Mock data helpers
const mockAccountData = () => [
  {
    id: '1',
    institutionId: 'Chase',
    accountType: 'CHECKING',
    balance: 5000.50,
    currency: 'USD',
    isActive: true
  },
  {
    id: '2',
    institutionId: 'Wells Fargo',
    accountType: 'SAVINGS',
    balance: 10000.75,
    currency: 'USD',
    isActive: true
  },
  {
    id: '3',
    institutionId: 'Vanguard',
    accountType: 'INVESTMENT',
    balance: 50000.25,
    currency: 'USD',
    isActive: true
  }
];

const mockBudgetData = () => [
  {
    id: '1',
    name: 'Groceries',
    amount: 500,
    spent: 350,
    categories: [
      { id: '1a', name: 'Food', amount: 300, spent: 250 },
      { id: '1b', name: 'Household', amount: 200, spent: 100 }
    ]
  },
  {
    id: '2',
    name: 'Transportation',
    amount: 200,
    spent: 180,
    categories: [
      { id: '2a', name: 'Gas', amount: 150, spent: 140 },
      { id: '2b', name: 'Parking', amount: 50, spent: 40 }
    ]
  }
];

const mockTransactionData = () => [
  {
    id: '1',
    date: new Date('2023-10-01'),
    description: 'Grocery Store',
    amount: -125.50,
    categoryId: 'groceries'
  },
  {
    id: '2',
    date: new Date('2023-10-02'),
    description: 'Salary Deposit',
    amount: 3000.00,
    categoryId: 'income'
  },
  {
    id: '3',
    date: new Date('2023-10-03'),
    description: 'Gas Station',
    amount: -45.75,
    categoryId: 'transportation'
  }
];

// Helper function to render components with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(component);
};

describe('AccountsSummary Component', () => {
  // Requirement: Dashboard UI Testing - Account balances
  test('renders loading state correctly using loading prop', () => {
    renderWithProviders(<AccountsSummary loading={true} />);
    expect(screen.getByTestId('accounts-summary')).toHaveAttribute('aria-busy', 'true');
  });

  test('displays account balances correctly with proper currency formatting', () => {
    const accounts = mockAccountData();
    renderWithProviders(<AccountsSummary accounts={accounts} loading={false} />);

    // Check total balance
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    expect(screen.getByText(`$${totalBalance.toLocaleString()}`)).toBeInTheDocument();

    // Check individual account balances
    accounts.forEach(account => {
      const formattedBalance = `$${account.balance.toLocaleString()}`;
      expect(screen.getByText(formattedBalance)).toBeInTheDocument();
    });
  });

  test('handles empty accounts array gracefully', () => {
    renderWithProviders(<AccountsSummary accounts={[]} loading={false} />);
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  test('updates when accounts data changes through props', () => {
    const { rerender } = renderWithProviders(
      <AccountsSummary accounts={mockAccountData()} loading={false} />
    );

    const newAccounts = [
      {
        id: '4',
        institutionId: 'New Bank',
        accountType: 'CHECKING',
        balance: 1000.00,
        currency: 'USD',
        isActive: true
      }
    ];

    rerender(<AccountsSummary accounts={newAccounts} loading={false} />);
    expect(screen.getByText('New Bank')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  test('handles account click events via onAccountClick prop', async () => {
    const handleClick = jest.fn();
    const accounts = mockAccountData();
    
    renderWithProviders(
      <AccountsSummary 
        accounts={accounts} 
        loading={false} 
        onAccountClick={handleClick}
      />
    );

    const accountElement = screen.getByText(accounts[0].institutionId);
    await userEvent.click(accountElement);
    expect(handleClick).toHaveBeenCalledWith(accounts[0].id);
  });

  // Requirement: Mobile Responsive Testing
  test('adapts to mobile viewport size (320px)', () => {
    global.innerWidth = 320;
    global.dispatchEvent(new Event('resize'));
    
    renderWithProviders(<AccountsSummary accounts={mockAccountData()} />);
    const container = screen.getByTestId('accounts-summary');
    expect(getComputedStyle(container).flexDirection).toBe('column');
  });
});

describe('BudgetOverview Component', () => {
  // Requirement: Dashboard UI Testing - Budget progress
  test('renders budget progress bars with correct percentages', () => {
    const budgets = mockBudgetData();
    renderWithProviders(<BudgetOverview />);

    budgets.forEach(budget => {
      const percentage = Math.round((budget.spent / budget.amount) * 100);
      const progressBar = screen.getByLabelText(`${budget.name} budget progress: ${percentage}% spent`);
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', String(percentage));
    });
  });

  test('displays correct budget categories when showCategories is true', () => {
    const budgets = mockBudgetData();
    renderWithProviders(<BudgetOverview showCategories={true} />);

    budgets.forEach(budget => {
      budget.categories?.forEach(category => {
        const percentage = Math.round((category.spent / category.amount) * 100);
        const categoryBar = screen.getByLabelText(`${category.name} category progress: ${percentage}% spent`);
        expect(categoryBar).toBeInTheDocument();
      });
    });
  });

  test('shows warning indicators for budgets at 80% or higher', () => {
    const warningBudget = {
      id: '3',
      name: 'Warning Budget',
      amount: 100,
      spent: 85,
      categories: []
    };

    renderWithProviders(<BudgetOverview />);
    const progressBar = screen.getByLabelText(`${warningBudget.name} budget progress: 85% spent`);
    expect(progressBar).toHaveClass('warning');
  });

  test('handles empty budget data gracefully', () => {
    renderWithProviders(<BudgetOverview />);
    expect(screen.getByText(/No active budgets found/i)).toBeInTheDocument();
  });

  test('respects maxItems prop for budget display limit', () => {
    const maxItems = 1;
    renderWithProviders(<BudgetOverview maxItems={maxItems} />);
    
    const budgets = mockBudgetData();
    const remainingBudgets = budgets.length - maxItems;
    expect(screen.getByText(`+${remainingBudgets} more budgets`)).toBeInTheDocument();
  });
});

describe('RecentTransactions Component', () => {
  // Requirement: Dashboard UI Testing - Transaction lists
  test('renders transaction list with correct data', () => {
    const transactions = mockTransactionData();
    renderWithProviders(<RecentTransactions />);

    transactions.forEach(transaction => {
      expect(screen.getByText(transaction.description)).toBeInTheDocument();
      const formattedAmount = transaction.amount >= 0 
        ? `+$${Math.abs(transaction.amount).toLocaleString()}`
        : `-$${Math.abs(transaction.amount).toLocaleString()}`;
      expect(screen.getByText(formattedAmount)).toBeInTheDocument();
    });
  });

  test('respects transaction limit prop for display count', () => {
    const limit = 2;
    const transactions = mockTransactionData();
    renderWithProviders(<RecentTransactions limit={limit} />);

    const transactionElements = screen.getAllByRole('row');
    // Add 1 to account for header row
    expect(transactionElements.length).toBe(limit + 1);
  });

  test('formats transaction amounts with proper currency display', () => {
    const transactions = mockTransactionData();
    renderWithProviders(<RecentTransactions />);

    transactions.forEach(transaction => {
      const formattedAmount = transaction.amount >= 0
        ? `+$${Math.abs(transaction.amount).toLocaleString()}`
        : `-$${Math.abs(transaction.amount).toLocaleString()}`;
      const amountElement = screen.getByText(formattedAmount);
      expect(amountElement).toHaveClass(transaction.amount >= 0 ? 'positive' : 'negative');
    });
  });

  test('handles transaction click events via onTransactionClick prop', async () => {
    const handleClick = jest.fn();
    const transactions = mockTransactionData();
    
    renderWithProviders(
      <RecentTransactions 
        onTransactionClick={handleClick}
      />
    );

    const firstRow = screen.getByText(transactions[0].description).closest('tr');
    await userEvent.click(firstRow!);
    expect(handleClick).toHaveBeenCalledWith(transactions[0]);
  });

  test('displays loading state correctly', () => {
    renderWithProviders(<RecentTransactions />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  });
});

describe('Responsive Design Tests', () => {
  // Requirement: Mobile Responsive Testing
  beforeEach(() => {
    // Reset viewport
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  test('adapts to mobile viewport size (320px)', () => {
    global.innerWidth = 320;
    global.dispatchEvent(new Event('resize'));

    renderWithProviders(
      <>
        <AccountsSummary accounts={mockAccountData()} />
        <BudgetOverview />
        <RecentTransactions />
      </>
    );

    // Verify responsive layout adjustments
    const accountsSummary = screen.getByTestId('accounts-summary');
    expect(getComputedStyle(accountsSummary).flexDirection).toBe('column');

    // Verify touch targets meet minimum size
    const clickableElements = screen.getAllByRole('button');
    clickableElements.forEach(element => {
      const styles = getComputedStyle(element);
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    });
  });

  test('maintains functionality on tablet size (768px)', () => {
    global.innerWidth = 768;
    global.dispatchEvent(new Event('resize'));

    renderWithProviders(
      <>
        <AccountsSummary accounts={mockAccountData()} />
        <BudgetOverview />
        <RecentTransactions />
      </>
    );

    // Verify all components are visible and functional
    expect(screen.getByTestId('accounts-summary')).toBeVisible();
    expect(screen.getByRole('region', { name: /budget overview/i })).toBeVisible();
    expect(screen.getByRole('table')).toBeVisible();
  });

  test('preserves data visibility on desktop screens (1024px+)', () => {
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));

    const accounts = mockAccountData();
    renderWithProviders(
      <>
        <AccountsSummary accounts={accounts} />
        <BudgetOverview />
        <RecentTransactions />
      </>
    );

    // Verify all data is visible
    accounts.forEach(account => {
      expect(screen.getByText(account.institutionId)).toBeVisible();
    });
  });

  test('ensures minimum touch target sizes of 44x44 points', () => {
    renderWithProviders(
      <>
        <AccountsSummary accounts={mockAccountData()} />
        <BudgetOverview />
        <RecentTransactions />
      </>
    );

    const interactiveElements = [
      ...screen.getAllByRole('button'),
      ...screen.getAllByRole('link', { hidden: true })
    ];

    interactiveElements.forEach(element => {
      const styles = getComputedStyle(element);
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    });
  });

  test('properly stacks elements on narrow screens', () => {
    global.innerWidth = 320;
    global.dispatchEvent(new Event('resize'));

    renderWithProviders(
      <>
        <AccountsSummary accounts={mockAccountData()} />
        <BudgetOverview />
        <RecentTransactions />
      </>
    );

    const container = screen.getByTestId('accounts-summary').parentElement;
    expect(getComputedStyle(container!).flexDirection).toBe('column');
  });
});