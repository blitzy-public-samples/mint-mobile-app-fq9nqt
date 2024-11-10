// TypeORM version ^0.3.0
import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

/**
 * HUMAN TASKS:
 * 1. Ensure PostgreSQL version 14+ is installed and supports JSONB type
 * 2. Verify database user has necessary permissions for creating triggers and policies
 * 3. Configure database encryption keys in AWS KMS before running migration
 * 4. Update database backup policy to include new table
 */

export class CreateBudgets1234567890123 implements MigrationInterface {
    // Enum type names
    private readonly BUDGET_PERIOD_ENUM = 'budget_period_enum';
    private readonly BUDGET_STATUS_ENUM = 'budget_status_enum';
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create budget period enum type
        // Requirement: Budget Creation and Monitoring - Support for different budget periods
        await queryRunner.query(`
            CREATE TYPE ${this.BUDGET_PERIOD_ENUM} AS ENUM (
                'MONTHLY',
                'WEEKLY',
                'CUSTOM'
            );
        `);

        // Create budget status enum type
        await queryRunner.query(`
            CREATE TYPE ${this.BUDGET_STATUS_ENUM} AS ENUM (
                'ACTIVE',
                'COMPLETED',
                'ARCHIVED'
            );
        `);

        // Create budgets table with encryption and security controls
        // Requirement: Data Security - Implements secure storage with AES-256-GCM encryption
        await queryRunner.createTable(new Table({
            name: 'budgets',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    default: 'gen_random_uuid()', // Crypto-secure UUID generation
                    comment: 'Unique identifier for the budget'
                },
                {
                    name: 'user_id',
                    type: 'uuid',
                    isNullable: false,
                    comment: 'Reference to the user who owns this budget'
                },
                {
                    name: 'name',
                    type: 'text',
                    isNullable: false,
                    comment: 'Encrypted budget name'
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                    comment: 'Encrypted budget description'
                },
                {
                    name: 'period',
                    type: this.BUDGET_PERIOD_ENUM,
                    isNullable: false,
                    comment: 'Budget period type'
                },
                {
                    name: 'total_amount',
                    type: 'decimal',
                    precision: 20,
                    scale: 2,
                    isNullable: false,
                    comment: 'Encrypted total budget amount'
                },
                {
                    name: 'spent_amount',
                    type: 'decimal',
                    precision: 20,
                    scale: 2,
                    isNullable: false,
                    default: 0,
                    comment: 'Encrypted amount spent in this budget'
                },
                {
                    name: 'start_date',
                    type: 'timestamp with time zone',
                    isNullable: false,
                    comment: 'Budget start date'
                },
                {
                    name: 'end_date',
                    type: 'timestamp with time zone',
                    isNullable: false,
                    comment: 'Budget end date'
                },
                {
                    name: 'status',
                    type: this.BUDGET_STATUS_ENUM,
                    isNullable: false,
                    default: "'ACTIVE'",
                    comment: 'Current budget status'
                },
                {
                    name: 'categories',
                    type: 'jsonb',
                    isNullable: false,
                    comment: 'Encrypted budget categories and their allocations'
                },
                {
                    name: 'created_at',
                    type: 'timestamp with time zone',
                    default: 'CURRENT_TIMESTAMP',
                    isNullable: false,
                    comment: 'Timestamp of budget creation'
                },
                {
                    name: 'updated_at',
                    type: 'timestamp with time zone',
                    default: 'CURRENT_TIMESTAMP',
                    isNullable: false,
                    comment: 'Timestamp of last budget update'
                }
            ]
        }), true);

        // Create foreign key to users table
        await queryRunner.createForeignKey('budgets', new TableForeignKey({
            name: 'fk_budgets_user',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        }));

        // Create indices for query optimization
        await queryRunner.createIndex('budgets', new TableIndex({
            name: 'idx_budgets_user_period_status',
            columnNames: ['user_id', 'period', 'status'],
            isUnique: false
        }));

        await queryRunner.createIndex('budgets', new TableIndex({
            name: 'idx_budgets_spent_amount',
            columnNames: ['spent_amount'],
            isUnique: false
        }));

        // Add check constraints for amount validations
        await queryRunner.query(`
            ALTER TABLE budgets
            ADD CONSTRAINT chk_budgets_total_amount_positive
            CHECK (total_amount >= 0);
            
            ALTER TABLE budgets
            ADD CONSTRAINT chk_budgets_spent_amount_positive
            CHECK (spent_amount >= 0);
            
            ALTER TABLE budgets
            ADD CONSTRAINT chk_budgets_spent_not_exceed_total
            CHECK (spent_amount <= total_amount);
            
            ALTER TABLE budgets
            ADD CONSTRAINT chk_budgets_end_date_after_start
            CHECK (end_date > start_date);
        `);

        // Create trigger for automatic updated_at timestamp
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_budgets_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            CREATE TRIGGER trg_budgets_updated_at
            BEFORE UPDATE ON budgets
            FOR EACH ROW
            EXECUTE FUNCTION update_budgets_updated_at();
        `);

        // Add row-level security policies
        // Requirement: Data Security - Field-level security controls
        await queryRunner.query(`
            ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY budgets_user_access ON budgets
            FOR ALL
            USING (user_id = current_user_id())
            WITH CHECK (user_id = current_user_id());
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop row-level security policies
        await queryRunner.query(`
            DROP POLICY IF EXISTS budgets_user_access ON budgets;
            ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
        `);

        // Drop triggers
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trg_budgets_updated_at ON budgets;
            DROP FUNCTION IF EXISTS update_budgets_updated_at();
        `);

        // Drop check constraints
        await queryRunner.query(`
            ALTER TABLE budgets
            DROP CONSTRAINT IF EXISTS chk_budgets_total_amount_positive,
            DROP CONSTRAINT IF EXISTS chk_budgets_spent_amount_positive,
            DROP CONSTRAINT IF EXISTS chk_budgets_spent_not_exceed_total,
            DROP CONSTRAINT IF EXISTS chk_budgets_end_date_after_start;
        `);

        // Drop indices
        await queryRunner.dropIndex('budgets', 'idx_budgets_spent_amount');
        await queryRunner.dropIndex('budgets', 'idx_budgets_user_period_status');

        // Drop foreign key
        await queryRunner.dropForeignKey('budgets', 'fk_budgets_user');

        // Drop budgets table
        await queryRunner.dropTable('budgets', true);

        // Drop enum types
        await queryRunner.query(`DROP TYPE IF EXISTS ${this.BUDGET_STATUS_ENUM};`);
        await queryRunner.query(`DROP TYPE IF EXISTS ${this.BUDGET_PERIOD_ENUM};`);
    }
}