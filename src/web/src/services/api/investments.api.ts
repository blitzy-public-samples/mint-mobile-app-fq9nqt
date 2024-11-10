// @version axios ^1.4.0
import { ApiResponse } from '../../types/api.types';
import { Investment } from '../../types/models.types';
import { createApiRequest, handleApiError } from '../../utils/api.utils';

/**
 * Human Tasks:
 * 1. Configure environment variables for investment API endpoints
 * 2. Set up monitoring for investment data sync performance
 * 3. Configure rate limiting for investment API endpoints
 * 4. Set up alerts for investment sync failures
 * 5. Configure logging for investment performance tracking
 */

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Investment Portfolio Tracking
 * Service for managing investment-related operations with secure API endpoints
 */

// Create authenticated API request instance with retry capability
const api = createApiRequest({
  includeAuth: true,
  headers: {
    'X-Service': 'investments',
  },
  timeout: 30000, // Extended timeout for investment operations
  withCredentials: true,
  retryOnError: true,
  maxRetries: 3
});

/**
 * Implements Technical Specification/1.2 Scope/Core Features - Investment Portfolio Tracking
 * Retrieves all investment holdings for the authenticated user
 */
export async function getInvestments(): Promise<ApiResponse<Investment[]>> {
  try {
    const response = await api.get<ApiResponse<Investment[]>>('/investments');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Implements Technical Specification/8.3.1 REST API Endpoints - Investment API Endpoints
 * Retrieves detailed information for a specific investment holding
 */
export async function getInvestmentById(id: string): Promise<ApiResponse<Investment>> {
  try {
    if (!id) {
      throw new Error('Investment ID is required');
    }
    
    const response = await api.get<ApiResponse<Investment>>(`/investments/${id}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Implements Technical Specification/8.3.1 REST API Endpoints - Investment API Endpoints
 * Retrieves performance metrics for an investment holding
 */
export async function getInvestmentPerformance(
  id: string,
  period: string
): Promise<ApiResponse<any>> {
  try {
    if (!id || !period) {
      throw new Error('Investment ID and period are required');
    }

    // Validate period parameter
    const validPeriods = ['1d', '1w', '1m', '3m', '6m', '1y', 'ytd', 'all'];
    if (!validPeriods.includes(period)) {
      throw new Error('Invalid period parameter');
    }

    const response = await api.get<ApiResponse<any>>(
      `/investments/${id}/performance`,
      {
        params: { period }
      }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Implements Technical Specification/8.3.1 REST API Endpoints - Investment API Endpoints
 * Triggers synchronization of investment data with financial institutions
 */
export async function syncInvestments(): Promise<ApiResponse<void>> {
  try {
    const response = await api.post<ApiResponse<void>>(
      '/investments/sync',
      {},
      {
        timeout: 60000, // Extended timeout for sync operation
        headers: {
          'X-Operation': 'sync',
          'X-Operation-Timeout': '60'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}