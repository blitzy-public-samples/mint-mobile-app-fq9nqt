// @version jest ^29.0.0
// @version @testing-library/react-hooks ^8.0.0
// @version @testing-library/react ^14.0.0

import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useTransactions } from '../../src/hooks/useTransactions';
import { 
  getTransactions, 
  updateTransaction, 
  categorizeTransaction, 
  searchTransactions 
} from '../../src/services/api/transactions.api';
import { Transaction } from '../../src/types/models.types';

// Mock the WebSocket
class MockWebSocket {
  onmessage: ((event: any) => void) | null = null;
  close = jest.fn();
  send = jest.fn();
  
  constructor() {
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify({
          type: 'TRANSACTION_UPDATE',
          data: mockTransactions[0]
        })});
      }
    }, 100);
  }
}

// Mock the API modules
jest.mock('../../src/services/api/transactions.api');
jest.mock('ws', () => MockWebSocket);

// Mock transaction data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    accountId: 'acc1',
    categoryId: 'cat1',
    amount: 100,
    date: new Date('2023-01-01'),
    description: 'Test Transaction 1',
    pending: false,
    metadata: {}
  },
  {
    id: '2',
    accountId: 'acc1',
    categoryId: 'cat2',
    amount: 200,
    date: new Date('2023-01-02'),
    description: 'Test Transaction 2',
    pending: false,
    metadata: {}
  }
];

