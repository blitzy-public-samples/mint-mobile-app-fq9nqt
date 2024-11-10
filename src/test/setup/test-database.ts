// Third-party imports with versions
import { Connection, createConnection } from 'typeorm'; // ^0.3.x
import { Client } from 'pg'; // ^8.11.0
import * as dotenv from 'dotenv'; // ^16.0.0

// Internal imports
import { TestLogger } from '../utils/test-logger';
import { DbHelper } from '../utils/db-helper';

/**
 * Human Tasks Required:
 * 1. Configure test database credentials in .env.test file
 * 2. Ensure PostgreSQL server is running and accessible
 * 3. Grant necessary permissions to test database user
 * 4. Configure SSL certificates if TEST_DB_SSL is enabled
 * 5. Ensure all required migrations are available
 * 6. Verify database backup/restore permissions
 */

// Load environment variables
dotenv.config({ path: 'src/test/.env.test' });

// Global database configuration
export const TEST_DB_CONFIG = {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: Number(process.env.TEST_DB_PORT) || 5432,
    database: process.env.TEST_DB_NAME || 'mint_replica_test',
    username: process.env.TEST_DB_USER || 'test_user',
    password: process.env.TEST_DB_PASSWORD,
    synchronize: false,
    logging: process.env.TEST_DB_LOGGING === 'true',
    ssl: process.env.TEST_DB_SSL === 'true'
};

/**
 * @class TestDatabaseManager
 * @description Manages test database lifecycle including initialization, data seeding, and cleanup
 * Requirements addressed:
 * - Test Database Management (Technical Specification/8.2 Database Design/8.2.1 Schema Design)
 * - Data Security (Technical Specification/9.2 Data Security/9.2.2 Data Classification)
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 */
export class TestDatabaseManager {
    private connection: Connection | null;
    private logger: TestLogger;
    private dbHelper: DbHelper;

    constructor(config: typeof TEST_DB_CONFIG) {
        this.connection = null;
        this.logger = new TestLogger();
        this.dbHelper = new DbHelper(config);
    }

    /**
     * Establishes secure connection to test database with retry mechanism
     * @returns Database connection instance
     */
    public async connect(): Promise<Connection> {
        try {
            this.logger.logTestStart('Database Connection', { config: TEST_DB_CONFIG });

            // Create TypeORM connection with retry mechanism
            this.connection = await createConnection({
                type: 'postgres',
                ...TEST_DB_CONFIG,
                entities: ['src/**/entities/*.entity.ts'],
                migrations: ['src/database/migrations/*.ts'],
                maxQueryExecutionTime: 10000,
                retryAttempts: 3,
                retryDelay: 3000,
                extra: {
                    max: 20,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 5000
                }
            });

            // Verify connection and SSL if enabled
            if (TEST_DB_CONFIG.ssl) {
                await this.dbHelper.executeQuery('SHOW ssl');
            }

            this.logger.logTestEnd('Database Connection', { status: 'success' });
            return this.connection;
        } catch (error) {
            this.logger.logError(error as Error, 'Database Connection');
            throw error;
        }
    }

