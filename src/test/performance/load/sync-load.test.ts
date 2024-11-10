/**
 * Human Tasks Required:
 * 1. Configure k6 environment variables in .env.test
 * 2. Set up test API endpoints and authentication
 * 3. Configure test data volume thresholds
 * 4. Ensure test database has sufficient capacity
 * 5. Set up monitoring for test metrics collection
 */

// k6 imports v0.42.0
import { check, sleep } from 'k6';
import http from 'k6/http';

// Internal imports
import { setupTestEnvironment, cleanupTestEnvironment } from '../../utils/test-helpers';
import { createMockUser, createMockAccount, createMockTransaction } from '../../utils/mock-data';

// Test configuration options
export const options = {
  // Load test stages
  stages: [
    { duration: '1m', target: 20 },  // Ramp up to 20 users over 1 minute
    { duration: '3m', target: 100 }, // Ramp up to 100 users over 3 minutes
    { duration: '1m', target: 0 }    // Ramp down to 0 users over 1 minute
  ],
  // Performance thresholds
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_failed': ['rate<0.01']    // Less than 1% error rate
  }
};

/**
 * Test setup function - initializes test environment and data
 * Requirements addressed:
 * - Scalability Architecture (Technical Specification/5.5 Scalability Architecture)
 * - Real-time Data Synchronization (Technical Specification/1.1 System Overview/Core Components)
 */
export function setup() {
  // Initialize test environment
  const env = setupTestEnvironment();
  
  // Create test users with accounts and transactions
  const testData = {
    users: [],
    accounts: [],
    transactions: []
  };

  // Generate test data for multiple users
  for (let i = 0; i < 10; i++) {
    // Create mock user
    const user = createMockUser();
    testData.users.push(user);

    // Create 2-3 accounts per user
    const accountCount = Math.floor(Math.random() * 2) + 2;
    for (let j = 0; j < accountCount; j++) {
      const account = createMockAccount(user.id);
      testData.accounts.push(account);

      // Create 50-100 transactions per account
      const transactionCount = Math.floor(Math.random() * 51) + 50;
      for (let k = 0; k < transactionCount; k++) {
        const transaction = createMockTransaction(account.id, user.id);
        testData.transactions.push(transaction);
      }
    }
  }

  // Set up initial sync state
  const initialSyncState = {
    lastSyncTimestamp: new Date().toISOString(),
    dataVersion: '1.0',
    syncBatchSize: 100
  };

  return {
    testData,
    initialSyncState,
    apiBaseUrl: __ENV.API_BASE_URL || 'http://localhost:3000',
    authToken: env.auth.token
  };
}

/**
 * Main test scenario function
 * Requirements addressed:
 * - Performance Testing (Technical Specification/7.5 Development and Deployment Tools)
 * - Real-time Data Synchronization (Technical Specification/1.1 System Overview/Core Components)
 */
export default function(data) {
  // Prepare sync request payload
  const syncPayload = {
    userId: data.testData.users[Math.floor(Math.random() * data.testData.users.length)].id,
    lastSyncTimestamp: data.initialSyncState.lastSyncTimestamp,
    dataVersion: data.initialSyncState.dataVersion,
    batchSize: data.initialSyncState.syncBatchSize
  };

  // Set request headers
  const headers = {
    'Authorization': `Bearer ${data.authToken}`,
    'Content-Type': 'application/json'
  };

  // Execute sync request
  const response = http.post(
    `${data.apiBaseUrl}/api/v1/sync`,
    JSON.stringify(syncPayload),
    { headers }
  );

  // Verify response
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'sync completed successfully': (r) => r.json('status') === 'success',
    'data integrity verified': (r) => {
      const body = r.json();
      return body.syncedData && 
             Array.isArray(body.syncedData.transactions) &&
             body.syncedData.transactions.length > 0;
    }
  });

  // Add random sleep between requests (100ms - 1s)
  sleep(Math.random() * 0.9 + 0.1);
}

/**
 * Test teardown function
 * Requirements addressed:
 * - Performance Testing (Technical Specification/7.5 Development and Deployment Tools)
 */
export function teardown(data) {
  // Clean up test environment and data
  cleanupTestEnvironment({
    testData: data.testData,
    syncState: data.initialSyncState
  });

  // Log test completion metrics
  console.log('Load test completed:', {
    totalUsers: data.testData.users.length,
    totalAccounts: data.testData.accounts.length,
    totalTransactions: data.testData.transactions.length,
    syncBatchSize: data.initialSyncState.syncBatchSize
  });
}