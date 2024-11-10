// @version axios ^1.4.0
// @version @plaid/plaid-js ^12.0.0

import axios from 'axios';
import { Configuration, PlaidApi, PlaidEnvironments } from '@plaid/plaid-js';
import { ApiResponse } from '../../types/api.types';
import { API_CONFIG } from '../../config/api.config';

/**
 * Human Tasks:
 * 1. Set up Plaid API credentials in environment variables:
 *    - VITE_PLAID_CLIENT_ID
 *    - VITE_PLAID_SECRET
 *    - VITE_PLAID_ENV (sandbox/development/production)
 * 2. Configure error monitoring for Plaid API integration
 * 3. Set up secure storage for Plaid access tokens
 * 4. Review and adjust retry mechanisms for production use
 */

/**
 * Interface for Plaid link token response with expiration handling
 * Implements Technical Specification/6.2.1 Account Synchronization Flow
 */
interface LinkTokenResponse {
  linkToken: string;
  expiration: string;
}

/**
 * Interface for public token exchange request following OAuth flow
 * Implements Technical Specification/9.3.1 API Security
 */
interface ExchangeTokenRequest {
  publicToken: string;
}

/**
 * Interface for Plaid account data with access credentials
 * Implements Technical Specification/1.1 System Overview/Core Features
 */
interface PlaidAccountResponse {
  accessToken: string;
  itemId: string;
  accounts: Account[];
}

/**
 * Interface for Plaid account data
 */
interface Account {
  id: string;
  name: string;
  type: string;
  subtype: string;
  balances: {
    available: number | null;
    current: number;
    limit?: number;
  };
  mask: string;
  officialName: string;
}

/**
 * Creates a Plaid Link token for initializing the account linking process
 * Implements Technical Specification/Financial Institution Integration
 */
export async function createLinkToken(): Promise<ApiResponse<LinkTokenResponse>> {
  try {
    const response = await axios.post<ApiResponse<LinkTokenResponse>>(
      `${API_CONFIG.BASE_URL}/api/plaid/create-link-token`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': crypto.randomUUID()
        },
        timeout: API_CONFIG.TIMEOUT,
        withCredentials: true
      }
    );

    if (!response.data.success || !response.data.data.linkToken) {
      throw new Error('Failed to create Plaid link token');
    }

    return response.data;
  } catch (error) {
    console.error('Error creating Plaid link token:', error);
    throw error;
  }
}

/**
 * Exchanges a public token for an access token after successful account linking
 * Implements Technical Specification/Account Synchronization
 */
export async function exchangePublicToken(
  publicToken: string
): Promise<ApiResponse<PlaidAccountResponse>> {
  if (!publicToken) {
    throw new Error('Public token is required');
  }

  try {
    const response = await axios.post<ApiResponse<PlaidAccountResponse>>(
      `${API_CONFIG.BASE_URL}/api/plaid/exchange-token`,
      { publicToken } as ExchangeTokenRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': crypto.randomUUID()
        },
        timeout: API_CONFIG.TIMEOUT,
        withCredentials: true
      }
    );

    if (!response.data.success || !response.data.data.accessToken) {
      throw new Error('Failed to exchange public token');
    }

    return response.data;
  } catch (error) {
    console.error('Error exchanging public token:', error);
    throw error;
  }
}

/**
 * Retrieves linked accounts data from Plaid
 * Implements Technical Specification/Financial Institution Integration
 */
export async function getAccounts(): Promise<ApiResponse<Account[]>> {
  try {
    const response = await axios.get<ApiResponse<Account[]>>(
      `${API_CONFIG.BASE_URL}/api/plaid/accounts`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': crypto.randomUUID()
        },
        timeout: API_CONFIG.TIMEOUT,
        withCredentials: true
      }
    );

    if (!response.data.success) {
      throw new Error('Failed to retrieve accounts');
    }

    return response.data;
  } catch (error) {
    console.error('Error retrieving accounts:', error);
    throw error;
  }
}

/**
 * Initiates transaction sync for linked accounts
 * Implements Technical Specification/Account Synchronization Flow
 */
export async function syncTransactions(
  accessToken: string
): Promise<ApiResponse<void>> {
  if (!accessToken) {
    throw new Error('Access token is required');
  }

  try {
    const response = await axios.post<ApiResponse<void>>(
      `${API_CONFIG.BASE_URL}/api/plaid/sync-transactions`,
      { accessToken },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': crypto.randomUUID()
        },
        timeout: API_CONFIG.TIMEOUT * 2, // Double timeout for sync operations
        withCredentials: true
      }
    );

    if (!response.data.success) {
      throw new Error('Failed to sync transactions');
    }

    return response.data;
  } catch (error) {
    console.error('Error syncing transactions:', error);
    throw error;
  }
}

// Initialize Plaid client for direct API calls if needed
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.VITE_PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.VITE_PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.VITE_PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(plaidConfig);