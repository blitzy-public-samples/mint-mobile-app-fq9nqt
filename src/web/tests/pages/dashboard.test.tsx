// @version: @testing-library/react ^13.0.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// @version: vitest ^0.34.0
import { describe, it, expect, vi, beforeEach } from 'vitest';
// @version: react ^18.0.0
import React from 'react';
// @version: react-router-dom ^6.0.0
import { BrowserRouter } from 'react-router-dom';

import Dashboard from '../../src/pages/dashboard/Dashboard';
import { createMockUser, createMockAccount, createMockTransaction } from '../../../test/utils/mock-data';

// Mock hooks and components
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    user: createMockUser()
  }))
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

vi.mock('../../components/dashboard/AccountsSummary', () => ({
  AccountsSummary: ({ onAccountClick }: { onAccountClick: (id: string) => void }) => (
    <div data-testid="accounts-summary" onClick={() => onAccountClick('test-account-id')}>
      Accounts Summary
    </div>
  )
}));

vi.mock('../../components/dashboard/BudgetOverview', () => ({
  BudgetOverview: ({ maxItems }: { maxItems: number }) => (
    <div data-testid="budget-overview">Budget Overview ({maxItems} items)</div>
  )
}));

vi.mock('../../components/dashboard/RecentTransactions', () => ({
  RecentTransactions: ({ limit, onTransactionClick }: { limit: number, onTransactionClick: (id: string) => void }) => (
    <div data-testid="recent-transactions" onClick={() => onTransactionClick('test-transaction-id')}>
      Recent Transactions ({limit} items)
    </div>
  )
}));

// Test wrapper component with router
const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  // Requirements addressed: Dashboard Overview Testing (Technical Specification/8.1.2 Main Dashboard)
  describe('Main Dashboard Rendering', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders dashboard with all sections', async () => {
      renderWithRouter(<Dashboard />);

      // Verify all main sections are present
      expect(screen.getByRole('main', { name: /dashboard content/i })).toBeInTheDocument();
      expect(screen.getByTestId('accounts-summary')).toBeInTheDocument();
      expect(screen.getByTestId('budget-overview')).toBeInTheDocument();
      expect(screen.getByTestId('recent-transactions')).toBeInTheDocument();

      // Verify welcome message
      const mockUser = createMockUser();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        new RegExp(mockUser.firstName, 'i')
      );

      // Verify section headings for accessibility
      expect(screen.getByLabelText(/accounts section/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/budget overview section/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recent transactions section/i)).toBeInTheDocument();
    });

    it('displays loading state correctly', () => {
      // Mock loading state
      vi.mock('../../hooks/useAuth', () => ({
        useAuth: () => ({
          isAuthenticated: true,
          user: null,
          loading: true
        })
      }));

      renderWithRouter(<Dashboard />);

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveAttribute('aria-busy', 'true');
      expect(loadingElement).toHaveTextContent(/loading your financial overview/i);
    });

    it('displays error state with retry option', async () => {
      // Mock error state
      vi.mock('../../hooks/useAuth', () => ({
        useAuth: () => ({
          isAuthenticated: true,
          user: null,
          error: 'Failed to load dashboard data'
        })
      }));

      renderWithRouter(<Dashboard />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  // Requirements addressed: Mobile Responsiveness Testing (Technical Specification/1.1 System Overview)
  describe('Responsive Layout Behavior', () => {
    it('adapts layout for mobile viewport', () => {
      // Set viewport to mobile size
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));

      renderWithRouter(<Dashboard />);

      const dashboardGrid = screen.getByRole('main').querySelector('.dashboard-grid');
      expect(dashboardGrid).toHaveStyle({
        'grid-template-columns': '1fr'
      });
    });

    it('adapts layout for tablet viewport', () => {
      // Set viewport to tablet size
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));

      renderWithRouter(<Dashboard />);

      const dashboardGrid = screen.getByRole('main').querySelector('.dashboard-grid');
      expect(dashboardGrid).toHaveStyle({
        'grid-template-columns': 'repeat(2, 1fr)'
      });
    });
  });

  describe('Navigation Interactions', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
      vi.mock('react-router-dom', async () => ({
        ...(await vi.importActual('react-router-dom')),
        useNavigate: () => mockNavigate
      }));
    });

    it('handles account click navigation', async () => {
      const mockAccount = createMockAccount('test-user-id');
      renderWithRouter(<Dashboard />);

      fireEvent.click(screen.getByTestId('accounts-summary'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(`/accounts/${mockAccount.id}`);
      });
    });

    it('handles transaction click navigation', async () => {
      const mockTransaction = createMockTransaction('test-account-id', 'test-user-id');
      renderWithRouter(<Dashboard />);

      fireEvent.click(screen.getByTestId('recent-transactions'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(`/transactions/${mockTransaction.id}`);
      });
    });
  });

  describe('Authentication Flow', () => {
    it('redirects to login when not authenticated', () => {
      const mockNavigate = vi.fn();
      vi.mock('../../hooks/useAuth', () => ({
        useAuth: () => ({
          isAuthenticated: false,
          user: null
        })
      }));
      vi.mock('react-router-dom', async () => ({
        ...(await vi.importActual('react-router-dom')),
        useNavigate: () => mockNavigate
      }));

      renderWithRouter(<Dashboard />);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA labels and roles', () => {
      renderWithRouter(<Dashboard />);

      // Verify main landmark
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Dashboard content');

      // Verify section landmarks
      const sections = screen.getAllByRole('region');
      expect(sections).toHaveLength(3);
      sections.forEach(section => {
        expect(section).toHaveAttribute('aria-label');
      });

      // Verify loading state accessibility
      const loadingState = screen.queryByRole('status');
      if (loadingState) {
        expect(loadingState).toHaveAttribute('aria-busy');
        expect(loadingState).toHaveAttribute('aria-label', 'Loading dashboard content');
      }
    });

    it('maintains focus management for error retry', async () => {
      // Mock error state
      vi.mock('../../hooks/useAuth', () => ({
        useAuth: () => ({
          isAuthenticated: true,
          user: null,
          error: 'Error loading dashboard'
        })
      }));

      renderWithRouter(<Dashboard />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);
    });
  });
});