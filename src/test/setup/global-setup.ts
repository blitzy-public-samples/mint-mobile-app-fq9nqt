// Third-party imports with versions
import * as dotenv from 'dotenv'; // ^16.0.0
import { BeforeAll, AfterAll } from '@jest/globals'; // ^29.0.0

// Internal imports
import { TestEnvironment, initialize, cleanup } from './test-environment';
import { TestDatabaseManager } from './test-database';
import { TestRedis } from './test-redis';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test file
 * 2. Ensure Redis server is running and accessible
 * 3. Configure database credentials and permissions
 * 4. Set up SSL certificates if required
 * 5. Verify network access to all required services
 * 6. Configure test logging directory permissions
 */

// Load environment variables from .env.test
dotenv.config({ path: 'src/test/.env.test' });

// Global test environment configuration
export const TEST_ENV = process.env.TEST_ENV || 'test';
export const TEST_PORT = parseInt(process.env.TEST_PORT || '4000', 10);
export const TEST_DB_URL = process.env.TEST_DB_URL || 'postgresql://test_user:test_password@localhost:5432/mint_replica_test';
export const TEST_REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379';

/**
 * Jest global setup function that initializes the test environment with security measures
 * Requirements addressed:
 * - Test Environment Setup (Technical Specification/A.1.1 Development Environment Setup)
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * - Security Testing (Technical Specification/9.3 Security Protocols/9.3.5 Secure Development)
 */
export async function globalSetup(): Promise<void> {
    try {
        // Initialize test environment
        const testEnv = new TestEnvironment();
        await testEnv.initialize();

        // Initialize database connection
        const dbManager = new TestDatabaseManager({
            url: TEST_DB_URL,
            ssl: process.env.TEST_DB_SSL === 'true',
            logging: process.env.TEST_DB_LOGGING === 'true'
        });
        await dbManager.connect();
        await dbManager.runMigrations();

        // Initialize Redis test instance
        const redis = new TestRedis({
            url: TEST_REDIS_URL,
            prefix: 'test:',
            ttl: 3600
        });
        await redis.connect();

        // Set up global test configuration
        const config = setupTestConfig();
        global.__TEST_CONFIG__ = config;
        global.__TEST_ENV__ = testEnv;
        global.__TEST_DB__ = dbManager;
        global.__TEST_REDIS__ = redis;

        // Verify all components are properly initialized
        await verifyTestSetup();

    } catch (error) {
        console.error('Global setup failed:', error);
        throw error;
    }
}

/**
 * Jest global teardown function that safely cleans up the test environment
 * Requirements addressed:
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * - Security Testing (Technical Specification/9.3 Security Protocols/9.3.5 Secure Development)
 */
export async function globalTeardown(): Promise<void> {
    try {
        // Clean up test database
        if (global.__TEST_DB__) {
            await global.__TEST_DB__.cleanup();
            await global.__TEST_DB__.disconnect();
        }

        // Clean up Redis test instance
        if (global.__TEST_REDIS__) {
            await global.__TEST_REDIS__.flushTestData();
            await global.__TEST_REDIS__.disconnect();
        }

        // Clean up test environment
        if (global.__TEST_ENV__) {
            await global.__TEST_ENV__.cleanup();
        }

        // Clear sensitive environment variables
        delete global.__TEST_CONFIG__;
        delete global.__TEST_ENV__;
        delete global.__TEST_DB__;
        delete global.__TEST_REDIS__;

    } catch (error) {
        console.error('Global teardown failed:', error);
        throw error;
    }
}

/**
 * Sets up global test configuration with security measures
 * Requirements addressed:
 * - Security Testing (Technical Specification/9.3 Security Protocols/9.3.5 Secure Development)
 */
function setupTestConfig(): Record<string, any> {
    return {
        env: TEST_ENV,
        port: TEST_PORT,
        database: {
            url: TEST_DB_URL,
            ssl: process.env.TEST_DB_SSL === 'true',
            logging: process.env.TEST_DB_LOGGING === 'true',
            schema: 'public',
            maxConnections: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000
        },
        redis: {
            url: TEST_REDIS_URL,
            prefix: 'test:',
            ttl: 3600,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true
        },
        security: {
            jwtSecret: process.env.TEST_JWT_SECRET || 'test-secret',
            jwtExpiresIn: '1h',
            bcryptRounds: 10,
            enableSSL: process.env.TEST_ENABLE_SSL === 'true',
            corsOrigins: process.env.TEST_CORS_ORIGINS?.split(',') || ['http://localhost:3000']
        },
        logging: {
            level: process.env.TEST_LOG_LEVEL || 'info',
            file: process.env.TEST_LOG_FILE || 'test.log',
            format: 'json'
        },
        timeouts: {
            test: 5000,
            setup: 30000,
            teardown: 30000
        }
    };
}

/**
 * Verifies all test environment components are properly initialized
 * Requirements addressed:
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 */
async function verifyTestSetup(): Promise<void> {
    try {
        // Verify database connection
        if (!global.__TEST_DB__) {
            throw new Error('Database connection not initialized');
        }
        await global.__TEST_DB__.client.query('SELECT 1');

        // Verify Redis connection
        if (!global.__TEST_REDIS__) {
            throw new Error('Redis connection not initialized');
        }
        await global.__TEST_REDIS__.client.ping();

        // Verify test environment
        if (!global.__TEST_ENV__) {
            throw new Error('Test environment not initialized');
        }

        // Verify configuration
        if (!global.__TEST_CONFIG__) {
            throw new Error('Test configuration not initialized');
        }

    } catch (error) {
        console.error('Test setup verification failed:', error);
        throw error;
    }
}

// Export configuration for use in tests
export { setupTestConfig };