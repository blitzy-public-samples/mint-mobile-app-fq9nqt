// Third-party imports with versions
import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals'; // ^29.0.0
import request from 'supertest'; // ^6.3.0

// Internal imports
import { User } from '../src/modules/users/entities/user.entity';
import { CreateUserDto } from '../src/modules/users/dto/create-user.dto';
import { setupTestEnvironment, cleanupTestEnvironment } from '../../test/utils/test-helpers';

/**
 * Human Tasks:
 * 1. Configure test database with proper permissions and schema
 * 2. Set up test environment variables in .env.test
 * 3. Configure rate limiting settings for test environment
 * 4. Set up encryption keys for sensitive data testing
 * 5. Configure WAF rules for security testing
 */

describe('User Management E2E Tests', () => {
  let testEnv: { 
    api: any;
    db: any;
    auth: { token: string };
  };
  const API_URL = process.env.API_URL || 'http://localhost:3000';

  beforeAll(async () => {
    testEnv = await setupTestEnvironment({
      database: 'users_test_db',
      logging: true,
      timeout: 30000
    });
  });

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await testEnv.db.query('TRUNCATE TABLE users CASCADE');
  });

  describe('User Creation Tests', () => {
    /**
     * Requirements addressed:
     * - User Authentication (Technical Specification/9.1.1 Authentication Methods)
     * - Data Security (Technical Specification/9.2.1 Encryption Standards)
     * - API Security (Technical Specification/9.3.1 API Security)
     */
    it('should create a user with valid data', async () => {
      const userData: CreateUserDto = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(API_URL)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.firstName).toBe(userData.firstName);
      expect(response.body.lastName).toBe(userData.lastName);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject user creation with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(API_URL)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Password must be at least 12 characters long');
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecureP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      await request(API_URL)
        .post('/api/users')
        .send(userData)
        .expect(201);

      await request(API_URL)
        .post('/api/users')
        .send(userData)
        .expect(409);
    });

    it('should enforce rate limiting on registration attempts', async () => {
      const requests = Array(10).fill({
        email: 'test@example.com',
        password: 'SecureP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      });

      const responses = await Promise.all(
        requests.map(() => 
          request(API_URL)
            .post('/api/users')
            .send(requests[0])
        )
      );

      expect(responses.some(res => res.status === 429)).toBeTruthy();
    });
  });

  describe('User Retrieval Tests', () => {
    let testUser: User;

    beforeEach(async () => {
      // Create test user
      const response = await request(API_URL)
        .post('/api/users')
        .send({
          email: 'retrieve@example.com',
          password: 'SecureP@ssw0rd123',
          firstName: 'Jane',
          lastName: 'Doe'
        });
      testUser = response.body;
    });

    it('should retrieve user by ID with proper authentication', async () => {
      const response = await request(API_URL)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .expect(200);

      expect(response.body.id).toBe(testUser.id);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should prevent unauthorized user data access', async () => {
      await request(API_URL)
        .get(`/api/users/${testUser.id}`)
        .expect(401);
    });

    it('should handle non-existent user requests', async () => {
      await request(API_URL)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .expect(404);
    });

    it('should verify GDPR compliance in user data response', async () => {
      const response = await request(API_URL)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .expect(200);

      // Verify sensitive data handling
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('preferences');
      expect(response.body).toHaveProperty('lastLoginAt');
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('User Update Tests', () => {
    let testUser: User;

    beforeEach(async () => {
      const response = await request(API_URL)
        .post('/api/users')
        .send({
          email: 'update@example.com',
          password: 'SecureP@ssw0rd123',
          firstName: 'Update',
          lastName: 'Test'
        });
      testUser = response.body;
    });

    it('should update user data with valid changes', async () => {
      const updates = {
        firstName: 'UpdatedName',
        lastName: 'UpdatedLast'
      };

      const response = await request(API_URL)
        .patch(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(updates)
        .expect(200);

      expect(response.body.firstName).toBe(updates.firstName);
      expect(response.body.lastName).toBe(updates.lastName);
      expect(response.body.email).toBe(testUser.email);
    });

    it('should prevent unauthorized user updates', async () => {
      await request(API_URL)
        .patch(`/api/users/${testUser.id}`)
        .send({ firstName: 'Unauthorized' })
        .expect(401);
    });

    it('should handle concurrent update requests safely', async () => {
      const updates = Array(5).fill({
        firstName: 'Concurrent',
        lastName: 'Update'
      });

      const responses = await Promise.all(
        updates.map(() =>
          request(API_URL)
            .patch(`/api/users/${testUser.id}`)
            .set('Authorization', `Bearer ${testEnv.auth.token}`)
            .send(updates[0])
        )
      );

      expect(responses.every(res => [200, 409].includes(res.status))).toBeTruthy();
    });

    it('should validate password updates with security requirements', async () => {
      const update = {
        password: 'weak'
      };

      await request(API_URL)
        .patch(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send(update)
        .expect(400);
    });
  });

  describe('User Deletion Tests', () => {
    let testUser: User;

    beforeEach(async () => {
      const response = await request(API_URL)
        .post('/api/users')
        .send({
          email: 'delete@example.com',
          password: 'SecureP@ssw0rd123',
          firstName: 'Delete',
          lastName: 'Test'
        });
      testUser = response.body;
    });

    it('should soft delete user account', async () => {
      await request(API_URL)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .expect(200);

      const response = await request(API_URL)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });

    it('should prevent unauthorized deletion', async () => {
      await request(API_URL)
        .delete(`/api/users/${testUser.id}`)
        .expect(401);
    });

    it('should handle GDPR data removal requirements', async () => {
      await request(API_URL)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send({ gdprDelete: true })
        .expect(200);

      // Verify complete data removal
      const response = await request(API_URL)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .expect(404);

      expect(response.body.message).toContain('User not found');
    });

    it('should validate deletion confirmation requirements', async () => {
      await request(API_URL)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testEnv.auth.token}`)
        .send({ confirmation: false })
        .expect(400);
    });
  });
});