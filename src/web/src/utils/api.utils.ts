// @version axios ^1.4.0
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { BASE_URL, TIMEOUT, RETRY_ATTEMPTS } from '../config/api.config';
import { ApiResponse, ApiError, ApiRequestOptions, isAxiosError } from '../types/api.types';
import { getLocalStorageItem } from './storage.utils';

/**
 * Human Tasks:
 * 1. Configure environment variables for API endpoints and security settings
 * 2. Set up API monitoring and logging infrastructure
 * 3. Configure error tracking service integration
 * 4. Review and adjust retry mechanism parameters for production
 * 5. Set up SSL certificates and CORS configuration
 */

/**
 * Implements Technical Specification/9.3.1 API Security
 * Creates a configured axios instance for API requests with security measures
 */
export function createApiRequest(options: ApiRequestOptions): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Version': process.env.VITE_APP_VERSION || '1.0.0',
      'X-Request-ID': crypto.randomUUID()
    }
  });

  // Request interceptor for authentication and request preprocessing
  instance.interceptors.request.use(
    async (config) => {
      if (options.includeAuth) {
        const headers = await getAuthHeaders();
        config.headers = { ...config.headers, ...headers };
      }
      
      // Add timestamp for request tracking
      config.headers['X-Request-Time'] = new Date().toISOString();
      
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(handleApiError(error));
    }
  );

  // Response interceptor for error handling and response transformation
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return transformResponse(response.data);
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: number };
      
      // Handle token refresh on 401 errors
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = 1;
        try {
          const refreshToken = getLocalStorageItem('refresh_token', true);
          if (refreshToken) {
            const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
            if (response.data.token) {
              localStorage.setItem('auth_token', response.data.token);
              originalRequest.headers = {
                ...originalRequest.headers,
                ...await getAuthHeaders()
              };
              return instance(originalRequest);
            }
          }
        } catch (refreshError) {
          return Promise.reject(handleApiError(refreshError as AxiosError));
        }
      }

      // Implement retry logic with exponential backoff
      if (originalRequest && options.retryOnError && (!originalRequest._retry || originalRequest._retry < RETRY_ATTEMPTS)) {
        originalRequest._retry = (originalRequest._retry || 0) + 1;
        const delay = Math.min(1000 * Math.pow(2, originalRequest._retry - 1), 10000);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return instance(originalRequest);
      }

      return Promise.reject(handleApiError(error));
    }
  );

  return instance;
}

/**
 * Implements Technical Specification/A.1.3 Error Handling Standards
 * Transforms API errors into standardized format with detailed information
 */
export function handleApiError(error: AxiosError): ApiError {
  const timestamp = new Date().toISOString();
  const correlationId = error.config?.headers?.['X-Request-ID'] as string || crypto.randomUUID();

  if (isAxiosError(error) && error.response) {
    return {
      code: error.response.status === 401 ? 'UNAUTHORIZED' :
            error.response.status === 403 ? 'FORBIDDEN' :
            error.response.status === 404 ? 'NOT_FOUND' :
            error.response.status === 422 ? 'VALIDATION_ERROR' :
            error.response.status >= 500 ? 'SERVER_ERROR' : 'INVALID_REQUEST',
      message: error.response.data?.message || error.message,
      details: Array.isArray(error.response.data?.details) ? 
               error.response.data.details : 
               [error.response.data?.detail || 'An unexpected error occurred'],
      timestamp,
      correlationId,
      stackTrace: process.env.NODE_ENV === 'development' ? error.stack || null : null
    };
  }

  return {
    code: error.code === 'ECONNABORTED' ? 'NETWORK_ERROR' : 'SERVICE_UNAVAILABLE',
    message: 'Network or service error occurred',
    details: [error.message],
    timestamp,
    correlationId,
    stackTrace: process.env.NODE_ENV === 'development' ? error.stack || null : null
  };
}

/**
 * Implements Technical Specification/5.1 High-Level Architecture Overview
 * Transforms API response to standardized format with type safety
 */
export function transformResponse<T>(response: any): ApiResponse<T> {
  return {
    data: response.data,
    success: true,
    message: response.message || 'Success',
    timestamp: new Date().toISOString(),
    correlationId: response.correlationId || null
  };
}

/**
 * Implements Technical Specification/9.3.1 API Security
 * Retrieves authentication headers with token validation
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const token = getLocalStorageItem('auth_token', true);
    if (!token) {
      return {};
    }

    // Basic JWT validation
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      localStorage.removeItem('auth_token');
      return {};
    }

    // Check token expiration
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('auth_token');
        return {};
      }
    } catch (e) {
      localStorage.removeItem('auth_token');
      return {};
    }

    return {
      'Authorization': `Bearer ${token}`,
      'X-Auth-Time': new Date().toISOString()
    };
  } catch (error) {
    console.error('Error accessing authentication token:', error);
    return {};
  }
}