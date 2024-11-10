// @nestjs/common v9.0.0
import { Injectable, NestMiddleware } from '@nestjs/common';
// express v4.18.0
import { Request, Response, NextFunction } from 'express';
// winston v3.8.0
import * as winston from 'winston';
import { CORRELATION_ID_HEADER } from './correlation-id.middleware';

/**
 * Human Tasks:
 * 1. Configure AWS CloudWatch credentials in environment variables
 * 2. Set up CloudWatch Log Groups and Streams for different environments
 * 3. Configure log retention policies in CloudWatch
 * 4. Set up CloudWatch Logs Insights queries for monitoring
 * 5. Configure log aggregation and alerting thresholds
 */

/**
 * Middleware that provides comprehensive request logging with performance tracking,
 * correlation ID integration, and security filtering for CloudWatch Logs.
 *
 * Requirements addressed:
 * - Security Monitoring (Technical Specification/9.3.2): Implements real-time access 
 *   logs through CloudWatch Logs for security monitoring with correlation tracking
 * - Infrastructure Services (Technical Specification/5.2.3): Provides logging service 
 *   integration for request monitoring and performance tracking
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger: winston.Logger;
  private readonly environment: string;

  // Constants for configuration
  private readonly LOG_LEVELS = {
    development: 'debug',
    staging: 'info',
    production: 'warn'
  };

  private readonly SENSITIVE_FIELDS = [
    'password',
    'token',
    'authorization',
    'api-key',
    'secret'
  ];

  private readonly REQUEST_TIMEOUT_MS = 30000;

  constructor(configService: any) {
    this.environment = configService.get('NODE_ENV') || 'development';

    // Initialize Winston logger with CloudWatch configuration
    this.logger = winston.createLogger({
      level: this.LOG_LEVELS[this.environment],
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        // Add CloudWatch transport for production environments
        ...(this.environment !== 'development' ? [
          new winston.transports.CloudWatch({
            logGroupName: `mint-replica/${this.environment}/api-logs`,
            logStreamName: `request-logs-${new Date().toISOString().split('T')[0]}`,
            awsRegion: configService.get('AWS_REGION'),
            messageFormatter: ({ level, message, ...meta }) => JSON.stringify({
              level,
              message,
              ...meta,
              service: 'api',
              environment: this.environment
            })
          })
        ] : [])
      ]
    });
  }

  /**
   * Processes and logs incoming HTTP requests with security filtering and performance tracking
   */
  use(request: Request, response: Response, next: NextFunction): void {
    const startTime = Date.now();
    const correlationId = request.headers[CORRELATION_ID_HEADER.toLowerCase()];

    // Log incoming request
    const sanitizedRequest = this.sanitizeRequest({
      method: request.method,
      url: request.url,
      headers: request.headers,
      query: request.query,
      body: request.body
    });

    this.logger.info(this.formatLogMessage({
      type: 'request',
      ...sanitizedRequest
    }, correlationId as string));

    // Monitor response
    response.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Log response with timing information
      this.logger.info(this.formatLogMessage({
        type: 'response',
        method: request.method,
        url: request.url,
        statusCode: response.statusCode,
        duration,
        size: parseInt(response.get('content-length') || '0', 10)
      }, correlationId as string));

      // Log warning for slow requests
      if (duration > this.REQUEST_TIMEOUT_MS) {
        this.logger.warn(this.formatLogMessage({
          type: 'performance_warning',
          message: 'Request exceeded timeout threshold',
          method: request.method,
          url: request.url,
          duration,
          threshold: this.REQUEST_TIMEOUT_MS
        }, correlationId as string));
      }
    });

    next();
  }

  /**
   * Removes sensitive information from request data for security
   */
  private sanitizeRequest(requestData: object): object {
    const sanitized = JSON.parse(JSON.stringify(requestData));

    const sanitizeObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        
        // Mask sensitive fields
        if (this.SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Formats request data for structured CloudWatch logging
   */
  private formatLogMessage(logData: object, correlationId: string): object {
    return {
      timestamp: new Date().toISOString(),
      correlationId,
      environment: this.environment,
      ...logData,
      metadata: {
        service: 'api',
        version: process.env.APP_VERSION || 'unknown',
        nodeEnv: this.environment
      }
    };
  }
}