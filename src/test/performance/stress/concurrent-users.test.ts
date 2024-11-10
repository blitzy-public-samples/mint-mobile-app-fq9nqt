// Third-party imports with versions
import { describe, test, beforeAll, afterAll, expect } from '@jest/globals'; // ^29.0.0
import { check, sleep } from 'k6'; // ^0.42.0
import { Options } from 'k6/options';
import http from 'k6/http';

// Internal imports
import { TestApiClient } from '../../utils/api-client';
import { TestLogger } from '../../utils/test-logger';
import { setupTestEnvironment } from '../../utils/test-helpers';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Ensure k6 is installed and properly configured
 * 3. Set up test database with sufficient capacity for concurrent load
 * 4. Configure test API endpoints and rate limiting parameters
 * 5. Set up monitoring tools for resource utilization tracking
 */

// Global test configuration
const MAX_VIRTUAL_USERS = 1000;
const RAMP_UP_DURATION = 60;
const STEADY_STATE_DURATION = 300;
const RAMP_DOWN_DURATION = 60;

// Performance thresholds
const RESPONSE_TIME_P95 = 2000; // 95th percentile response time in ms
const ERROR_RATE_THRESHOLD = 0.01; // 1% error rate threshold
const REQUESTS_PER_SECOND = 100;

/**
 * k6 test options configuration
 * Requirements addressed:
 * - Performance Testing (Technical Specification/9.3.2 Security Monitoring/Performance Testing)
 * - Scalability Testing (Technical Specification/5.5 Scalability Architecture/5.5.1 Horizontal Scaling)
 */
export const options: Options = {
    stages: [
        { duration: `${RAMP_UP_DURATION}s`, target: MAX_VIRTUAL_USERS }, // Ramp up
        { duration: `${STEADY_STATE_DURATION}s`, target: MAX_VIRTUAL_USERS }, // Steady state
        { duration: `${RAMP_DOWN_DURATION}s`, target: 0 } // Ramp down
    ],
    thresholds: {
        'http_req_duration{type:API}': [
            { threshold: `p(95)<${RESPONSE_TIME_P95}`, abortOnFail: true },
        ],
        'http_req_failed{type:API}': [
            { threshold: `rate<${ERROR_RATE_THRESHOLD}`, abortOnFail: true },
        ],
        'http_reqs{type:API}': [
            { threshold: `rate>=${REQUESTS_PER_SECOND}`, abortOnFail: true },
        ]
    },
    noConnectionReuse: true,
    userAgent: 'MintReplicaLite-StressTest/1.0'
};

// Initialize test logger
const logger = new TestLogger();

/**
 * Sets up test data and environment for concurrent user testing
 * @param userCount Number of concurrent users to simulate
 * @returns Array of configured API clients
 */
async function setupConcurrentUsers(userCount: number): Promise<Array<TestApiClient>> {
    try {
        logger.logTestStart('Setup Concurrent Users', { userCount });

        const environment = await setupTestEnvironment();
        const apiClients: TestApiClient[] = [];

        // Create and configure API clients for each simulated user
        for (let i = 0; i < userCount; i++) {
            const client = new TestApiClient({
                baseURL: process.env.TEST_API_URL,
                timeout: 30000,
                headers: {
                    'X-Test-User-ID': `stress-test-user-${i}`,
                    'X-Test-Session-ID': `session-${Date.now()}-${i}`
                }
            });

            // Set up authentication for each client
            const authToken = await environment.auth.token;
            client.setAuthToken(authToken);
            apiClients.push(client);
        }

        logger.logTestEnd('Setup Concurrent Users', { status: 'success', clientCount: apiClients.length });
        return apiClients;
    } catch (error) {
        logger.logError(error as Error, 'Setup Concurrent Users Failed');
        throw error;
    }
}

/**
 * Executes concurrent operations across multiple simulated users
 * @param apiClients Array of configured API clients
 * @param operationConfig Operation configuration parameters
 * @returns Performance metrics
 */
