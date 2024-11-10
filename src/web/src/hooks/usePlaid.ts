// @version react ^18.0.0
// @version @plaid/link-sdk ^3.4.0

import { useState, useCallback } from 'react';
import { PlaidLinkOptions } from '@plaid/link-sdk';
import { 
  createLinkToken, 
  exchangePublicToken, 
  getAccounts, 
  syncTransactions 
} from '../services/api/plaid.api';
import { ApiResponse, ApiErrorCode } from '../types/api.types';

/**
 * Human Tasks:
 * 1. Set up Plaid Link SDK environment variables in .env:
 *    - VITE_PLAID_ENV (sandbox/development/production)
 * 2. Configure error monitoring for Plaid Link integration
 * 3. Set up secure storage for Plaid tokens
 * 4. Review and adjust error handling strategies for production
 */

/**
 * Interface for Plaid hook state with comprehensive error handling
 * Implements Technical Specification/6.2.1 Account Synchronization Flow
 */
export interface PlaidHookState {
  isLoading: boolean;
  error: string | null;
  linkToken: string | null;
  isLinkReady: boolean;
  errorCode: ApiErrorCode | null;
}

/**
 * Interface for Plaid hook actions with proper error handling and type safety
 * Implements Technical Specification/Financial Institution Integration
 */
export interface PlaidHookActions {
  initializePlaidLink: () => Promise<void>;
  handlePlaidSuccess: (publicToken: string) => Promise<ApiResponse<void>>;
  handlePlaidError: (error: Error) => void;
  refreshAccounts: () => Promise<ApiResponse<Account[]>>;
}

/**
 * Custom hook for managing Plaid integration state and actions
 * Implements Technical Specification/Security Architecture
 */
export default function usePlaid(): [PlaidHookState, PlaidHookActions] {
  // Initialize state with proper typing
  const [state, setState] = useState<PlaidHookState>({
    isLoading: false,
    error: null,
    linkToken: null,
    isLinkReady: false,
    errorCode: null
  });

  /**
   * Initialize Plaid Link with secure token exchange
   * Implements Technical Specification/Financial Institution Integration
   */
  const initializePlaidLink = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null, errorCode: null }));

    try {
      const response = await createLinkToken();
      
      if (!response.success || !response.data.linkToken) {
        throw new Error('Failed to initialize Plaid Link');
      }

      setState(prev => ({
        ...prev,
        linkToken: response.data.linkToken,
        isLinkReady: true,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize Plaid Link',
        errorCode: 'SERVICE_UNAVAILABLE',
        isLoading: false
      }));
    }
  }, []);

  /**
   * Handle successful Plaid Link connection with OAuth flow
   * Implements Technical Specification/Account Synchronization Flow
   */
  const handlePlaidSuccess = useCallback(async (
    publicToken: string
  ): Promise<ApiResponse<void>> => {
    setState(prev => ({ ...prev, isLoading: true, error: null, errorCode: null }));

    try {
      // Exchange public token for access token
      const exchangeResponse = await exchangePublicToken(publicToken);

      if (!exchangeResponse.success) {
        throw new Error('Failed to exchange public token');
      }

      // Sync transactions for the new account
      const syncResponse = await syncTransactions(exchangeResponse.data.accessToken);

      setState(prev => ({
        ...prev,
        isLoading: false,
        isLinkReady: false,
        linkToken: null
      }));

      return syncResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to link account';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        errorCode: 'SERVER_ERROR',
        isLoading: false
      }));
      throw error;
    }
  }, []);

  /**
   * Handle Plaid Link errors with proper error codes
   * Implements Technical Specification/Security Architecture
   */
  const handlePlaidError = useCallback((error: Error): void => {
    setState(prev => ({
      ...prev,
      error: error.message,
      errorCode: 'SERVICE_UNAVAILABLE',
      isLoading: false,
      isLinkReady: false,
      linkToken: null
    }));
  }, []);

  /**
   * Refresh linked accounts with proper typing
   * Implements Technical Specification/Financial Institution Integration
   */
  const refreshAccounts = useCallback(async (): Promise<ApiResponse<Account[]>> => {
    setState(prev => ({ ...prev, isLoading: true, error: null, errorCode: null }));

    try {
      const response = await getAccounts();

      setState(prev => ({
        ...prev,
        isLoading: false
      }));

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh accounts';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        errorCode: 'SERVER_ERROR',
        isLoading: false
      }));
      throw error;
    }
  }, []);

  // Return state and actions tuple with comprehensive type safety
  return [
    state,
    {
      initializePlaidLink,
      handlePlaidSuccess,
      handlePlaidError,
      refreshAccounts
    }
  ];
}