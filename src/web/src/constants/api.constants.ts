// @version axios ^1.4.0
import { ApiErrorCode } from '../types/api.types';

/**
 * Human Tasks:
 * 1. Ensure environment variables are properly configured in .env file
 * 2. Update API_VERSION when deploying new API versions
 * 3. Configure API monitoring and logging systems
 * 4. Set up error tracking for the defined error codes
 */

/**
 * Implements Technical Specification/8.3 API Design/8.3.1 REST API Endpoints
 * Current API version identifier used in endpoint URLs
 */
export const API_VERSION = 'v1';

/**
 * Implements Technical Specification/8.3 API Design/8.3.1 REST API Endpoints
 * Comprehensive mapping of all API endpoints following REST principles
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    RESET_PASSWORD: '/auth/reset-password'
  },
  ACCOUNTS: {
    BASE: '/accounts',
    LINK: '/accounts/link',
    SYNC: '/accounts/sync',
    DETAILS: '/accounts/:id'
  },
  TRANSACTIONS: {
    BASE: '/transactions',
    DETAILS: '/transactions/:id',
    CATEGORIZE: '/transactions/:id/categorize',
    SEARCH: '/transactions/search'
  },
  BUDGETS: {
    BASE: '/budgets',
    DETAILS: '/budgets/:id',
    PROGRESS: '/budgets/:id/progress',
    ALERTS: '/budgets/:id/alerts'
  },
  INVESTMENTS: {
    BASE: '/investments',
    DETAILS: '/investments/:id',
    HOLDINGS: '/investments/holdings',
    PERFORMANCE: '/investments/performance'
  },
  GOALS: {
    BASE: '/goals',
    DETAILS: '/goals/:id',
    PROGRESS: '/goals/:id/progress'
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    SETTINGS: '/notifications/settings',
    MARK_READ: '/notifications/:id/read'
  },
  PLAID: {
    CREATE_LINK_TOKEN: '/plaid/create-link-token',
    EXCHANGE_TOKEN: '/plaid/exchange-token',
    SYNC: '/plaid/sync'
  }
} as const;

/**
 * Implements Technical Specification/9.3.1 API Security
 * Standard HTTP status codes used in API responses
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * Implements Technical Specification/A.1.3 Error Handling Standards
 * Application-specific error codes aligned with ApiErrorCode type
 */
export const ERROR_CODES: Record<ApiErrorCode, ApiErrorCode> = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const;

/**
 * Implements Technical Specification/8.3 API Design/8.3.1 REST API Endpoints
 * HTTP methods supported by the API endpoints
 */
export const REQUEST_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
} as const;

/**
 * Implements Technical Specification/8.3 API Design/8.3.1 REST API Endpoints
 * Default pagination settings for paginated API endpoints
 */
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100
} as const;

/**
 * Implements Technical Specification/9.3.1 API Security
 * Default request timeout in milliseconds
 */
export const DEFAULT_REQUEST_TIMEOUT = 30000;

/**
 * Implements Technical Specification/9.3.1 API Security
 * Maximum number of retry attempts for failed requests
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Implements Technical Specification/9.3.1 API Security
 * Default headers applied to all API requests
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-API-Version': API_VERSION
} as const;