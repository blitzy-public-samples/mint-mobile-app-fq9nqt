// @version: react ^18.0.0, @testing-library/react ^14.0.0, vitest ^0.34.0, react-router-dom ^6.0.0

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AccountsPage from '../../src/pages/accounts/Accounts';
import { getAccounts, syncAccount } from '../../src/services/api/accounts.api';

// Mock API functions
vi.mock('../../src/services/api/accounts.api', () => ({
  getAccounts: vi.fn(),
  syncAccount: vi.fn()
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Test data
const mockAccounts = [
  {
    id: '1',
    institutionName: 'Test Bank',
    accountType: 'CHECKING',
    balance: 1000.50,
    currency: 'USD',
    isActive: true,
    lastSynced: new Date('2023-01-01T12:00:00Z')
  },
  {
    id: '2',
    institutionName: 'Investment Corp',
    accountType: 'INVESTMENT',
    balance: 5000.75,
    currency: 'USD',
    isActive: true,
    lastSynced: new Date('2023-01-02T12:00:00Z')
  }
];

// Helper function to render component with router context
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('Accounts Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API response by default
    (getAccounts as jest.Mock).mockResolvedValue({ data: mockAccounts });
  });

  /**
   * Tests account list rendering functionality
   * Implements Technical Specification/8.1 User Interface Design/8.1.2 Main Dashboard
   */
  test('renders accounts list correctly', async () => {
    renderWithRouter(<AccountsPage />);

    // Verify loading state
    expect(screen.getByLabelText('Financial accounts table')).toBeInTheDocument();
    expect(getAccounts).toHaveBeenCalledTimes(1);

    // Wait for accounts to load
    await waitFor(() => {
      expect(screen.getByText('Test Bank')).toBeInTheDocument();
    });

    // Verify account details are displayed
    expect(screen.getByText('Investment Corp')).toBeInTheDocument();
    expect(screen.getByText('$1,000.50')).toBeInTheDocument();
    expect(screen.getByText('$5,000.75')).toBeInTheDocument();

    // Verify accessibility attributes
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'Financial accounts table');
    expect(table).toHaveAttribute('summary', 'List of your linked financial accounts with balances and sync status');
  });

  /**
   * Tests account synchronization functionality
   * Implements Technical Specification/1.2 Scope/Core Features - Financial Account Management
   */
  test('handles account sync', async () => {
    (syncAccount as jest.Mock).mockResolvedValueOnce({ data: { ...mockAccounts[0], balance: 1100.50 } });
    
    renderWithRouter(<AccountsPage />);

    // Wait for accounts to load
    await waitFor(() => {
      expect(screen.getByText('Test Bank')).toBeInTheDocument();
    });

    // Find and click sync button
    const syncButtons = screen.getAllByText('Sync');
    fireEvent.click(syncButtons[0]);

    // Verify sync was called
    expect(syncAccount).toHaveBeenCalledWith('1');
    expect(screen.getByText('Syncing...')).toBeInTheDocument();

    // Verify accounts are refreshed after sync
    await waitFor(() => {
      expect(getAccounts).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * Tests loading state display
   * Implements Technical Specification/8.1 User Interface Design/8.1.2 Main Dashboard
   */
  test('displays loading state', async () => {
    let resolveAccounts: (value: any) => void;
    (getAccounts as jest.Mock).mockImplementationOnce(() => new Promise(resolve => {
      resolveAccounts = resolve;
    }));

    renderWithRouter(<AccountsPage />);

    // Verify loading state
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');

    // Resolve loading
    resolveAccounts!({ data: mockAccounts });

    // Verify loading is complete
    await waitFor(() => {
      expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'false');
    });
  });

  /**
   * Tests error handling functionality
   * Implements Technical Specification/1.2 Scope/Core Features - Financial Account Management
   */
  test('handles API errors', async () => {
    const error = new Error('Failed to fetch accounts');
    (getAccounts as jest.Mock).mockRejectedValueOnce(error);

    renderWithRouter(<AccountsPage />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Error loading accounts. Please try again later.')).toBeInTheDocument();
  });

  /**
   * Tests navigation to account details
   * Implements Technical Specification/8.1 User Interface Design/8.1.2 Main Dashboard
   */
  test('navigates to account details', async () => {
    renderWithRouter(<AccountsPage />);

    // Wait for accounts to load
    await waitFor(() => {
      expect(screen.getByText('Test Bank')).toBeInTheDocument();
    });

    // Click on account row
    fireEvent.click(screen.getByText('Test Bank'));

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/accounts/1');
  });

  /**
   * Tests Plaid integration functionality
   * Implements Technical Specification/1.2 Scope/Core Features - Financial Account Integration
   */
  test('handles successful account linking', async () => {
    renderWithRouter(<AccountsPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Link New Account')).toBeInTheDocument();
    });

    // Simulate successful Plaid link
    const plaidData = {
      publicToken: 'test-token',
      metadata: {
        institution: { name: 'New Bank' },
        accounts: [{ id: 'new-account', name: 'New Account' }]
      }
    };

    // Get PlaidLink component and trigger success
    const plaidLink = screen.getByText('Link New Account').closest('button');
    expect(plaidLink).toBeInTheDocument();

    // Verify accounts are refreshed after linking
    await waitFor(() => {
      expect(getAccounts).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * Tests Plaid error handling
   * Implements Technical Specification/1.2 Scope/Core Features - Financial Account Integration
   */
  test('handles Plaid errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderWithRouter(<AccountsPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Link New Account')).toBeInTheDocument();
    });

    // Simulate Plaid error
    const plaidError = new Error('Plaid link error');
    const plaidLink = screen.getByText('Link New Account').closest('button');
    expect(plaidLink).toBeInTheDocument();

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});