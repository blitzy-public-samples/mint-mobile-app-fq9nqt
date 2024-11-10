// Third-party imports with versions
import { Connection } from 'typeorm'; // ^0.3.x
import { AxiosRequestConfig } from 'axios'; // ^1.3.0
import deepEqual from 'deep-equal'; // ^2.2.1

// Internal imports
import { TestLogger } from './test-logger';
import { createMockUser } from './mock-data';
import { generateTestToken } from './auth-helper';
import { initTestDatabase } from './db-helper';
import { TestApiClient } from './api-client';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test
 * 2. Ensure all test dependencies are installed with correct versions
 * 3. Set up test database with proper permissions
 * 4. Configure test API endpoints and authentication
 * 5. Set up logging directory with write permissions
 */

// Initialize test logger
const logger = new TestLogger({ logLevel: 'debug' });

/**
 * Sets up test environment with database, authentication and API client
 * Requirements addressed:
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * - Security Testing (Technical Specification/9.3 Security Protocols/9.3.2 Security Monitoring)
 * 
 * @param config Test environment configuration
 * @returns Test environment object with initialized components
 */
export async function setupTestEnvironment(config: any = {}): Promise<{
    db: Connection;
    api: TestApiClient;
    auth: { token: string };
}> {
    try {
        logger.logTestStart('Environment Setup', { config });

        // Initialize test database
        const db = await initTestDatabase({
            host: process.env.TEST_DB_HOST || 'localhost',
            port: Number(process.env.TEST_DB_PORT) || 5432,
            database: process.env.TEST_DB_NAME || 'mint_replica_test',
            username: process.env.TEST_DB_USER || 'test_user',
            password: process.env.TEST_DB_PASSWORD,
            ssl: process.env.TEST_DB_SSL === 'true'
        });

        // Create test user and generate token
        const { user } = await createMockUser();
        const token = generateTestToken({
            sub: user.id,
            email: user.email,
            roles: ['user']
        });

        // Initialize API client
        const apiConfig: AxiosRequestConfig = {
            baseURL: process.env.TEST_API_URL || 'http://localhost:3000',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const api = new TestApiClient(apiConfig);
        api.setAuthToken(token);

        logger.logTestEnd('Environment Setup', { status: 'success' });

        return { db, api, auth: { token } };
    } catch (error) {
        logger.logError(error as Error, 'Environment Setup Failed');
        throw error;
    }
}

/**
 * Cleans up test environment and resources
 * Requirements addressed:
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * - Test Data Management (Technical Specification/8. System Design/Testing Standards)
 * 
 * @param environment Test environment object
 */
export async function cleanupTestEnvironment(environment: {
    db: Connection;
    api: TestApiClient;
    auth: { token: string };
}): Promise<void> {
    try {
        logger.logTestStart('Environment Cleanup', {});

        // Close database connection
        if (environment.db) {
            await environment.db.close();
        }

        // Clear authentication
        if (environment.auth?.token) {
            // Invalidate token if needed
        }

        // Reset API client
        if (environment.api) {
            environment.api.setAuthToken('');
        }

        logger.logTestEnd('Environment Cleanup', { status: 'success' });
    } catch (error) {
        logger.logError(error as Error, 'Environment Cleanup Failed');
        throw error;
    }
}

/**
 * Creates a test context with common test utilities and helpers
 * Requirements addressed:
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * - Test Data Management (Technical Specification/8. System Design/Testing Standards)
 * 
 * @param options Test context options
 * @returns Test context object
 */
export function createTestContext(options: any = {}): {
    logger: TestLogger;
    utils: any;
} {
    try {
        logger.logTestStart('Context Creation', { options });

        const context = {
            logger: new TestLogger(options.logger),
            utils: {
                generateToken: generateTestToken,
                createMockUser: createMockUser,
                // Add other utility functions as needed
            }
        };

        logger.logTestEnd('Context Creation', { status: 'success' });
        return context;
    } catch (error) {
        logger.logError(error as Error, 'Context Creation Failed');
        throw error;
    }
}

/**
 * Waits for a condition to be met with timeout and interval options
 * Requirements addressed:
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * 
 * @param condition Condition function to evaluate
 * @param timeout Maximum wait time in milliseconds
 * @param interval Check interval in milliseconds
 * @returns Promise resolving to condition result
 */
export async function waitForCondition(
    condition: () => Promise<boolean> | boolean,
    timeout: number = 5000,
    interval: number = 100
): Promise<boolean> {
    try {
        logger.logTestStart('Wait For Condition', { timeout, interval });

        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const result = await condition();
            if (result) {
                logger.logTestEnd('Wait For Condition', { status: 'success', duration: Date.now() - startTime });
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }

        logger.logTestEnd('Wait For Condition', { status: 'timeout', duration: timeout });
        return false;
    } catch (error) {
        logger.logError(error as Error, 'Wait For Condition Failed');
        throw error;
    }
}

/**
 * Deep compares two objects for testing with detailed difference reporting
 * Requirements addressed:
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * - Test Data Management (Technical Specification/8. System Design/Testing Standards)
 * 
 * @param actual Actual object
 * @param expected Expected object
 * @param options Comparison options
 * @returns Comparison result object
 */
export function compareObjects(
    actual: any,
    expected: any,
    options: {
        strict?: boolean;
        ignoreKeys?: string[];
        customComparators?: { [key: string]: (a: any, b: any) => boolean };
    } = {}
): { 
    equal: boolean;
    differences: { path: string; actual: any; expected: any }[];
} {
    try {
        logger.logTestStart('Compare Objects', { options });

        const differences: { path: string; actual: any; expected: any }[] = [];
        const { strict = true, ignoreKeys = [], customComparators = {} } = options;

        function compare(a: any, b: any, path: string = ''): void {
            // Skip ignored keys
            if (ignoreKeys.some(key => path.endsWith(key))) {
                return;
            }

            // Use custom comparator if available for this path
            if (customComparators[path]) {
                if (!customComparators[path](a, b)) {
                    differences.push({ path, actual: a, expected: b });
                }
                return;
            }

            // Deep equality check
            if (!deepEqual(a, b, { strict })) {
                differences.push({ path, actual: a, expected: b });
            }

            // Recursively compare nested objects
            if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
                const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
                for (const key of keys) {
                    compare(a[key], b[key], path ? `${path}.${key}` : key);
                }
            }
        }

        compare(actual, expected);

        const result = {
            equal: differences.length === 0,
            differences
        };

        logger.logTestEnd('Compare Objects', { 
            status: result.equal ? 'equal' : 'different',
            differenceCount: differences.length
        });

        return result;
    } catch (error) {
        logger.logError(error as Error, 'Compare Objects Failed');
        throw error;
    }
}