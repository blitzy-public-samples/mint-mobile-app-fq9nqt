// Third-party imports with versions
import Redis from 'ioredis'; // ^5.0.0
import dotenv from 'dotenv'; // ^16.0.0

// Internal imports
import { TestLogger } from '../utils/test-logger';

/**
 * Human Tasks Required:
 * 1. Ensure Redis server is installed and running locally for tests
 * 2. Configure TEST_REDIS_URL in .env.test if different from default
 * 3. Configure TEST_REDIS_PREFIX in .env.test if different from default
 * 4. Configure TEST_REDIS_TTL in .env.test if different from default
 * 5. Ensure ioredis is added to package.json dependencies
 */

// Load environment variables
dotenv.config();

// Global configuration
export const TEST_REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379';
export const TEST_REDIS_PREFIX = process.env.TEST_REDIS_PREFIX || 'test:';
export const TEST_REDIS_TTL = parseInt(process.env.TEST_REDIS_TTL || '900', 10);

/**
 * @class TestRedis
 * @description Manages Redis instance for test environment with support for data isolation and automatic cleanup
 * Requirements addressed:
 * - Test Environment Setup (Technical Specification/7.3.1 Primary Databases)
 * - Caching Infrastructure (Technical Specification/5.2.3 Service Layer Architecture)
 * - Session Management (Technical Specification/9.1.3 Session Management)
 */
export class TestRedis {
    private client: Redis;
    private logger: TestLogger;
    private prefix: string;
    private ttl: number;

    /**
     * Initializes Redis test client with configuration and logging setup
     * @param config Configuration object for Redis test instance
     */
    constructor(config: { url?: string; prefix?: string; ttl?: number } = {}) {
        this.logger = new TestLogger();
        this.prefix = config.prefix || TEST_REDIS_PREFIX;
        this.ttl = config.ttl || TEST_REDIS_TTL;

        // Initialize Redis client with retry strategy
        this.client = new Redis(config.url || TEST_REDIS_URL, {
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            keyPrefix: this.prefix,
            commandTimeout: 5000,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 3
        });

        // Handle Redis client events
        this.client.on('error', (error: Error) => {
            this.logger.logError(error, 'Redis client error');
        });

        this.client.on('connect', () => {
            this.logger.logTestStart('Redis Connection', { url: config.url || TEST_REDIS_URL });
        });
    }

    /**
     * Establishes connection to Redis server with error handling
     * @returns Promise resolving to void on successful connection
     */
    public async connect(): Promise<void> {
        try {
            // Test connection and get server info
            const info = await this.client.info();
            
            this.logger.logTestStart('Redis Connection', {
                status: 'connected',
                info: info.split('\n')[0],
                prefix: this.prefix,
                ttl: this.ttl
            });
        } catch (error) {
            this.logger.logError(error as Error, 'Redis connection failed');
            throw error;
        }
    }

    /**
     * Safely closes Redis connection after cleanup
     * @returns Promise resolving to void after successful disconnection
     */
    public async disconnect(): Promise<void> {
        try {
            // Flush test data before disconnecting
            await this.flushTestData();
            
            // Quit Redis connection
            await this.client.quit();
            
            this.logger.logTestEnd('Redis Disconnection', {
                status: 'disconnected',
                prefix: this.prefix
            });
        } catch (error) {
            this.logger.logError(error as Error, 'Redis disconnection failed');
            throw error;
        }
    }

    /**
     * Removes all test-related data from Redis using prefix
     * @returns Promise resolving to void after successful cleanup
     */
    public async flushTestData(): Promise<void> {
        try {
            let cursor = '0';
            let deletedKeys = 0;

            // Scan and delete all keys with test prefix
            do {
                const [nextCursor, keys] = await this.client.scan(
                    cursor,
                    'MATCH',
                    `${this.prefix}*`,
                    'COUNT',
                    '100'
                );

                if (keys.length > 0) {
                    await this.client.del(...keys);
                    deletedKeys += keys.length;
                }

                cursor = nextCursor;
            } while (cursor !== '0');

            this.logger.logTestEnd('Redis Cleanup', {
                status: 'completed',
                keysDeleted: deletedKeys
            });
        } catch (error) {
            this.logger.logError(error as Error, 'Redis cleanup failed');
            throw error;
        }
    }
}

/**
 * Factory function to create and initialize Redis test client
 * @param config Configuration object for Redis test instance
 * @returns Promise resolving to configured and connected Redis test client
 */
export async function createTestRedisClient(
    config: { url?: string; prefix?: string; ttl?: number } = {}
): Promise<TestRedis> {
    try {
        const redis = new TestRedis(config);
        await redis.connect();
        return redis;
    } catch (error) {
        const logger = new TestLogger();
        logger.logError(error as Error, 'Failed to create Redis test client');
        throw error;
    }
}