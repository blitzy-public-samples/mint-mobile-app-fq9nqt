// TypeORM v0.3.0
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create Transactions Table
 * 
 * Human Tasks:
 * 1. Ensure PostgreSQL extensions (uuid-ossp, pgcrypto) are available
 * 2. Configure appropriate backup policies for financial transaction data
 * 3. Review and adjust transaction amount limits based on business requirements
 * 4. Verify transaction categories list matches business requirements
 * 5. Set up appropriate audit logging for transaction modifications
 * 
 * Requirements addressed:
 * - Transaction Tracking (Technical Specification/1.2 Scope/Core Features)
 * - Data Security (Technical Specification/9.2.2 Data Classification)
 * - Transaction Management (Technical Specification/5.2.3 Service Layer Architecture)
 */
export class CreateTransactions1234567890125 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create transactions table with comprehensive financial tracking features
        await queryRunner.query(`
            CREATE TABLE "transactions" (
                -- Primary identification
                "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                
                -- Relationships
                "userId" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
                "accountId" UUID NOT NULL REFERENCES "accounts" ("id") ON DELETE CASCADE,
                
                -- Transaction details
                "amount" DECIMAL(10,2) NOT NULL,
                "description" VARCHAR(255) NOT NULL,
                "category" VARCHAR(100) NOT NULL,
                "merchantName" VARCHAR(100),
                "transactionDate" TIMESTAMP WITH TIME ZONE NOT NULL,
                "type" VARCHAR(20) NOT NULL,
                "isPending" BOOLEAN NOT NULL DEFAULT false,
                "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
                
                -- External reference
                "plaidTransactionId" VARCHAR(100) UNIQUE,
                
                -- Additional data
                "metadata" JSONB,
                
                -- Timestamps
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

                -- Constraints
                CONSTRAINT "transactions_amount_check" CHECK (amount != 0),
                CONSTRAINT "transactions_currency_check" CHECK (currency ~ '^[A-Z]{3}$'),
                CONSTRAINT "transactions_type_check" CHECK (
                    type IN (
                        'debit',
                        'credit',
                        'transfer',
                        'payment',
                        'refund',
                        'fee',
                        'adjustment'
                    )
                ),
                CONSTRAINT "transactions_category_check" CHECK (
                    category IN (
                        'housing',
                        'transportation',
                        'food',
                        'utilities',
                        'insurance',
                        'healthcare',
                        'savings',
                        'entertainment',
                        'shopping',
                        'income',
                        'transfer',
                        'other'
                    )
                )
            )
        `);

        // Create trigger for updating updated_at timestamp
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_transactions_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updatedAt = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER trigger_transactions_updated_at
            BEFORE UPDATE ON "transactions"
            FOR EACH ROW
            EXECUTE FUNCTION update_transactions_updated_at();
        `);

        // Create audit logging trigger
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "transaction_audit_log" (
                "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                "transactionId" UUID NOT NULL,
                "action" VARCHAR(10) NOT NULL,
                "oldData" JSONB,
                "newData" JSONB,
                "userId" UUID,
                "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE OR REPLACE FUNCTION audit_transactions_changes()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'UPDATE' THEN
                    INSERT INTO "transaction_audit_log" ("transactionId", "action", "oldData", "newData", "userId")
                    VALUES (OLD.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NEW."userId");
                ELSIF TG_OP = 'DELETE' THEN
                    INSERT INTO "transaction_audit_log" ("transactionId", "action", "oldData", "userId")
                    VALUES (OLD.id, 'DELETE', row_to_json(OLD), OLD."userId");
                ELSIF TG_OP = 'INSERT' THEN
                    INSERT INTO "transaction_audit_log" ("transactionId", "action", "newData", "userId")
                    VALUES (NEW.id, 'INSERT', row_to_json(NEW), NEW."userId");
                END IF;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER audit_transactions
            AFTER INSERT OR UPDATE OR DELETE ON "transactions"
            FOR EACH ROW EXECUTE FUNCTION audit_transactions_changes();
        `);

        // Create indices for optimized query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_TRANSACTIONS_USER" ON "transactions" ("userId");
            CREATE INDEX "IDX_TRANSACTIONS_ACCOUNT" ON "transactions" ("accountId");
            CREATE INDEX "IDX_TRANSACTIONS_DATE" ON "transactions" ("transactionDate");
            CREATE INDEX "IDX_TRANSACTIONS_CATEGORY" ON "transactions" ("category");
            CREATE INDEX "IDX_TRANSACTIONS_PLAID" ON "transactions" ("plaidTransactionId");
            CREATE INDEX "idx_transactions_type" ON "transactions" ("type");
            CREATE INDEX "idx_transactions_pending" ON "transactions" ("isPending");
            CREATE INDEX "idx_transactions_merchant" ON "transactions" ("merchantName");
            CREATE INDEX "idx_transactions_amount" ON "transactions" ("amount");
        `);

        // Create materialized view for transaction analytics
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW transaction_summary AS
            SELECT
                "userId",
                "accountId",
                date_trunc('month', "transactionDate") as month,
                category,
                type,
                currency,
                COUNT(*) as transaction_count,
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_credits,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_debits
            FROM "transactions"
            GROUP BY "userId", "accountId", date_trunc('month', "transactionDate"), category, type, currency;

            CREATE UNIQUE INDEX idx_transaction_summary ON transaction_summary 
            ("userId", "accountId", month, category, type, currency);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop materialized view
        await queryRunner.query(`
            DROP MATERIALIZED VIEW IF EXISTS transaction_summary;
        `);

        // Drop audit trigger and function
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS audit_transactions ON "transactions";
            DROP FUNCTION IF EXISTS audit_transactions_changes();
            DROP TABLE IF EXISTS "transaction_audit_log";
        `);

        // Drop update timestamp trigger and function
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON "transactions";
            DROP FUNCTION IF EXISTS update_transactions_updated_at();
        `);

        // Drop indices
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_transactions_amount";
            DROP INDEX IF EXISTS "idx_transactions_merchant";
            DROP INDEX IF EXISTS "idx_transactions_pending";
            DROP INDEX IF EXISTS "idx_transactions_type";
            DROP INDEX IF EXISTS "IDX_TRANSACTIONS_PLAID";
            DROP INDEX IF EXISTS "IDX_TRANSACTIONS_CATEGORY";
            DROP INDEX IF EXISTS "IDX_TRANSACTIONS_DATE";
            DROP INDEX IF EXISTS "IDX_TRANSACTIONS_ACCOUNT";
            DROP INDEX IF EXISTS "IDX_TRANSACTIONS_USER";
        `);

        // Drop the transactions table
        await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    }
}