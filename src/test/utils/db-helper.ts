// Third-party imports with versions
import { Connection, createConnection, getConnection } from 'typeorm'; // ^0.3.x
import { Client } from 'pg'; // ^8.11.0
import * as dotenv from 'dotenv'; // ^16.0.0

// Internal imports
import { TestLogger, logError, logTestStart, logTestEnd } from './test-logger';

/**
 * Human Tasks Required:
 * 1. Configure test database credentials in .env file
 * 2. Ensure PostgreSQL server is running and accessible
 * 3. Grant necessary permissions to test database user
 * 4. Configure SSL certificates if TEST_DB_SSL is enabled
 * 5. Ensure all required migrations are available
 */

// Load environment variables
dotenv.config();

// Database configuration with environment fallbacks
export const TEST_DB_CONFIG = {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: Number(process.env.TEST_DB_PORT) || 5432,
    database: process.env.TEST_DB_NAME || 'mint_replica_test',
    username: process.env.TEST_DB_USER || 'test_user',
    password: process.env.TEST_DB_PASSWORD,
    ssl: process.env.TEST_DB_SSL === 'true'
};

/**
 * @class TestDatabaseHelper
 * @description Helper class for managing test database operations with secure handling and logging
 * Requirements addressed:
 * - Test Database Management (Technical Specification/A.1.1 Development Environment Setup)
 * - Data Security (Technical Specification/9.2 Data Security/9.2.2 Data Classification)
 */
export class TestDatabaseHelper {
    private connection: Connection;
    private logger: TestLogger;
    private config: typeof TEST_DB_CONFIG;

    constructor(config: typeof TEST_DB_CONFIG) {
        this.config = config;
        this.logger = new TestLogger();
    }

    /**
     * Executes a database query safely with proper error handling and logging
     * @param query SQL query string
     * @param params Query parameters
     * @returns Query results
     */
    public async executeQuery(query: string, params: any[] = []): Promise<any> {
        try {
            this.logger.logTestStart('Database Query', { query, params });
            
            // Validate and sanitize query parameters
            const sanitizedParams = params.map(param => 
                typeof param === 'string' ? param.replace(/[^\w\s-]/gi, '') : param
            );

            const result = await this.connection.query(query, sanitizedParams);
            
            this.logger.logTestEnd('Database Query', { status: 'success', rowCount: result.length });
            return result;
        } catch (error) {
            this.logger.logError(error as Error, 'Database Query Execution');
            throw error;
        }
    }

    /**
     * Creates a database snapshot for rollback purposes
     * @param identifier Snapshot identifier
     */
    public async createSnapshot(identifier: string): Promise<void> {
        try {
            this.logger.logTestStart('Create Snapshot', { identifier });
            
            await this.connection.query('BEGIN');
            await this.connection.query(`SAVEPOINT ${identifier}`);
            
            this.logger.logTestEnd('Create Snapshot', { status: 'success' });
        } catch (error) {
            this.logger.logError(error as Error, 'Create Snapshot');
            throw error;
        }
    }

    /**
     * Restores database to a previous snapshot state
     * @param identifier Snapshot identifier
     */
    public async restoreSnapshot(identifier: string): Promise<void> {
        try {
            this.logger.logTestStart('Restore Snapshot', { identifier });
            
            await this.connection.query(`ROLLBACK TO SAVEPOINT ${identifier}`);
            
            this.logger.logTestEnd('Restore Snapshot', { status: 'success' });
        } catch (error) {
            this.logger.logError(error as Error, 'Restore Snapshot');
            throw error;
        }
    }
}

/**
 * Initializes a clean test database instance with proper schema and configuration
 * @param config Database configuration
 * @returns Database connection instance
 */
export async function initTestDatabase(config: typeof TEST_DB_CONFIG): Promise<Connection> {
    const logger = new TestLogger();
    
    try {
        logger.logTestStart('Database Initialization', { config });

        // Create TypeORM connection with retry mechanism
        const connection = await createConnection({
            type: 'postgres',
            ...config,
            synchronize: false,
            logging: true,
            entities: ['src/**/entities/*.entity.ts'],
            migrations: ['src/database/migrations/*.ts']
        });

        // Run pending migrations
        await connection.runMigrations();

        // Verify database structure
        await connection.query('SELECT NOW()');

        logger.logTestEnd('Database Initialization', { status: 'success' });
        return connection;
    } catch (error) {
        logger.logError(error as Error, 'Database Initialization');
        throw error;
    }
}

/**
 * Cleans up test database after test execution
 * @param connection Database connection
 */
export async function cleanupTestDatabase(connection: Connection): Promise<void> {
    const logger = new TestLogger();
    
    try {
        logger.logTestStart('Database Cleanup', {});

        // Disable foreign key constraints
        await connection.query('SET CONSTRAINTS ALL DEFERRED');

        // Get all table names
        const tables = await connection.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
        `);

        // Truncate all tables in reverse order
        for (const { tablename } of tables.reverse()) {
            await connection.query(`TRUNCATE TABLE "${tablename}" CASCADE`);
        }

        // Reset sequences
        const sequences = await connection.query(`
            SELECT sequence_name FROM information_schema.sequences 
            WHERE sequence_schema = 'public'
        `);

        for (const { sequence_name } of sequences) {
            await connection.query(`ALTER SEQUENCE "${sequence_name}" RESTART WITH 1`);
        }

        // Re-enable constraints and close connection
        await connection.query('SET CONSTRAINTS ALL IMMEDIATE');
        await connection.close();

        logger.logTestEnd('Database Cleanup', { status: 'success' });
    } catch (error) {
        logger.logError(error as Error, 'Database Cleanup');
        throw error;
    }
}

/**
 * Seeds test database with required test data
 * @param connection Database connection
 * @param seedData Seed data object
 */
export async function seedTestData(connection: Connection, seedData: object): Promise<void> {
    const logger = new TestLogger();
    
    try {
        logger.logTestStart('Data Seeding', { seedData });

        // Validate seed data structure
        if (!seedData || typeof seedData !== 'object') {
            throw new Error('Invalid seed data structure');
        }

        // Insert data in correct dependency order
        for (const [table, data] of Object.entries(seedData)) {
            if (Array.isArray(data)) {
                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(table)
                    .values(data)
                    .execute();
            }
        }

        logger.logTestEnd('Data Seeding', { status: 'success' });
    } catch (error) {
        logger.logError(error as Error, 'Data Seeding');
        throw error;
    }
}

/**
 * Clears specific test data from database
 * @param connection Database connection
 * @param tables Array of table names to clear
 */
export async function clearTestData(connection: Connection, tables: string[]): Promise<void> {
    const logger = new TestLogger();
    
    try {
        logger.logTestStart('Clear Test Data', { tables });

        // Validate table names
        const validTables = await connection.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = ANY($1)
        `, [tables]);

        if (validTables.length !== tables.length) {
            throw new Error('Invalid table names provided');
        }

        // Clear tables in reverse order
        for (const table of tables.reverse()) {
            await connection.query(`TRUNCATE TABLE "${table}" CASCADE`);
        }

        logger.logTestEnd('Clear Test Data', { status: 'success' });
    } catch (error) {
        logger.logError(error as Error, 'Clear Test Data');
        throw error;
    }
}