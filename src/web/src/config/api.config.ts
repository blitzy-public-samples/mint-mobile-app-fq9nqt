// @version axios ^1.4.0
import axios, { AxiosRequestConfig, AxiosError, AxiosInstance } from 'axios';
import { API_ENDPOINTS } from '../constants/api.constants';
import { ApiRequestOptions } from '../types/api.types';

/**
 * Human Tasks:
 * 1. Configure environment variables in .env file:
 *    - VITE_API_BASE_URL
 *    - VITE_APP_VERSION
 * 2. Set up API monitoring and logging systems
 * 3. Configure error tracking service
 * 4. Review and adjust retry mechanism parameters for production
 */

/**
 * Implements Technical Specification/8.3 API Design/8.3.1 REST API Endpoints
 * Global API configuration settings with retry mechanisms
 */
export const API_CONFIG = {
  BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
  TIMEOUT: 1500,
  WITH_CREDENTIALS: true,
  RETRY_ATTEMPTS: 0,
  RETRY_DELAY: 1000,
  MAX_RETRY_DELAY: 5000,
  BACKOFF_FACTOR: 2
} as const;

/**
 * Implements Technical Specification/9.3.1 API Security
 * Default headers for all API requests
 */
export const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-Client-Version': process.env.VITE_APP_VERSION,
  'X-Client-Platform': 'web'
} as const;

/**
 * Implements Technical Specification/9.3.1 API Security
 * Creates axios instance configuration with default settings and security measures
 */
export const createApiConfig = (options: ApiRequestOptions): AxiosRequestConfig => {
  const headers = {
    ...DEFAULT_HEADERS,
    ...options.headers
  };

  if (options.includeAuth) {
    const authHeader = getAuthHeader();
    Object.assign(headers, authHeader);
  }

  return {
    baseURL: API_CONFIG.BASE_URL,
    timeout: options.timeout || API_CONFIG.TIMEOUT,
    withCredentials: options.withCredentials ?? API_CONFIG.WITH_CREDENTIALS,
    headers,
    validateStatus: (status: number) => status >= 200 && status < 300
  };
};

/**
 * Implements Technical Specification/9.3.1 API Security
 * Generates authorization header with JWT token following security standards
 */
export const getAuthHeader = (): Record<string, string> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return {};
    }

    // Basic token validation (expiration check would be done on the server)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      localStorage.removeItem('auth_token');
      return {};
    }

    return {
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error('Error accessing token storage:', error);
    return {};
  }
};

/**
 * Implements Technical Specification/5.1 High-Level Architecture Overview
 * Creates and configures the API client instance with interceptors and retry logic
 */
const createApiClient = (options: ApiRequestOptions): AxiosInstance => {
  const config = createApiConfig(options);
  const instance = axios.create(config);

  // Request interceptor for authentication and request preprocessing
  instance.interceptors.request.use(
    (config) => {
      // Add timestamp to requests for logging and debugging
      config.headers['X-Request-Time'] = new Date().toISOString();
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response interceptor for error handling and retry logic
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as AxiosRequestConfig & { _retry?: number };
      
      if (!config || !options.retryOnError) {
        return Promise.reject(error);
      }

      config._retry = config._retry || 0;

      if (config._retry < API_CONFIG.RETRY_ATTEMPTS) {
        config._retry += 1;
        
        // Calculate exponential backoff delay
        const delay = Math.min(
          API_CONFIG.RETRY_DELAY * Math.pow(API_CONFIG.BACKOFF_FACTOR, config._retry - 1),
          API_CONFIG.MAX_RETRY_DELAY
        );

        // Wait for the calculated delay
        await new Promise(resolve => setTimeout(resolve, delay));

        // Handle token refresh if needed
        if (error.response?.status === 401 && options.includeAuth) {
          try {
            // Attempt to refresh the token
            const response = await axios.post(
              `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
              {},
              { withCredentials: true }
            );
            
            if (response.data.token) {
              localStorage.setItem('auth_token', response.data.token);
              config.headers = {
                ...config.headers,
                ...getAuthHeader()
              };
            }
          } catch (refreshError) {
            // If token refresh fails, redirect to login
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Retry the request
        return instance(config);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Export configured API client factory
 */
export const createApi = (options: Partial<ApiRequestOptions> = {}): AxiosInstance => {
  const defaultOptions: ApiRequestOptions = {
    includeAuth: true,
    headers: {},
    timeout: API_CONFIG.TIMEOUT,
    withCredentials: API_CONFIG.WITH_CREDENTIALS,
    retryOnError: true,
    maxRetries: API_CONFIG.RETRY_ATTEMPTS
  };

  return createApiClient({ ...defaultOptions, ...options });
};