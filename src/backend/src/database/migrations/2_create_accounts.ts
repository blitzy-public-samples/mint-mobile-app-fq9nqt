// TypeORM v0.3.0
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create Accounts Table
 * 
 * Human Tasks:
 * 1. Ensure PostgreSQL pgcrypto extension is available for field-level encryption
 * 2. Configure encryption keys in environment variables for sensitive data
 * 3. Set up appropriate database backup policies for financial data
 * 4. Review and adjust column size limits based on financial institution requirements
 * 5. Verify currency codes list matches supported financial institutions
 * 
 * Requirements addressed:
 * - Financial Account Integration (Technical Specification/1.2 Scope/Core Features)
 * - Data Security (Technical Specification/9.2.2 Data Classification)
 * - Account Management (Technical Specification/5.2.3 Service Layer Architecture)
 */
export class CreateAccounts1234567890124 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable required extensions
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

        // Create accounts table with comprehensive security and financial tracking features
        await queryRunner.query(`
            CREATE TABLE "accounts" (
                -- Primary identification
                "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                
                -- User relationship
                "userId" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
                
                -- Financial institution details
                "institutionId" VARCHAR(50) NOT NULL,
                "accountType" VARCHAR(20) NOT NULL,
                
                -- Encrypted sensitive financial data
                "accountNumber" TEXT NOT NULL,
                "routingNumber" TEXT NOT NULL,
                
                -- Financial tracking
                "balance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
                "name" VARCHAR(100) NOT NULL,
                
                -- Plaid integration
                "plaidAccessToken" TEXT,
                "plaidItemId" VARCHAR(100),
                
                -- Account status
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "lastSyncedAt" TIMESTAMP WITH TIME ZONE,
                
                -- Timestamps
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

                -- Constraints
                CONSTRAINT "accounts_currency_check" CHECK (currency ~ '^[A-Z]{3}$'),
                CONSTRAINT "accounts_balance_check" CHECK (balance >= 0),
                CONSTRAINT "accounts_account_type_check" CHECK (
                    accountType IN (
                        'checking',
                        'savings',
                        'credit',
                        'investment',
                        'loan',
                        'mortgage',
                        'retirement'
                    )
                ),
                CONSTRAINT "accounts_plaid_item_unique" UNIQUE ("plaidItemId")
            )
        `);

        // Create encryption function for sensitive data
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION encrypt_sensitive_data() 
            RETURNS TRIGGER AS $$
            BEGIN
                -- Encrypt sensitive fields using AES-256-CBC
                NEW.accountNumber = ENCODE(
                    ENCRYPT_IV(
                        CAST(NEW.accountNumber AS BYTEA),
                        CAST(current_setting('app.encryption_key') AS BYTEA),
                        CAST(current_setting('app.encryption_iv') AS BYTEA),
                        'aes'
                    ),
                    'hex'
                );
                
                NEW.routingNumber = ENCODE(
                    ENCRYPT_IV(
                        CAST(NEW.routingNumber AS BYTEA),
                        CAST(current_setting('app.encryption_key') AS BYTEA),
                        CAST(current_setting('app.encryption_iv') AS BYTEA),
                        'aes'
                    ),
                    'hex'
                );
                
                IF NEW.plaidAccessToken IS NOT NULL THEN
                    NEW.plaidAccessToken = ENCODE(
                        ENCRYPT_IV(
                            CAST(NEW.plaidAccessToken AS BYTEA),
                            CAST(current_setting('app.encryption_key') AS BYTEA),
                            CAST(current_setting('app.encryption_iv') AS BYTEA),
                            'aes'
                        ),
                        'hex'
                    );
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create trigger for encrypting sensitive data
        await queryRunner.query(`
            CREATE TRIGGER encrypt_accounts_sensitive_data
            BEFORE INSERT OR UPDATE ON "accounts"
            FOR EACH ROW
            EXECUTE FUNCTION encrypt_sensitive_data();
        `);

        // Create trigger for updating updated_at timestamp
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_accounts_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updatedAt = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trigger_accounts_updated_at
            BEFORE UPDATE ON "accounts"
            FOR EACH ROW
            EXECUTE FUNCTION update_accounts_updated_at();
        `);

        // Create indices for optimized query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_ACCOUNTS_USER" ON "accounts" ("userId");
            CREATE INDEX "IDX_ACCOUNTS_INSTITUTION" ON "accounts" ("institutionId");
            CREATE INDEX "IDX_ACCOUNTS_PLAID_ITEM" ON "accounts" ("plaidItemId");
            CREATE INDEX "idx_accounts_type" ON "accounts" ("accountType");
            CREATE INDEX "idx_accounts_active_status" ON "accounts" ("isActive");
            CREATE INDEX "idx_accounts_last_synced" ON "accounts" ("lastSyncedAt");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers and functions
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS encrypt_accounts_sensitive_data ON "accounts";
            DROP FUNCTION IF EXISTS encrypt_sensitive_data();
            DROP TRIGGER IF EXISTS trigger_accounts_updated_at ON "accounts";
            DROP FUNCTION IF EXISTS update_accounts_updated_at();
        `);

        // Drop indices
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_accounts_last_synced";
            DROP INDEX IF EXISTS "idx_accounts_active_status";
            DROP INDEX IF EXISTS "idx_accounts_type";
            DROP INDEX IF EXISTS "IDX_ACCOUNTS_PLAID_ITEM";
            DROP INDEX IF EXISTS "IDX_ACCOUNTS_INSTITUTION";
            DROP INDEX IF EXISTS "IDX_ACCOUNTS_USER";
        `);

        // Drop the accounts table
        await queryRunner.query(`DROP TABLE IF EXISTS "accounts"`);
    }
}