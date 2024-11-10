/**
 * Human Tasks Required:
 * 1. Configure k6 and autocannon in package.json with specified versions
 * 2. Set up environment variables for load test configuration:
 *    - TEST_DURATION (default: '30s')
 *    - VIRTUAL_USERS (default: 50)
 *    - REQUEST_RATE (default: 100)
 *    - TEST_API_URL (default: 'http://localhost:3000')
 * 3. Ensure sufficient system resources for load testing
 * 4. Configure monitoring tools for metrics collection
 * 5. Set up proper network access and firewall rules
 */

// Third-party imports with versions
import { check, sleep } from 'k6'; // ^0.42.0
import { describe, expect, beforeAll, afterAll } from '@jest/globals'; // ^29.0.0
import autocannon from 'autocannon'; // ^7.10.0
import http from 'k6/http';

// Internal imports
import { TestEnvironment, initialize, cleanup } from '../../setup/test-environment';
import { TestApiClient } from '../../utils/api-client';
import { createMockTransaction, createMockUser } from '../../utils/mock-data';

// Load test configuration
const TEST_DURATION = process.env.TEST_DURATION || '30s';
const VIRTUAL_USERS = Number(process.env.VIRTUAL_USERS) || 50;
const REQUEST_RATE = Number(process.env.REQUEST_RATE) || 100;
const TARGET_URL = process.env.TEST_API_URL || 'http://localhost:3000';

// Performance thresholds
const THRESHOLDS = {
  http_req_duration: ['p(95)<500'], // 95% of requests should complete within 500ms
  http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  iterations: [`count>=${REQUEST_RATE}`] // Maintain minimum request rate
};

/**
 * Test context interface for load testing
 */
interface TestContext {
  user: any;
  transactions: any[];
  apiClient: TestApiClient;
}

/**
 * Sets up the load test environment with proper security measures
 * Requirements addressed:
 * - Performance Testing (Technical Specification/9.3.2 Security Monitoring/Security Events)
 */
@beforeAll()
export async function setupLoadTest(): Promise<TestContext> {
  // Initialize test environment
  await initialize();
  
  // Create test API client
  const apiClient = new TestApiClient({
    baseURL: TARGET_URL,
    timeout: 5000
  });

  // Create test user and authenticate
  const user = createMockUser();
  await apiClient.post('/auth/register', {
    email: user.email,
    password: 'TestPassword123!',
    firstName: user.firstName,
    lastName: user.lastName
  });

  const authResponse = await apiClient.post('/auth/login', {
    email: user.email,
    password: 'TestPassword123!'
  });
  apiClient.setAuthToken(authResponse.token);

  // Generate test transactions
  const transactions = Array.from({ length: 100 }, () => 
    createMockTransaction(user.id, user.id)
  );

  return { user, transactions, apiClient };
}

/**
 * Cleans up test data and environment after load tests
 * Requirements addressed:
 * - Resource Management (Technical Specification/8.4 Security Design)
 */
@afterAll()
export async function cleanupLoadTest(): Promise<void> {
  await cleanup();
}

/**
 * Executes k6 load test scenarios for transaction endpoints
 * Requirements addressed:
 * - Transaction Load Testing (Technical Specification/8.4.2 Data Encryption)
 */
export function runK6LoadTest(testContext: TestContext) {
  const { user, transactions, apiClient } = testContext;

  return {
    options: {
      vus: VIRTUAL_USERS,
      duration: TEST_DURATION,
      thresholds: THRESHOLDS
    },

    setup() {
      return { user, transactions, token: apiClient.getAuthToken() };
    },

    default(data: any) {
      // Create transaction
      const createResponse = http.post(
        `${TARGET_URL}/api/transactions`,
        JSON.stringify(transactions[Math.floor(Math.random() * transactions.length)]),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`
          }
        }
      );

      check(createResponse, {
        'transaction created successfully': (r) => r.status === 201
      });

      // Get transaction list
      const listResponse = http.get(
        `${TARGET_URL}/api/transactions?userId=${data.user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        }
      );

      check(listResponse, {
        'transaction list retrieved successfully': (r) => r.status === 200
      });

      sleep(1);
    }
  };
}

/**
 * Executes autocannon load test for transaction endpoints
 * Requirements addressed:
 * - Performance Testing (Technical Specification/9.3.2 Security Monitoring)
 */
export async function runAutocannonLoadTest(testContext: TestContext) {
  const { user, transactions, apiClient } = testContext;

  const instance = autocannon({
    url: TARGET_URL,
    connections: VIRTUAL_USERS,
    duration: parseInt(TEST_DURATION),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiClient.getAuthToken()}`
    },
    requests: [
      {
        method: 'POST',
        path: '/api/transactions',
        body: JSON.stringify(transactions[0]),
        onResponse: (status, body, context) => {
          expect(status).toBe(201);
        }
      },
      {
        method: 'GET',
        path: `/api/transactions?userId=${user.id}`,
        onResponse: (status, body, context) => {
          expect(status).toBe(200);
        }
      }
    ]
  });

  return new Promise((resolve) => {
    autocannon.track(instance, { renderProgressBar: true });
    instance.on('done', resolve);
  });
}

/**
 * Main load test execution function
 * Requirements addressed:
 * - Performance Testing (Technical Specification/9.3.2 Security Monitoring)
 * - Transaction Load Testing (Technical Specification/8.4.2 Data Encryption)
 */
export async function transactionLoadTest() {
  try {
    // Set up test context
    const testContext = await setupLoadTest();

    // Run k6 load test
    console.log('Starting k6 load test...');
    await runK6LoadTest(testContext);

    // Run autocannon load test
    console.log('Starting autocannon load test...');
    await runAutocannonLoadTest(testContext);

    // Clean up
    await cleanupLoadTest();
  } catch (error) {
    console.error('Load test failed:', error);
    throw error;
  }
}

// Execute load test if run directly
if (require.main === module) {
  transactionLoadTest().catch(console.error);
}