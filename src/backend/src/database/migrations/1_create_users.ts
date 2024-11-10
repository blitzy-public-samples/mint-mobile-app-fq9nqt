// TypeORM v0.3.0
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create Users Table
 * 
 * Human Tasks:
 * 1. Ensure PostgreSQL UUID extension is available on the database
 * 2. Verify database user has necessary privileges to create extensions
 * 3. Review password hash length constraint if using different hashing algorithm
 * 4. Configure appropriate connection pool settings for high concurrency
 * 
 * Requirements addressed:
 * - User Authentication Schema (Technical Specification/9.1.1 Authentication Methods)
 * - Data Security (Technical Specification/9.2.1 Encryption Standards)
 * - User Management (Technical Specification/1.2 Scope/Core Features)
 */
export class CreateUsers1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension for generating UUIDs
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create users table with comprehensive security features
        await queryRunner.query(`
            CREATE TABLE "users" (
                -- Primary identification
                "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                
                -- Authentication fields
                "email" VARCHAR(255) NOT NULL,
                "password_hash" VARCHAR(60) NOT NULL,
                "first_name" VARCHAR(100) NOT NULL,
                "last_name" VARCHAR(100) NOT NULL,
                
                -- Account status
                "is_active" BOOLEAN NOT NULL DEFAULT true,
                "email_verified" BOOLEAN NOT NULL DEFAULT false,
                
                -- Contact information
                "phone_number" VARCHAR(20),
                
                -- Multi-factor authentication
                "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
                "mfa_secret" VARCHAR(32),
                
                -- Biometric authentication
                "biometric_enabled" BOOLEAN NOT NULL DEFAULT false,
                "biometric_data" JSONB,
                
                -- Security measures
                "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
                "account_locked_until" TIMESTAMP WITH TIME ZONE,
                "password_reset_token" VARCHAR(100),
                "password_reset_expires" TIMESTAMP WITH TIME ZONE,
                "last_password_change" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                
                -- Timestamps
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "last_login_at" TIMESTAMP WITH TIME ZONE,

                -- Constraints
                CONSTRAINT "users_email_check" CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
                CONSTRAINT "users_password_hash_check" CHECK (length(password_hash) >= 60),
                CONSTRAINT "users_phone_number_check" CHECK (phone_number IS NULL OR phone_number ~* '^\+?[1-9]\d{1,14}$')
            )
        `);

        // Create indices for performance optimization
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email");
            CREATE INDEX "idx_users_last_login" ON "users" ("last_login_at");
            CREATE INDEX "idx_users_password_reset" ON "users" ("password_reset_token") WHERE password_reset_token IS NOT NULL;
        `);

        // Create trigger for updating updated_at timestamp
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_users_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trigger_users_updated_at
                BEFORE UPDATE ON "users"
                FOR EACH ROW
                EXECUTE FUNCTION update_users_updated_at();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers first
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_users_updated_at ON "users";
            DROP FUNCTION IF EXISTS update_users_updated_at();
        `);

        // Drop indices
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_users_password_reset";
            DROP INDEX IF EXISTS "idx_users_last_login";
            DROP INDEX IF EXISTS "idx_users_email";
        `);

        // Drop the users table
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

        // Drop the UUID extension if no other tables are using it
        // Note: Commented out as other tables might depend on this extension
        // await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    }
}