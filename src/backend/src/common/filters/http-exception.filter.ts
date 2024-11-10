import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as winston from 'winston'; // ^3.8.0

// Human Tasks:
// 1. Configure Winston logger transport settings in environment configuration
// 2. Set up error tracking integration (e.g., Sentry) if required
// 3. Configure log retention and rotation policies
// 4. Set up log aggregation service for centralized logging
// 5. Configure monitoring alerts for error thresholds

// Log levels mapping for different HTTP status codes
const LOG_LEVELS = {
  400: 'warn',
  401: 'warn',
  403: 'warn',
  404: 'warn',
  500: 'error'
};

// Interface for standardized error response
interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  error: string;
  details: object | null;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger: winston.Logger;

  constructor() {
    // Initialize Winston logger with configuration
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.errors({ stack: true }),
        winston.format.metadata()
      ),
      defaultMeta: { service: 'mint-replica-api' },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // File transport for production
        ...(process.env.NODE_ENV === 'production' ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          })
        ] : [])
      ]
    });
  }

  catch(exception: HttpException, host: ArgumentsHost): void {
    // Requirement: Error Handling Standards - Implements standardized error handling
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Extract correlation ID if available
    const correlationId = request.headers['x-correlation-id'] || 'unknown';

    // Create standardized error response
    const errorResponse = this.formatError(exception, request.url);

    // Determine log level based on status code
    const logLevel = LOG_LEVELS[status] || 'error';

    // Log error with appropriate severity and context
    this.logger.log({
      level: logLevel,
      message: exception.message,
      metadata: {
        correlationId,
        statusCode: status,
        path: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        requestId: request.headers['x-request-id'],
        stack: exception.stack,
        timestamp: new Date().toISOString()
      }
    });

    // Track error metrics if monitoring is enabled
    if (process.env.ENABLE_METRICS === 'true') {
      // Increment error counter by status code
      // Note: Implement actual metrics tracking based on monitoring solution
    }

    // Send formatted error response
    // Requirement: API Design - Ensures consistent error response format
    response
      .status(status)
      .json(errorResponse);
  }

  private formatError(exception: HttpException, path: string): ErrorResponse {
    const status = exception.getStatus();
    const response = exception.getResponse() as any;

    // Create standardized error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: path,
      message: typeof response === 'string' ? response : response.message || exception.message,
      error: typeof response === 'string' ? 'Bad Request' : response.error || exception.name,
      details: null
    };

    // Add detailed error information in development
    if (process.env.NODE_ENV !== 'production' && typeof response === 'object') {
      errorResponse.details = {
        ...response,
        stack: exception.stack
      };
    }

    // Sanitize error details to prevent sensitive data exposure
    if (errorResponse.details) {
      delete errorResponse.details['password'];
      delete errorResponse.details['token'];
      delete errorResponse.details['secret'];
    }

    return errorResponse;
  }
}