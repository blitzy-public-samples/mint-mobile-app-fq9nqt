// Library versions:
// class-validator: ^0.14.0

import { IsNumber, IsOptional, Min } from 'class-validator';

/**
 * Human Tasks:
 * 1. Ensure database queries are optimized for pagination performance
 * 2. Monitor and adjust MAX_LIMIT based on application performance metrics
 * 3. Consider implementing cursor-based pagination for large datasets if needed
 */

// Constants for pagination defaults and limits
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Interface defining pagination request parameters
 * @requirement API Design - Pagination
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Interface defining pagination response metadata
 * @requirement API Design - Pagination
 */
export interface PaginationMetadata {
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Generic interface for paginated API responses
 * @requirement API Design - Pagination
 */
export interface PaginatedResponse<T> {
  data: T[];
  metadata: PaginationMetadata;
}

/**
 * DTO class for validating pagination parameters
 * @requirement API Design - Pagination
 */
export class PaginationParamsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

/**
 * Creates pagination metadata based on query results
 * @requirement API Design - Pagination
 * @requirement Performance - Data Retrieval
 */
export function createPaginationMetadata(
  totalItems: number,
  page: number,
  limit: number
): PaginationMetadata {
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / limit);
  
  // Normalize page number to be within valid range
  const normalizedPage = Math.max(1, Math.min(page, totalPages || 1));

  return {
    totalItems,
    itemsPerPage: limit,
    totalPages,
    currentPage: normalizedPage
  };
}

/**
 * Creates a standardized paginated response
 * @requirement API Design - Pagination
 */
export function createPaginatedResponse<T>(
  data: T[],
  metadata: PaginationMetadata
): PaginatedResponse<T> {
  return {
    data,
    metadata
  };
}

/**
 * Extracts and validates pagination parameters from request
 * @requirement API Design - Pagination
 * @requirement Performance - Data Retrieval
 */
export function getPaginationParams(query: Record<string, any>): PaginationParams {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  let limit = Math.max(1, Number(query.limit) || DEFAULT_LIMIT);
  
  // Ensure limit doesn't exceed maximum allowed value
  limit = Math.min(limit, MAX_LIMIT);

  return {
    page,
    limit
  };
}

/**
 * Calculates the skip value for database queries based on pagination parameters
 * @requirement Performance - Data Retrieval
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Validates and normalizes pagination parameters
 * @requirement API Design - Pagination
 */
export function normalizePaginationParams(params: PaginationParams): PaginationParams {
  const normalizedParams = {
    page: Math.max(1, Number(params.page) || DEFAULT_PAGE),
    limit: Math.max(1, Number(params.limit) || DEFAULT_LIMIT)
  };

  // Ensure limit doesn't exceed maximum allowed value
  normalizedParams.limit = Math.min(normalizedParams.limit, MAX_LIMIT);

  return normalizedParams;
}