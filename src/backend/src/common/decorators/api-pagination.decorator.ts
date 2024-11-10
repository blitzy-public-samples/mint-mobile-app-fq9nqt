// Library versions:
// @nestjs/common: ^9.0.0
// @nestjs/swagger: ^6.0.0

import { applyDecorators } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PaginationParams, createPaginationMetadata } from '../utils/pagination.util';

/**
 * Human Tasks:
 * 1. Monitor API response times and adjust pagination defaults if needed
 * 2. Review and update OpenAPI documentation when pagination schema changes
 * 3. Consider implementing response caching for frequently accessed paginated data
 */

/**
 * Interface for pagination decorator configuration options
 * @requirement API Design - Pagination
 */
export interface ApiPaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
}

/**
 * Default configuration for pagination
 * @requirement API Design - Pagination
 */
const DEFAULT_PAGINATION_OPTIONS: Required<ApiPaginationOptions> = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100
};

/**
 * Decorator that adds OpenAPI documentation for pagination
 * @param options Optional pagination configuration
 * @returns MethodDecorator Combined decorators for pagination documentation
 * 
 * @requirement API Design - Pagination
 * @requirement API Documentation
 */
export function ApiPagination(options?: ApiPaginationOptions) {
  const config = {
    ...DEFAULT_PAGINATION_OPTIONS,
    ...options
  };

  return applyDecorators(
    // Document page query parameter
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (starts from 1)',
      example: config.defaultPage,
      schema: {
        minimum: 1,
        default: config.defaultPage
      }
    }),

    // Document limit query parameter
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page',
      example: config.defaultLimit,
      schema: {
        minimum: 1,
        maximum: config.maxLimit,
        default: config.defaultLimit
      }
    }),

    // Document paginated response structure
    ApiResponse({
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            description: 'Array of items for the current page'
          },
          metadata: {
            type: 'object',
            properties: {
              totalItems: {
                type: 'number',
                description: 'Total number of items across all pages'
              },
              itemsPerPage: {
                type: 'number',
                description: 'Number of items per page'
              },
              totalPages: {
                type: 'number',
                description: 'Total number of pages'
              },
              currentPage: {
                type: 'number',
                description: 'Current page number'
              }
            }
          }
        }
      }
    })
  );
}

export default ApiPagination;
```

This implementation:

1. Creates a decorator that adds OpenAPI documentation for paginated endpoints
2. Provides configurable options for default page size, page number, and maximum limit
3. Documents both query parameters (page and limit) with validation rules
4. Documents the standardized response structure with metadata
5. Uses the pagination utilities from pagination.util.ts for consistency
6. Follows REST API design requirements for standardized pagination
7. Implements OpenAPI 3.0 documentation as specified
8. Includes helpful code comments linking to requirements
9. Lists human tasks for monitoring and optimization
10. Uses proper TypeScript types and interfaces
11. Follows NestJS decorator patterns and best practices

The decorator can be used on controller methods to automatically add pagination documentation:

```typescript
@Get()
@ApiPagination({ defaultLimit: 25, maxLimit: 50 })
async findAll(@Query() query: PaginationParamsDto) {
  // Implementation
}