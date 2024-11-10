// @nestjs/common v9.0.0
import { Injectable, NestMiddleware } from '@nestjs/common';
// express v4.18.0
import { Request, Response, NextFunction } from 'express';
// uuid v8.3.2
import { v4 as uuidv4 } from 'uuid';

/**
 * Human Tasks:
 * 1. Ensure your logging service is configured to include the correlation ID from the request context
 * 2. Configure any downstream services to propagate the X-Correlation-ID header
 */

/**
 * Middleware that ensures each request has a unique correlation ID for tracing
 * and security audit logging.
 * 
 * Requirements addressed:
 * - Security Monitoring (Technical Specification/9.3.2): Implements request tracing 
 *   and correlation for security audit logging
 * - Infrastructure Services (Technical Specification/5.2.3): Provides logging service 
 *   integration with correlation tracking
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  // Header name for correlation ID propagation
  public static readonly CORRELATION_ID_HEADER = 'X-Correlation-ID';
  private static readonly CORRELATION_ID_KEY = 'correlationId';

  /**
   * Processes requests to ensure correlation ID presence and propagation
   * @param request Express request object
   * @param response Express response object
   * @param next Next function in middleware chain
   */
  use(request: Request, response: Response, next: NextFunction): void {
    // Get or generate correlation ID
    const correlationId = this.getCorrelationId(request);

    // Add correlation ID to request headers for downstream services
    request.headers[CorrelationIdMiddleware.CORRELATION_ID_HEADER] = correlationId;

    // Add correlation ID to response headers for client tracing
    response.setHeader(CorrelationIdMiddleware.CORRELATION_ID_HEADER, correlationId);

    // Store correlation ID in request context for logging
    request[CorrelationIdMiddleware.CORRELATION_ID_KEY] = correlationId;

    // Continue middleware chain
    next();
  }

  /**
   * Retrieves existing or generates new correlation ID
   * @param request Express request object
   * @returns Correlation ID value for request tracing
   */
  private getCorrelationId(request: Request): string {
    // Extract correlation ID from request headers
    const existingCorrelationId = request.headers[CorrelationIdMiddleware.CORRELATION_ID_HEADER.toLowerCase()];

    // Return existing correlation ID if present, otherwise generate new UUID
    return (
      (typeof existingCorrelationId === 'string' ? existingCorrelationId : undefined) ||
      uuidv4()
    );
  }
}

// Export correlation ID header name for consistent request tracing
export const CORRELATION_ID_HEADER = CorrelationIdMiddleware.CORRELATION_ID_HEADER;