    /**
     * Safely closes test database connection with cleanup
     */
    public async disconnect(): Promise<void> {
        try {
            this.logger.logTestStart('Database Disconnection', {});

            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }

            this.logger.logTestEnd('Database Disconnection', { status: 'success' });
        } catch (error) {
            this.logger.logError(error as Error, 'Database Disconnection');
            throw error;
        }
    }

    /**
     * Executes database migrations for test schema with validation
     */
    public async runMigrations(): Promise<void> {
        try {
            this.logger.logTestStart('Database Migrations', {});

            if (!this.connection) {
                throw new Error('Database connection not established');
            }

            // Run pending migrations
            await this.connection.runMigrations({
                transaction: 'all'
            });

            // Verify schema integrity
            await this.dbHelper.executeQuery(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);

            this.logger.logTestEnd('Database Migrations', { status: 'success' });
        } catch (error) {
            this.logger.logError(error as Error, 'Database Migrations');
            throw error;
        }
    }

    /**
     * Seeds database with test data following security policies
     * @param seedData Test data object
     */
    public async seedTestData(seedData: Record<string, any[]>): Promise<void> {
        try {
            this.logger.logTestStart('Data Seeding', { seedData });

            if (!this.connection) {
                throw new Error('Database connection not established');
            }

            // Validate seed data structure
            if (!seedData || typeof seedData !== 'object') {
                throw new Error('Invalid seed data structure');
            }

            // Begin transaction
            await this.connection.query('BEGIN');

            try {
                // Insert data maintaining referential integrity
                for (const [table, data] of Object.entries(seedData)) {
                    if (Array.isArray(data)) {
                        await this.connection
                            .createQueryBuilder()
                            .insert()
                            .into(table)
                            .values(data)
                            .execute();
                    }
                }

                await this.connection.query('COMMIT');
                this.logger.logTestEnd('Data Seeding', { status: 'success' });
            } catch (error) {
                await this.connection.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            this.logger.logError(error as Error, 'Data Seeding');
            throw error;
        }
    }

    /**
     * Performs complete test database cleanup with verification
     */
    public async cleanup(): Promise<void> {
        try {
            this.logger.logTestStart('Database Cleanup', {});

            if (!this.connection) {
                throw new Error('Database connection not established');
            }

            // Disable foreign key constraints
            await this.connection.query('SET CONSTRAINTS ALL DEFERRED');

            // Get all tables
            const tables = await this.connection.query(`
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
            `);

            // Truncate all tables in reverse order
            for (const { tablename } of tables.reverse()) {
                await this.connection.query(`TRUNCATE TABLE "${tablename}" CASCADE`);
            }

            // Reset sequences
            const sequences = await this.connection.query(`
                SELECT sequence_name 
                FROM information_schema.sequences 
                WHERE sequence_schema = 'public'
            `);

            for (const { sequence_name } of sequences) {
                await this.connection.query(`ALTER SEQUENCE "${sequence_name}" RESTART WITH 1`);
            }

            // Re-enable constraints
            await this.connection.query('SET CONSTRAINTS ALL IMMEDIATE');

            this.logger.logTestEnd('Database Cleanup', { status: 'success' });
        } catch (error) {
            this.logger.logError(error as Error, 'Database Cleanup');
            throw error;
        }
    }

    /**
     * Creates verified database snapshot for test isolation
     * @param snapshotName Snapshot identifier
     */
    public async createSnapshot(snapshotName: string): Promise<void> {
        try {
            this.logger.logTestStart('Create Snapshot', { snapshotName });

            if (!this.connection) {
                throw new Error('Database connection not established');
            }

            // Create snapshot using DbHelper
            await this.dbHelper.createSnapshot(snapshotName);

            // Verify snapshot
            const result = await this.connection.query(`
                SELECT state_name 
                FROM pg_prepared_xacts 
                WHERE gid = $1
            `, [snapshotName]);

            if (!result.length) {
                throw new Error('Snapshot creation failed');
            }

            this.logger.logTestEnd('Create Snapshot', { status: 'success' });
        } catch (error) {
            this.logger.logError(error as Error, 'Create Snapshot');
            throw error;
        }
    }

    /**
     * Restores database from verified snapshot
     * @param snapshotName Snapshot identifier
     */
    public async restoreSnapshot(snapshotName: string): Promise<void> {
        try {
            this.logger.logTestStart('Restore Snapshot', { snapshotName });

            if (!this.connection) {
                throw new Error('Database connection not established');
            }

            // Verify snapshot exists
            const snapshot = await this.connection.query(`
                SELECT state_name 
                FROM pg_prepared_xacts 
                WHERE gid = $1
            `, [snapshotName]);

            if (!snapshot.length) {
                throw new Error(`Snapshot ${snapshotName} not found`);
            }

            // Restore snapshot using DbHelper
            await this.dbHelper.restoreSnapshot(snapshotName);

            this.logger.logTestEnd('Restore Snapshot', { status: 'success' });
        } catch (error) {
            this.logger.logError(error as Error, 'Restore Snapshot');
            throw error;
        }
    }
}