describe('useTransactions', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).WebSocket = MockWebSocket;
  });

  /**
   * Tests successful transaction fetching with pagination
   * Requirement: Transaction Management (Technical Specification/1.2 Scope/Core Features)
   */
  it('should fetch transactions successfully', async () => {
    // Mock successful API response
    (getTransactions as jest.Mock).mockResolvedValueOnce({
      data: mockTransactions,
      total: 2,
      page: 1,
      limit: 20
    });

    // Render hook with test filters
    const { result } = renderHook(() => useTransactions({
      accountId: 'acc1',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-31')
    }));

    // Verify initial loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.transactions).toEqual([]);

    // Wait for data to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify fetched data
    expect(result.current.transactions).toEqual(mockTransactions);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.hasMore).toBe(false);
    expect(getTransactions).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      accountId: 'acc1',
      startDate: expect.any(Date),
      endDate: expect.any(Date)
    });
  });

  /**
   * Tests error handling in transaction fetching
   * Requirement: Transaction Management (Technical Specification/1.2 Scope/Core Features)
   */
  it('should handle API errors', async () => {
    // Mock API error
    const errorMessage = 'Failed to fetch transactions';
    (getTransactions as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    // Render hook
    const { result } = renderHook(() => useTransactions());

    // Wait for error state
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify error handling
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.transactions).toEqual([]);
  });

  /**
   * Tests transaction categorization functionality
   * Requirement: Transaction Management (Technical Specification/1.2 Scope/Core Features)
   */
  it('should update transaction category', async () => {
    // Mock initial transactions fetch
    (getTransactions as jest.Mock).mockResolvedValueOnce({
      data: mockTransactions,
      total: 2,
      page: 1,
      limit: 20
    });

    // Mock category update
    const updatedTransaction = {
      ...mockTransactions[0],
      categoryId: 'newCategory'
    };
    (categorizeTransaction as jest.Mock).mockResolvedValueOnce({
      data: updatedTransaction
    });

    // Render hook
    const { result } = renderHook(() => useTransactions());

    // Wait for initial data load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Perform category update
    await act(async () => {
      await result.current.categorizeTransaction('1', 'newCategory');
    });

    // Verify optimistic update
    expect(result.current.transactions[0].categoryId).toBe('newCategory');
    expect(categorizeTransaction).toHaveBeenCalledWith('1', 'newCategory');
  });

  /**
   * Tests transaction pagination functionality
   * Requirement: Transaction Management (Technical Specification/1.2 Scope/Core Features)
   */
  it('should handle pagination', async () => {
    // Mock first page response
    (getTransactions as jest.Mock).mockResolvedValueOnce({
      data: [mockTransactions[0]],
      total: 2,
      page: 1,
      limit: 1
    });

    // Render hook
    const { result } = renderHook(() => useTransactions());

    // Wait for initial data load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify first page
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);

    // Mock second page response
    (getTransactions as jest.Mock).mockResolvedValueOnce({
      data: [mockTransactions[1]],
      total: 2,
      page: 2,
      limit: 1
    });

    // Load next page
    await act(async () => {
      await result.current.fetchMoreTransactions();
    });

    // Verify pagination results
    expect(result.current.transactions).toHaveLength(2);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.currentPage).toBe(2);
  });

  /**
   * Tests real-time update functionality
   * Requirement: Real-time Data Synchronization (Technical Specification/5.1 High-Level Architecture Overview)
   */
  it('should handle real-time updates', async () => {
    // Mock initial fetch
    (getTransactions as jest.Mock).mockResolvedValueOnce({
      data: mockTransactions,
      total: 2,
      page: 1,
      limit: 20
    });

    // Render hook
    const { result } = renderHook(() => useTransactions());

    // Wait for initial data and WebSocket update
    await waitFor(() => {
      expect(result.current.transactions[0]).toEqual(mockTransactions[0]);
    });

    // Verify WebSocket connection cleanup
    const { unmount } = renderHook(() => useTransactions());
    unmount();
    expect(MockWebSocket.prototype.close).toHaveBeenCalled();
  });

  /**
   * Tests transaction search functionality
   * Requirement: Transaction Management (Technical Specification/1.2 Scope/Core Features)
   */
  it('should search transactions', async () => {
    // Mock search response
    const searchResults = [mockTransactions[0]];
    (searchTransactions as jest.Mock).mockResolvedValueOnce({
      data: searchResults,
      total: 1,
      page: 1,
      limit: 20
    });

    // Render hook
    const { result } = renderHook(() => useTransactions());

    // Perform search
    await act(async () => {
      await result.current.searchTransactions('Test');
    });

    // Verify search results
    expect(result.current.transactions).toEqual(searchResults);
    expect(searchTransactions).toHaveBeenCalledWith({
      query: 'Test',
      page: 1,
      limit: 20,
      sortBy: 'date',
      sortDirection: 'desc'
    });
  });

  /**
   * Tests transaction update functionality
   * Requirement: Transaction Management (Technical Specification/1.2 Scope/Core Features)
   */
  it('should update transaction details', async () => {
    // Mock initial fetch
    (getTransactions as jest.Mock).mockResolvedValueOnce({
      data: mockTransactions,
      total: 2,
      page: 1,
      limit: 20
    });

    // Mock update response
    const updatedTransaction = {
      ...mockTransactions[0],
      amount: 150
    };
    (updateTransaction as jest.Mock).mockResolvedValueOnce({
      data: updatedTransaction
    });

    // Render hook
    const { result } = renderHook(() => useTransactions());

    // Wait for initial data load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Perform update
    await act(async () => {
      await result.current.updateTransaction('1', { amount: 150 });
    });

    // Verify update
    expect(result.current.transactions[0].amount).toBe(150);
    expect(updateTransaction).toHaveBeenCalledWith('1', { amount: 150 });
  });

  /**
   * Tests filter change handling
   * Requirement: Transaction Management (Technical Specification/1.2 Scope/Core Features)
   */
  it('should handle filter changes', async () => {
    // Mock initial fetch
    (getTransactions as jest.Mock).mockResolvedValueOnce({
      data: mockTransactions,
      total: 2,
      page: 1,
      limit: 20
    });

    // Render hook with initial filters
    const { rerender } = renderHook(
      (filters) => useTransactions(filters),
      { initialProps: { accountId: 'acc1' } }
    );

    // Mock fetch with new filters
    (getTransactions as jest.Mock).mockResolvedValueOnce({
      data: [mockTransactions[1]],
      total: 1,
      page: 1,
      limit: 20
    });

    // Change filters
    rerender({ accountId: 'acc2' });

    // Verify new fetch with updated filters
    expect(getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'acc2'
      })
    );
  });
});