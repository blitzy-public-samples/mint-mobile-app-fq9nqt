// Third-party imports with versions
import * as dotenv from 'dotenv'; // ^16.0.0
import { BeforeAll, AfterAll } from '@jest/globals'; // ^29.0.0
import Redis from 'ioredis'; // ^5.0.0

// Internal imports
import { TestDatabaseManager } from './test-database';
import { TestLogger } from '../utils/test-logger';

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test file
 * 2. Ensure Redis server is running and accessible
 * 3. Configure database credentials and permissions
 * 4. Set up SSL certificates if required
 * 5. Verify network access to all required services
 * 6. Configure test logging directory permissions
 */

// Load environment variables
dotenv.config({ path: 'src/test/.env.test' });

// Global environment configuration
export const TEST_ENV = process.env.TEST_ENV || 'test';
export const TEST_PORT = process.env.TEST_PORT || 4000;
export const TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:4000';
export const TEST_REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379';

/**
 * @class TestEnvironment
 * @description Manages the complete test environment lifecycle with secure isolation
 * Requirements addressed:
 * - Test Environment Setup (Technical Specification/A.1.1 Development Environment Setup)
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * - Security Testing (Technical Specification/9.3 Security Protocols/9.3.5 Secure Development)
 */
export class TestEnvironment {
    private dbManager: TestDatabaseManager;
    private redisClient: Redis;
    private logger: TestLogger;
    private config: Record<string, any>;

    constructor(config: Record<string, any>) {
        this.config = this.validateConfig(config);
        this.logger = new TestLogger();
        this.dbManager = new TestDatabaseManager(config.database);
        this.redisClient = new Redis(config.redis.url, {
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            showFriendlyErrorStack: true
        });
    }

    /**
     * Initializes all test environment components with proper security measures
     */
    public async initialize(): Promise<void> {
        try {
            this.logger.logTestStart('Environment Initialization', this.config);

            // Initialize database connection
            await this.dbManager.connect();
            await this.dbManager.runMigrations();

            // Verify Redis connection
            await this.redisClient.ping();

            // Clear any existing test data
            await this.cleanup();

            this.logger.logTestEnd('Environment Initialization', { status: 'success' });
        } catch (error) {
            this.logger.logError(error as Error, 'Environment Initialization');
            throw error;
        }
    }

    /**
     * Performs complete and secure cleanup of all test components
     */
    public async cleanup(): Promise<void> {
        try {
            this.logger.logTestStart('Environment Cleanup', {});

            // Clean database
            await this.dbManager.cleanup();

            // Clear Redis data
            await this.redisClient.flushdb();

            this.logger.logTestEnd('Environment Cleanup', { status: 'success' });
        } catch (error) {
            this.logger.logError(error as Error, 'Environment Cleanup');
            throw error;
        }
    }

    /**
     * Securely resets test environment to initial state
     */
    public async reset(): Promise<void> {
        try {
            this.logger.logTestStart('Environment Reset', {});

            await this.cleanup();
            await this.initialize();

            this.logger.logTestEnd('Environment Reset', { status: 'success' });
        } catch (error) {
            this.logger.logError(error as Error, 'Environment Reset');
            throw error;
        }
    }

    /**
     * Validates environment configuration
     */
    private validateConfig(config: Record<string, any>): Record<string, any> {
        const requiredFields = ['database', 'redis', 'api'];
        
        for (const field of requiredFields) {
            if (!config[field]) {
                throw new Error(`Missing required configuration: ${field}`);
            }
        }

        return config;
    }
}

/**
 * Global test environment instance
 */
let testEnvironment: TestEnvironment;

/**
 * Initializes the complete test environment with security measures
 * Requirements addressed:
 * - Secure Environment Setup (Technical Specification/9.3 Security Protocols)
 */
@BeforeAll()
export async function setupTestEnvironment(): Promise<void> {
    const config = getTestConfig();
    testEnvironment = new TestEnvironment(config);
    await testEnvironment.initialize();
}

/**
 * Safely tears down the test environment ensuring proper cleanup
 * Requirements addressed:
 * - Resource Management (Technical Specification/A.4 Development Standards Reference)
 */
@AfterAll()
export async function teardownTestEnvironment(): Promise<void> {
    if (testEnvironment) {
        await testEnvironment.cleanup();
    }
}

/**
 * Retrieves and validates test environment configuration
 * Requirements addressed:
 * - Security Configuration (Technical Specification/9.3.5 Secure Development)
 */
export function getTestConfig(): Record<string, any> {
    return {
        env: TEST_ENV,
        database: {
            host: process.env.TEST_DB_HOST || 'localhost',
            port: Number(process.env.TEST_DB_PORT) || 5432,
            database: process.env.TEST_DB_NAME || 'mint_replica_test',
            username: process.env.TEST_DB_USER || 'test_user',
            password: process.env.TEST_DB_PASSWORD,
            ssl: process.env.TEST_DB_SSL === 'true'
        },
        redis: {
            url: TEST_REDIS_URL,
            prefix: 'test:',
            ttl: 3600
        },
        api: {
            url: TEST_API_URL,
            port: TEST_PORT,
            timeout: 5000
        },
        security: {
            enableSSL: process.env.TEST_ENABLE_SSL === 'true',
            enableAuth: process.env.TEST_ENABLE_AUTH === 'true',
            jwtSecret: process.env.TEST_JWT_SECRET || 'test-secret'
        },
        logging: {
            level: process.env.TEST_LOG_LEVEL || 'info',
            file: process.env.TEST_LOG_FILE || 'test-execution.log'
        }
    };
}