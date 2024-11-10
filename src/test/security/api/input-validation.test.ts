// Library versions:
// @jest/globals: ^29.0.0
// @nestjs/common: ^9.0.0
// class-validator: ^0.14.0
// class-transformer: ^0.5.1

import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { ValidationPipe } from '../../../backend/src/common/pipes/validation.pipe';
import { LoginDto } from '../../../backend/src/modules/auth/dto/login.dto';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { TestApiClient } from '../../utils/api-client';

/**
 * Human Tasks:
 * 1. Configure test environment variables in .env.test
 * 2. Ensure test database is properly set up with required permissions
 * 3. Monitor and analyze test results for potential security vulnerabilities
 * 4. Review and update validation rules based on security requirements
 * 5. Configure error message translations if needed
 */

describe('API Input Validation Security Tests', () => {
  let testEnv: { api: TestApiClient };
  let validationPipe: ValidationPipe;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
    validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    });
  });

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  describe('testInputValidation', () => {
    // Requirement: Input Validation (Technical Specification/9.3.1 API Security)
    it('should reject payloads with missing required fields', async () => {
      const invalidPayload = {};
      const expectedErrors = {
        message: 'Validation failed',
        errors: [
          'Email is required',
          'Password is required'
        ]
      };

      await expect(testInputValidation('/auth/login', invalidPayload, expectedErrors))
        .resolves.not.toThrow();
    });

    // Requirement: Security Controls (Technical Specification/9.3.2 Security Monitoring)
    it('should reject payloads with invalid field types', async () => {
      const invalidPayload = {
        email: 123,
        password: true
      };
      const expectedErrors = {
        message: 'Validation failed',
        errors: [
          'Email must be a string',
          'Password must be a string'
        ]
      };

      await expect(testInputValidation('/auth/login', invalidPayload, expectedErrors))
        .resolves.not.toThrow();
    });

    // Requirement: API Security (Technical Specification/9.3 Security Protocols/9.3.1 API Security)
    it('should reject payloads with non-whitelisted properties', async () => {
      const invalidPayload = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        maliciousField: 'DROP TABLE users;'
      };
      const expectedErrors = {
        message: 'Validation failed',
        errors: ['Property maliciousField should not exist']
      };

      await expect(testInputValidation('/auth/login', invalidPayload, expectedErrors))
        .resolves.not.toThrow();
    });
  });

  describe('testLoginValidation', () => {
    // Requirement: Input Validation (Technical Specification/9.3.1 API Security)
    it('should validate email format correctly', async () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@domain.com',
        'test@domain',
        'test.domain.com'
      ];

      for (const email of invalidEmails) {
        await expect(testLoginValidation({
          email,
          password: 'ValidPass123!'
        })).rejects.toThrow(BadRequestException);
      }
    });

    // Requirement: Security Controls (Technical Specification/9.3.2 Security Monitoring)
    it('should enforce password complexity rules', async () => {
      const invalidPasswords = [
        'short',                  // Too short
        'nouppercase123!',       // No uppercase
        'NOLOWERCASE123!',       // No lowercase
        'NoSpecialChar123',      // No special characters
        'NoNumbers!',            // No numbers
        '   SpacesNotAllowed1!'  // Contains spaces
      ];

      for (const password of invalidPasswords) {
        await expect(testLoginValidation({
          email: 'test@example.com',
          password
        })).rejects.toThrow(BadRequestException);
      }
    });

    // Requirement: API Security (Technical Specification/9.3 Security Protocols/9.3.1 API Security)
    it('should validate password minimum length', async () => {
      const shortPassword = 'Short1!';
      await expect(testLoginValidation({
        email: 'test@example.com',
        password: shortPassword
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('testSanitization', () => {
    // Requirement: Input Validation (Technical Specification/9.3.1 API Security)
    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "; DROP TABLE users;--",
        "' UNION SELECT * FROM users--",
        "admin'--",
        "1' OR '1' = '1'"
      ];

      for (const payload of sqlInjectionPayloads) {
        await expect(testSanitization('/auth/login', {
          email: `test${payload}@example.com`,
          password: `password${payload}`
        })).resolves.not.toThrow();
      }
    });

    // Requirement: Security Controls (Technical Specification/9.3.2 Security Monitoring)
    it('should prevent XSS attempts', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '<svg onload="alert(\'xss\')">',
        '"><script>alert("xss")</script>'
      ];

      for (const payload of xssPayloads) {
        await expect(testSanitization('/auth/login', {
          email: `test+${payload}@example.com`,
          password: `password${payload}`
        })).resolves.not.toThrow();
      }
    });
  });
});

/**
 * Tests input validation for various API endpoints
 * @param endpoint API endpoint to test
 * @param payload Request payload
 * @param expectedErrors Expected validation errors
 */
async function testInputValidation(
  endpoint: string,
  payload: object,
  expectedErrors: { message: string; errors: string[] }
): Promise<void> {
  try {
    await testEnv.api.post(endpoint, payload);
    throw new Error('Validation should have failed');
  } catch (error) {
    if (error instanceof BadRequestException) {
      const errorResponse = error.getResponse() as any;
      expect(errorResponse.message).toBe(expectedErrors.message);
      expect(errorResponse.errors).toEqual(expect.arrayContaining(expectedErrors.errors));
    } else {
      throw error;
    }
  }
}

/**
 * Tests login validation rules
 * @param payload Login request payload
 */
async function testLoginValidation(payload: Partial<LoginDto>): Promise<void> {
  const metadata = {
    type: 'body',
    metatype: LoginDto
  };

  await validationPipe.transform(payload, metadata);
}

/**
 * Tests input sanitization for security
 * @param endpoint API endpoint to test
 * @param payload Request payload with potentially malicious content
 */
async function testSanitization(endpoint: string, payload: object): Promise<void> {
  const response = await testEnv.api.post(endpoint, payload);
  
  // Verify sanitized response
  if (response) {
    const stringified = JSON.stringify(response);
    expect(stringified).not.toMatch(/<script>/i);
    expect(stringified).not.toMatch(/javascript:/i);
    expect(stringified).not.toMatch(/onerror=/i);
    expect(stringified).not.toMatch(/onload=/i);
    expect(stringified).not.toMatch(/SELECT|INSERT|UPDATE|DELETE|DROP|UNION/i);
  }
}