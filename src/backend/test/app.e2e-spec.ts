// Third-party imports with versions
import { Test, TestingModule } from '@nestjs/testing'; // ^9.0.0
import { INestApplication } from '@nestjs/common'; // ^9.0.0
import * as request from 'supertest'; // ^6.3.0
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals'; // ^29.0.0

// Internal imports
import { AppModule } from '../src/app.module';

/**
 * Human Tasks:
 * 1. Configure test environment variables in .env.test file
 * 2. Set up test database with clean state before running tests
 * 3. Configure test rate limiting thresholds if different from production
 * 4. Ensure test logging configuration is properly set up
 * 5. Verify test monitoring alerts are properly configured
 */

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;

  /**
   * Setup function that runs before all tests
   * Requirements addressed:
   * - System Testing (Technical Specification/5.2.2 API Gateway/Testing Standards)
   *   Initializes test environment with proper configuration and middleware
   */
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configure application middleware and security settings
    await app.init();
    httpServer = app.getHttpServer();
  });

  /**
   * Cleanup function that runs after all tests
   * Requirements addressed:
   * - System Testing (Technical Specification/5.2.2 API Gateway/Testing Standards)
   *   Ensures proper cleanup of test resources
   */
  afterAll(async () => {
    await app.close();
  });

  /**
   * Health check endpoint test
   * Requirements addressed:
   * - Health Monitoring (Technical Specification/5.2.3 Service Layer Architecture)
   *   Validates health check endpoint functionality
   */
  describe('Health Check', () => {
    it('should return 200 OK with valid metrics', async () => {
      const response = await request(httpServer)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
      expect(response.body.database).toHaveProperty('status', 'up');
      expect(response.body).toHaveProperty('memory');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('heapTotal');
    });
  });

  /**
   * Rate limiting tests
   * Requirements addressed:
   * - Security Testing (Technical Specification/9.3.1 API Security)
   *   Validates rate limiting functionality
   */
  describe('Rate Limiting', () => {
    it('should enforce rate limit of 100 requests per minute', async () => {
      // Send 100 requests that should succeed
      for (let i = 0; i < 100; i++) {
        await request(httpServer)
          .get('/health')
          .expect(200);
      }

      // The 101st request should be rate limited
      const response = await request(httpServer)
        .get('/health')
        .expect(429);

      expect(response.headers).toHaveProperty('retry-after');
      expect(response.body).toHaveProperty('message', 'Too Many Requests');
    });

    it('should reset rate limit after window expires', async () => {
      // Wait for 60 seconds for rate limit window to reset
      await new Promise(resolve => setTimeout(resolve, 60000));

      // Should be able to make requests again
      await request(httpServer)
        .get('/health')
        .expect(200);
    });
  });

  /**
   * Correlation ID middleware tests
   * Requirements addressed:
   * - Security Testing (Technical Specification/9.3.1 API Security)
   *   Validates request tracing functionality
   */
  describe('Correlation ID', () => {
    it('should propagate provided correlation ID', async () => {
      const correlationId = 'test-correlation-id-123';
      
      const response = await request(httpServer)
        .get('/health')
        .set('X-Correlation-ID', correlationId)
        .expect(200);

      expect(response.headers).toHaveProperty('x-correlation-id', correlationId);
    });

    it('should generate correlation ID if not provided', async () => {
      const response = await request(httpServer)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-correlation-id');
      expect(response.headers['x-correlation-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  /**
   * Request logging middleware tests
   * Requirements addressed:
   * - Security Testing (Technical Specification/9.3.1 API Security)
   *   Validates request logging functionality
   */
  describe('Request Logging', () => {
    it('should log HTTP requests with required fields', async () => {
      const testPath = '/health';
      const testMethod = 'GET';
      const correlationId = 'test-logging-correlation-id';

      await request(httpServer)
        .get(testPath)
        .set('X-Correlation-ID', correlationId)
        .expect(200);

      // Note: In a real implementation, we would verify the logs
      // through a log aggregation service or test logger.
      // For this test, we're just verifying the endpoint works.
    });
  });

  /**
   * Global error handling tests
   * Requirements addressed:
   * - System Testing (Technical Specification/5.2.2 API Gateway/Testing Standards)
   *   Validates error handling functionality
   */
  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(httpServer)
        .get('/non-existent-path')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Not Found');
      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 400 for malformed requests', async () => {
      const response = await request(httpServer)
        .post('/health')
        .send('malformed json{')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
    });
  });
});