async function simulateConcurrentOperations(
    apiClients: Array<TestApiClient>,
    operationConfig: {
        endpoints: string[];
        methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
        payloadSizes: number[];
        requestDistribution: { [key: string]: number };
    }
): Promise<object> {
    try {
        logger.logTestStart('Simulate Concurrent Operations', { clientCount: apiClients.length, operationConfig });

        const metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: [] as number[],
            errors: [] as Error[],
            throughput: 0
        };

        const startTime = Date.now();

        // Execute operations for each virtual user
        const operations = apiClients.map(async (client, index) => {
            const userMetrics = {
                requests: 0,
                successes: 0,
                failures: 0,
                times: [] as number[]
            };

            try {
                // Distribute requests across endpoints based on configuration
                for (const endpoint of operationConfig.endpoints) {
                    const method = operationConfig.methods[index % operationConfig.methods.length];
                    const payloadSize = operationConfig.payloadSizes[index % operationConfig.payloadSizes.length];

                    const requestStart = Date.now();
                    try {
                        switch (method) {
                            case 'GET':
                                await client.get(endpoint);
                                break;
                            case 'POST':
                                await client.post(endpoint, { data: 'x'.repeat(payloadSize) });
                                break;
                            case 'PUT':
                                await client.put(endpoint, { data: 'x'.repeat(payloadSize) });
                                break;
                            case 'DELETE':
                                await client.delete(endpoint);
                                break;
                        }

                        userMetrics.successes++;
                        userMetrics.times.push(Date.now() - requestStart);
                    } catch (error) {
                        userMetrics.failures++;
                        metrics.errors.push(error as Error);
                    }

                    userMetrics.requests++;
                }
            } catch (error) {
                logger.logError(error as Error, `Virtual User ${index} Failed`);
            }

            return userMetrics;
        });

        // Collect and aggregate metrics
        const results = await Promise.all(operations);
        const totalDuration = (Date.now() - startTime) / 1000; // in seconds

        results.forEach(result => {
            metrics.totalRequests += result.requests;
            metrics.successfulRequests += result.successes;
            metrics.failedRequests += result.failures;
            metrics.responseTimes.push(...result.times);
        });

        metrics.throughput = metrics.totalRequests / totalDuration;

        logger.logTestEnd('Simulate Concurrent Operations', {
            status: 'completed',
            metrics: {
                totalRequests: metrics.totalRequests,
                successRate: metrics.successfulRequests / metrics.totalRequests,
                errorRate: metrics.failedRequests / metrics.totalRequests,
                averageResponseTime: metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length,
                throughput: metrics.throughput
            }
        });

        return metrics;
    } catch (error) {
        logger.logError(error as Error, 'Simulate Concurrent Operations Failed');
        throw error;
    }
}

/**
 * Measures and records API response times under load
 * @param responses Array of response time measurements
 * @returns Response time statistics
 */
function measureResponseTimes(responses: number[]): object {
    try {
        logger.logTestStart('Measure Response Times', { sampleSize: responses.length });

        const sorted = [...responses].sort((a, b) => a - b);
        const total = responses.reduce((sum, time) => sum + time, 0);

        const stats = {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: total / responses.length,
            p50: sorted[Math.floor(sorted.length * 0.5)],
            p90: sorted[Math.floor(sorted.length * 0.9)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            standardDeviation: Math.sqrt(
                responses.reduce((sq, time) => sq + Math.pow(time - (total / responses.length), 2), 0) 
                / responses.length
            )
        };

        logger.logTestEnd('Measure Response Times', { status: 'completed', stats });
        return stats;
    } catch (error) {
        logger.logError(error as Error, 'Measure Response Times Failed');
        throw error;
    }
}

describe('Concurrent Users Stress Test', () => {
    let apiClients: TestApiClient[];

    beforeAll(async () => {
        apiClients = await setupConcurrentUsers(MAX_VIRTUAL_USERS);
    });

    afterAll(async () => {
        // Cleanup resources
        logger.logTestStart('Cleanup', {});
        apiClients = [];
        logger.logTestEnd('Cleanup', { status: 'completed' });
    });

    test('should handle maximum concurrent users without degradation', async () => {
        const operationConfig = {
            endpoints: [
                '/api/accounts',
                '/api/transactions',
                '/api/budgets',
                '/api/investments'
            ],
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            payloadSizes: [100, 1000, 10000],
            requestDistribution: {
                '/api/accounts': 0.2,
                '/api/transactions': 0.4,
                '/api/budgets': 0.2,
                '/api/investments': 0.2
            }
        };

        const metrics = await simulateConcurrentOperations(apiClients, operationConfig);
        const responseTimeStats = measureResponseTimes((metrics as any).responseTimes);

        // Verify performance meets requirements
        expect((metrics as any).successfulRequests / (metrics as any).totalRequests).toBeGreaterThan(0.99);
        expect((responseTimeStats as any).p95).toBeLessThan(RESPONSE_TIME_P95);
        expect((metrics as any).throughput).toBeGreaterThanOrEqual(REQUESTS_PER_SECOND);
    });
});

// Export default function for k6
export default function() {
    const requests = http.batch([
        ['GET', 'http://localhost:3000/api/accounts'],
        ['GET', 'http://localhost:3000/api/transactions'],
        ['GET', 'http://localhost:3000/api/budgets'],
        ['GET', 'http://localhost:3000/api/investments']
    ]);

    check(requests, {
        'status is 200': (r) => r.status === 200,
        'response time OK': (r) => r.timings.duration < RESPONSE_TIME_P95
    });

    sleep(1);
}