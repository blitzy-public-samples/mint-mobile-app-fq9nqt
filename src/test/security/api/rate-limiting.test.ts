// Third-party imports with versions
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'; // ^29.0.0
import supertest from 'supertest'; // ^6.3.0

// Internal imports
import { TestApiClient } from '../../utils/api-client';
import { setupTestEnvironment, cleanupTestEnvironment, waitForCondition } from '../../utils/test-helpers';

/**
 * Human Tasks Required:
 * 1. Configure rate limiting thresholds in API Gateway/server configuration
 * 2. Set up test environment variables in .env.test
 * 3. Ensure test database has proper permissions
 * 4. Configure test timeouts if default is not suitable
 * 5. Set up monitoring for rate limit metrics collection
 */

// Test configuration
const TEST_TIMEOUT = 30000;
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const AUTH_RATE_LIMIT = 5; // Maximum auth requests per window
const API_RATE_LIMIT = 10; // Maximum API requests per window
const CONCURRENT_CLIENTS = 3;

/**
 * Rate limiting test suite
 * Requirements addressed:
 * - API Rate Limiting (Technical Specification/9.3.1 API Security/Security Controls)
 * - Security Testing (Technical Specification/9.3.2 Security Monitoring)
 */
describe('API Rate Limiting', () => {
    let testEnv: { api: TestApiClient; auth: { token: string } };
    let apiClient: TestApiClient;

    beforeAll(async () => {
        testEnv = await setupTestEnvironment({
            enableRateLimiting: true,
            rateLimitWindow: RATE_LIMIT_WINDOW,
            authRateLimit: AUTH_RATE_LIMIT,
            apiRateLimit: API_RATE_LIMIT
        });
        apiClient = testEnv.api;
    }, TEST_TIMEOUT);

    afterAll(async () => {
        await cleanupTestEnvironment(testEnv);
    });

    beforeEach(() => {
        // Reset rate limit counters between tests if needed
        apiClient.setAuthToken('');
    });

    /**
     * Tests rate limiting on authentication endpoints
     * Requirements addressed:
     * - API Rate Limiting (Technical Specification/9.3.1 API Security/Security Controls)
     */
    test('should enforce rate limits on authentication endpoints', async () => {
        const authEndpoint = '/api/v1/auth/login';
        const authPayload = {
            email: 'test@example.com',
            password: 'testPassword123!'
        };

        // Track rate limit headers
        let remainingRequests = AUTH_RATE_LIMIT;
        
        // Make requests up to the limit
        for (let i = 0; i < AUTH_RATE_LIMIT; i++) {
            const response = await apiClient.post(authEndpoint, authPayload);
            
            // Verify rate limit headers
            expect(response.headers['x-ratelimit-limit']).toBe(String(AUTH_RATE_LIMIT));
            expect(response.headers['x-ratelimit-remaining']).toBe(String(--remainingRequests));
            expect(response.headers['x-ratelimit-reset']).toBeDefined();
        }

        // Verify rate limit exceeded response
        try {
            await apiClient.post(authEndpoint, authPayload);
            fail('Should have thrown rate limit exceeded error');
        } catch (error) {
            expect(error.response.status).toBe(429);
            expect(error.response.headers['retry-after']).toBeDefined();
            expect(error.response.data.error).toBe('Too Many Requests');
        }

        // Wait for rate limit window to reset
        await waitForCondition(async () => {
            try {
                await apiClient.post(authEndpoint, authPayload);
                return true;
            } catch {
                return false;
            }
        }, RATE_LIMIT_WINDOW + 1000);

        // Verify requests succeed after reset
        const response = await apiClient.post(authEndpoint, authPayload);
        expect(response.headers['x-ratelimit-remaining']).toBe(String(AUTH_RATE_LIMIT - 1));
    }, TEST_TIMEOUT);

    /**
     * Tests rate limiting on transaction endpoints with authenticated requests
     * Requirements addressed:
     * - API Rate Limiting (Technical Specification/9.3.1 API Security/Security Controls)
     */
    test('should enforce rate limits on transaction endpoints', async () => {
        // Set up authenticated client
        apiClient.setAuthToken(testEnv.auth.token);
        const transactionEndpoint = '/api/v1/transactions';

        // Track rate limit headers
        let remainingRequests = API_RATE_LIMIT;

        // Make requests up to the limit
        for (let i = 0; i < API_RATE_LIMIT; i++) {
            const response = await apiClient.get(transactionEndpoint);
            
            // Verify rate limit headers
            expect(response.headers['x-ratelimit-limit']).toBe(String(API_RATE_LIMIT));
            expect(response.headers['x-ratelimit-remaining']).toBe(String(--remainingRequests));
            expect(response.headers['x-ratelimit-reset']).toBeDefined();
        }

        // Verify rate limit exceeded response
        try {
            await apiClient.get(transactionEndpoint);
            fail('Should have thrown rate limit exceeded error');
        } catch (error) {
            expect(error.response.status).toBe(429);
            expect(error.response.headers['retry-after']).toBeDefined();
            expect(error.response.data.error).toBe('Too Many Requests');
            expect(error.response.data.message).toContain('Rate limit exceeded');
        }

        // Wait for rate limit window to reset
        await waitForCondition(async () => {
            try {
                await apiClient.get(transactionEndpoint);
                return true;
            } catch {
                return false;
            }
        }, RATE_LIMIT_WINDOW + 1000);

        // Verify requests succeed after reset
        const response = await apiClient.get(transactionEndpoint);
        expect(response.headers['x-ratelimit-remaining']).toBe(String(API_RATE_LIMIT - 1));
    }, TEST_TIMEOUT);

    /**
     * Tests rate limiting under concurrent request load from multiple clients
     * Requirements addressed:
     * - API Rate Limiting (Technical Specification/9.3.1 API Security/Security Controls)
     */
    test('should enforce rate limits across concurrent clients', async () => {
        // Create multiple API clients
        const clients = Array.from({ length: CONCURRENT_CLIENTS }, () => new TestApiClient());
        const endpoint = '/api/v1/accounts';
        
        // Set up authenticated clients with different tokens
        await Promise.all(clients.map(async (client, index) => {
            const authResponse = await client.post('/api/v1/auth/login', {
                email: `test${index}@example.com`,
                password: 'testPassword123!'
            });
            client.setAuthToken(authResponse.data.token);
        }));

        // Execute concurrent requests from all clients
        const makeRequests = async (client: TestApiClient) => {
            const results = [];
            for (let i = 0; i < Math.ceil(API_RATE_LIMIT / CONCURRENT_CLIENTS); i++) {
                try {
                    const response = await client.get(endpoint);
                    results.push({ success: true, remaining: response.headers['x-ratelimit-remaining'] });
                } catch (error) {
                    results.push({ success: false, status: error.response?.status });
                }
            }
            return results;
        };

        // Run concurrent requests
        const results = await Promise.all(clients.map(client => makeRequests(client)));

        // Verify rate limiting was enforced across all clients
        results.forEach(clientResults => {
            const failedRequests = clientResults.filter(r => !r.success);
            expect(failedRequests.length).toBeGreaterThan(0);
            expect(failedRequests[0].status).toBe(429);
        });

        // Verify global rate limit is enforced
        const globalRateLimitExceeded = results.flat().some(
            r => !r.success && r.status === 429
        );
        expect(globalRateLimitExceeded).toBe(true);

        // Wait for rate limit window to reset
        await waitForCondition(async () => {
            try {
                await Promise.all(clients.map(client => client.get(endpoint)));
                return true;
            } catch {
                return false;
            }
        }, RATE_LIMIT_WINDOW + 1000);

        // Verify all clients can make requests after reset
        const resetResults = await Promise.all(
            clients.map(client => client.get(endpoint))
        );
        resetResults.forEach(response => {
            expect(response.headers['x-ratelimit-remaining']).toBeDefined();
            expect(Number(response.headers['x-ratelimit-remaining'])).toBeLessThan(API_RATE_LIMIT);
        });
    }, TEST_TIMEOUT);
});