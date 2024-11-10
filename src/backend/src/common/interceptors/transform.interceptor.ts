// @nestjs/common ^9.0.0
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
// rxjs ^7.0.0
import { Observable } from 'rxjs';
// rxjs/operators ^7.0.0
import { map } from 'rxjs/operators';

/**
 * Default HTTP success status code if not explicitly set
 */
const DEFAULT_STATUS_CODE = 200;

/**
 * Interface defining the standardized API response structure
 * that wraps all API responses
 */
interface Response<T> {
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

/**
 * Interceptor that transforms API responses into a standardized format
 * with consistent metadata and structure.
 * 
 * Addresses requirements:
 * - API Design (Technical Specification/8.3 API Design/8.3.1 REST API Endpoints):
 *   Ensures consistent response format across all API endpoints
 * - Data Architecture (Technical Specification/5.2.4 Data Architecture):
 *   Implements standardized data transformation layer
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  /**
   * Intercepts and transforms HTTP responses into the standardized format
   * @param context - The execution context
   * @param next - The call handler to process the request
   * @returns Observable stream of the transformed response with metadata
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    return next.handle().pipe(
      map(data => ({
        statusCode: context.switchToHttp().getResponse().statusCode || DEFAULT_STATUS_CODE,
        timestamp: new Date().toISOString(),
        path: path,
        data: data
      }))
    );
  }
}