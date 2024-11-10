// @version axios ^1.4.0
import { AxiosError } from 'axios';

/**
 * Human Tasks:
 * 1. Ensure axios ^1.4.0 is added to package.json dependencies
 * 2. Configure API error tracking/monitoring system to capture error codes and correlationIds
 * 3. Set up logging infrastructure to handle API error logging with correlationIds
 */

/**
 * Implements Technical Specification/8.3 API Design/8.3.1 REST API Endpoints
 * Standardized API response interface with type-safe data handling
 */
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
  correlationId: string | null;
}

/**
 * Implements Technical Specification/A.1.3 Error Handling Standards
 * Comprehensive error response interface with detailed error information
 */
export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details: string[];
  timestamp: string;
  correlationId: string;
  stackTrace: string | null;
}

/**
 * Implements Technical Specification/8.3 API Design/8.3.1 REST API Endpoints
 * Interface for paginated API responses supporting server-side pagination
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
}

/**
 * Implements Technical Specification/8.3 API Design/8.3.1 REST API Endpoints
 * Interface for API request configuration options
 */
export interface ApiRequestOptions {
  includeAuth: boolean;
  headers: Record<string, string>;
  timeout: number;
  withCredentials: boolean;
  retryOnError: boolean;
  maxRetries: number;
}

/**
 * Implements Technical Specification/8.3 API Design/8.3.1 REST API Endpoints
 * Base interface for user data in API responses
 */
export interface BaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Implements Technical Specification/8.3 API Design/8.3.1 REST API Endpoints
 * Type for supported HTTP methods in API requests
 */
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Implements Technical Specification/A.1.3 Error Handling Standards
 * Type for standardized API error codes
 */
export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_REQUEST'
  | 'SERVICE_UNAVAILABLE';

/**
 * Implements Technical Specification/8.3 API Design/8.3.1 REST API Endpoints
 * Type for sort direction options in paginated requests
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Type guard to check if an error is an Axios error
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return error instanceof AxiosError;
}

/**
 * Type guard to check if an error response contains the ApiError interface
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error &&
    'timestamp' in error &&
    'correlationId' in error
  );
}