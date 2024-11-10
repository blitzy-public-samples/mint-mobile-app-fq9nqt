// @nestjs/common v9.0.0
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
// rxjs v7.0.0
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
// winston v3.8.0
import * as Winston from 'winston';
// @nestjs/config v9.0.0
import { ConfigService } from '@nestjs/config';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

/**
 * Human Tasks:
 * 1. Configure CloudWatch transport in production environment
 * 2. Set appropriate log retention periods in CloudWatch
 * 3. Configure log aggregation service alerts for error conditions
 * 4. Verify log sanitization patterns match security requirements
 */

// Environment-specific logging levels
const LOG_LEVELS = {
  development: 'debug',
  staging: 'info',
  production: 'warn'
};

// Fields to remove from request/response logging
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'api-key',
  'secret'
];

/**
 * Interceptor that provides comprehensive request/response logging with performance tracking
 * 
 * Requirements addressed:
 * - Security Monitoring (Technical Specification/9.3.2): Implements real-time access logging 
 *   through CloudWatch Logs
 * - Infrastructure Services (Technical Specification/5.2.3): Provides logging service integration 
 *   for request/response monitoring
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: Winston.Logger;
  private readonly environment: string;

  constructor(private configService: ConfigService) {
    this.environment = this.configService.get<string>('NODE_ENV', 'development');
    
    // Initialize Winston logger with JSON format and timestamp
    this.logger = Winston.createLogger({
      level: LOG_LEVELS[this.environment] || 'info',
      format: Winston.format.combine(
        Winston.format.timestamp(),
        Winston.format.json()
      ),
      transports: [
        new Winston.transports.Console({
          format: Winston.format.combine(
            Winston.format.colorize(),
            Winston.format.simple()
          )
        })
      ]
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = performance.now();
    const correlationId = request.headers[CORRELATION_ID_HEADER.toLowerCase()];

    // Log incoming request
    this.logRequest(request, correlationId);

    return next.handle().pipe(
      tap(response => {
        const duration = performance.now() - startTime;
        this.logResponse(response, correlationId, duration);
      }),
      catchError(error => {
        const duration = performance.now() - startTime;
        this.logger.error('Request processing failed', {
          error: {
            message: error.message,
            stack: error.stack,
            code: error.code
          },
          correlationId,
          duration: `${duration.toFixed(2)}ms`,
          request: {
            method: request.method,
            url: request.url
          }
        });
        throw error;
      })
    );
  }

  private logRequest(request: any, correlationId: string): void {
    const sanitizedHeaders = this.sanitizeData(request.headers);
    const sanitizedBody = this.sanitizeData(request.body);

    this.logger.info('Incoming request', {
      correlationId,
      request: {
        method: request.method,
        url: request.url,
        headers: sanitizedHeaders,
        body: sanitizedBody,
        ip: request.ip,
        userId: request.user?.id
      },
      timestamp: new Date().toISOString()
    });
  }

  private logResponse(response: any, correlationId: string, duration: number): void {
    const sanitizedResponse = this.sanitizeData(response);

    this.logger.info('Response sent', {
      correlationId,
      response: {
        statusCode: response?.statusCode || 200,
        body: sanitizedResponse
      },
      performance: {
        duration: `${duration.toFixed(2)}ms`
      },
      timestamp: new Date().toISOString()
    });
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    if (typeof data === 'object') {
      const sanitized = { ...data };
      for (const key of Object.keys(sanitized)) {
        if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }
      return sanitized;
    }

    return data;
  }
}