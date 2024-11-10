// Third-party imports with versions
import { check, sleep } from 'k6'; // ^0.42.0
import { Rate, Trend } from 'k6/metrics'; // ^0.42.0
import http from 'k6/http'; // ^0.42.0

// Internal imports
import { createTestUser, loginTestUser } from '../../utils/auth-helper';
import { TestLogger } from '../../utils/test-logger';
import { setupTestEnvironment } from '../../utils/test-helpers';

/**
 * Human Tasks:
 * 1. Configure k6 environment variables in .env.test
 * 2. Set up test database with required user tables
 * 3. Configure test API endpoints and authentication settings
 * 4. Ensure proper test data cleanup after load tests
 * 5. Configure monitoring tools for metrics collection
 */

// Custom metrics
const loginSuccess = new Rate('login_success');
const tokenRefreshSuccess = new Rate('token_refresh_success');
const registrationSuccess = new Rate('registration_success');
const authLatency = new Trend('auth_latency');
const tokenRefreshLatency = new Trend('token_refresh_latency');
const registrationLatency = new Trend('registration_latency');
const bcryptHashingTime = new Trend('bcrypt_hashing_time');
const jwtSigningTime = new Trend('jwt_signing_time');

// Initialize test logger
const logger = new TestLogger({ logLevel: 'info' });

/**
 * k6 test setup function
 * Requirements addressed:
 * - Authentication Load Testing (Technical Specification/9.1.1 Authentication Methods)
 * - Performance Testing (Technical Specification/8.4 Component Dependencies/Load Testing)
 */
export async function setup(): Promise<any> {
  logger.logTestStart('Auth Load Test Setup', {});

  try {
    // Set up test environment
    const env = await setupTestEnvironment();

    // Create test users for login tests
    const testUsers = [];
    for (let i = 0; i < 100; i++) {
      const { user, password } = await createTestUser({
        email: `test.user${i}@example.com`,
        firstName: `Test${i}`,
        lastName: 'User'
      });
      testUsers.push({ user, password });
    }

    // Configure k6 test parameters
    const testConfig = {
      baseUrl: process.env.TEST_API_URL || 'http://localhost:3000',
      users: testUsers,
      vus: 50, // Virtual users
      duration: '5m',
      iterations: 1000
    };

    logger.logTestEnd('Auth Load Test Setup', { status: 'success' });
    return { env, testConfig };
  } catch (error) {
    logger.logError(error as Error, 'Auth Load Test Setup Failed');
    throw error;
  }
}

/**
 * Main k6 test function
 * Requirements addressed:
 * - Session Management Load (Technical Specification/9.1.3 Session Management)
 * - Authentication Load Testing (Technical Specification/9.1.1 Authentication Methods)
 */
export default function(data: any): void {
  const { env, testConfig } = data;
  const baseUrl = testConfig.baseUrl;

  // Execute login load test
  const loginMetrics = loginLoadTest(testConfig.users);
  check(loginMetrics, {
    'login success rate > 95%': () => loginSuccess.value >= 0.95,
    'login latency p95 < 2s': () => authLatency.values.p(95) < 2000,
    'bcrypt hashing time p95 < 500ms': () => bcryptHashingTime.values.p(95) < 500
  });

  sleep(1);

  // Execute token refresh test
  const refreshMetrics = tokenRefreshLoadTest(loginMetrics.tokens);
  check(refreshMetrics, {
    'token refresh success rate > 98%': () => tokenRefreshSuccess.value >= 0.98,
    'token refresh latency p95 < 1s': () => tokenRefreshLatency.values.p(95) < 1000,
    'jwt signing time p95 < 100ms': () => jwtSigningTime.values.p(95) < 100
  });

  sleep(1);

  // Execute registration load test
  const registrationMetrics = registrationLoadTest(testConfig);
  check(registrationMetrics, {
    'registration success rate > 95%': () => registrationSuccess.value >= 0.95,
    'registration latency p95 < 3s': () => registrationLatency.values.p(95) < 3000
  });
}

/**
 * Tests concurrent user login performance
 * Requirements addressed:
 * - Authentication Load Testing (Technical Specification/9.1.1 Authentication Methods)
 * - Performance Testing (Technical Specification/8.4 Component Dependencies/Load Testing)
 */
function loginLoadTest(users: any[]): any {
  logger.logTestStart('Login Load Test', { userCount: users.length });

  const tokens = [];
  const startTime = Date.now();

  for (const { user, password } of users) {
    const loginStart = Date.now();
    
    const response = http.post('/auth/login', {
      email: user.email,
      password: password
    });

    // Record metrics
    const duration = Date.now() - loginStart;
    authLatency.add(duration);
    loginSuccess.add(response.status === 200);
    bcryptHashingTime.add(response.timings.waiting);

    if (response.status === 200) {
      tokens.push(response.json());
    }

    sleep(0.1); // Rate limiting
  }

  logger.logTestEnd('Login Load Test', {
    duration: Date.now() - startTime,
    successRate: loginSuccess.value
  });

  return { tokens };
}

/**
 * Tests token refresh performance under load
 * Requirements addressed:
 * - Session Management Load (Technical Specification/9.1.3 Session Management)
 * - Performance Testing (Technical Specification/8.4 Component Dependencies/Load Testing)
 */
function tokenRefreshLoadTest(tokens: any[]): any {
  logger.logTestStart('Token Refresh Load Test', { tokenCount: tokens.length });

  const refreshedTokens = [];
  const startTime = Date.now();

  for (const token of tokens) {
    const refreshStart = Date.now();
    
    const response = http.post('/auth/refresh', {
      refreshToken: token.refreshToken
    }, {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`
      }
    });

    // Record metrics
    const duration = Date.now() - refreshStart;
    tokenRefreshLatency.add(duration);
    tokenRefreshSuccess.add(response.status === 200);
    jwtSigningTime.add(response.timings.waiting);

    if (response.status === 200) {
      refreshedTokens.push(response.json());
    }

    sleep(0.1); // Rate limiting
  }

  logger.logTestEnd('Token Refresh Load Test', {
    duration: Date.now() - startTime,
    successRate: tokenRefreshSuccess.value
  });

  return { refreshedTokens };
}

/**
 * Tests user registration performance under load
 * Requirements addressed:
 * - Authentication Load Testing (Technical Specification/9.1.1 Authentication Methods)
 * - Performance Testing (Technical Specification/8.4 Component Dependencies/Load Testing)
 */
function registrationLoadTest(testConfig: any): any {
  logger.logTestStart('Registration Load Test', { iterations: testConfig.iterations });

  const registeredUsers = [];
  const startTime = Date.now();

  for (let i = 0; i < testConfig.iterations; i++) {
    const registrationStart = Date.now();
    
    const response = http.post('/auth/register', {
      email: `loadtest.user${Date.now()}${i}@example.com`,
      password: 'LoadTest123!',
      firstName: `LoadTest${i}`,
      lastName: 'User'
    });

    // Record metrics
    const duration = Date.now() - registrationStart;
    registrationLatency.add(duration);
    registrationSuccess.add(response.status === 201);
    bcryptHashingTime.add(response.timings.waiting);

    if (response.status === 201) {
      registeredUsers.push(response.json());
    }

    sleep(0.1); // Rate limiting
  }

  logger.logTestEnd('Registration Load Test', {
    duration: Date.now() - startTime,
    successRate: registrationSuccess.value
  });

  return { registeredUsers };
}