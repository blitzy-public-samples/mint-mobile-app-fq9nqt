import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm'; // ^0.3.0

/**
 * HUMAN TASKS:
 * 1. Ensure PostgreSQL version 14+ is installed and running
 * 2. Verify that the users table migration (1_create_users.ts) has been executed
 * 3. Review the CHECK constraints for business logic validation
 * 4. Confirm the currency codes list matches the application's supported currencies
 */

export class CreateGoals1234567890123 implements MigrationInterface {
    // Addressing requirement: Goal Management from Technical Specification/5.2.3 Service Layer Architecture
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create goals table with secure UUID primary key and appropriate data classification
        // Addressing requirement: Data Security from Technical Specification/9.2.2 Data Classification
        await queryRunner.createTable(
            new Table({
                name: 'goals',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                        comment: 'Unique identifier for the goal - Critical classification'
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                        comment: 'Reference to the user who owns this goal - Critical classification'
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                        comment: 'Name of the financial goal - Sensitive classification'
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                        comment: 'Detailed description of the goal - Sensitive classification'
                    },
                    {
                        name: 'target_amount',
                        type: 'decimal',
                        precision: 19,
                        scale: 4,
                        isNullable: false,
                        comment: 'Target amount for the goal - Sensitive classification'
                    },
                    {
                        name: 'current_amount',
                        type: 'decimal',
                        precision: 19,
                        scale: 4,
                        default: 0,
                        isNullable: false,
                        comment: 'Current progress amount - Sensitive classification'
                    },
                    {
                        name: 'currency',
                        type: 'varchar',
                        length: '3',
                        default: "'USD'",
                        isNullable: false,
                        comment: 'Currency code for the goal amounts - Internal classification'
                    },
                    {
                        name: 'target_date',
                        type: 'timestamp',
                        isNullable: false,
                        comment: 'Target date for achieving the goal - Sensitive classification'
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '20',
                        default: "'IN_PROGRESS'",
                        isNullable: false,
                        comment: 'Current status of the goal - Internal classification'
                    },
                    {
                        name: 'priority',
                        type: 'smallint',
                        default: 1,
                        isNullable: false,
                        comment: 'Priority level of the goal - Internal classification'
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                        isNullable: false,
                        comment: 'Whether the goal is active - Internal classification'
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                        comment: 'Timestamp of goal creation - Internal classification'
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                        comment: 'Timestamp of last update - Internal classification'
                    }
                ]
            }),
            true
        );

        // Create indices for optimizing common queries
        // Addressing requirement: Financial Goal Setting from Technical Specification/1.2 Scope/Core Features
        await queryRunner.createIndex(
            'goals',
            new TableIndex({
                name: 'IDX_goals_user_id',
                columnNames: ['user_id'],
                comment: 'Index for optimizing user-based goal queries'
            })
        );

        await queryRunner.createIndex(
            'goals',
            new TableIndex({
                name: 'IDX_goals_status',
                columnNames: ['status'],
                comment: 'Index for filtering goals by status'
            })
        );

        await queryRunner.createIndex(
            'goals',
            new TableIndex({
                name: 'IDX_goals_user_status',
                columnNames: ['user_id', 'status'],
                comment: 'Composite index for optimizing filtered user goal queries'
            })
        );

        // Add foreign key constraint to users table
        await queryRunner.createForeignKey(
            'goals',
            new TableForeignKey({
                name: 'FK_goals_user',
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
                comment: 'Foreign key to users table ensuring referential integrity'
            })
        );

        // Add check constraints for data validation
        await queryRunner.query(`
            ALTER TABLE goals
            ADD CONSTRAINT CHK_goals_target_amount_positive 
            CHECK (target_amount > 0)
        `);

        await queryRunner.query(`
            ALTER TABLE goals
            ADD CONSTRAINT CHK_goals_current_amount_non_negative 
            CHECK (current_amount >= 0)
        `);

        await queryRunner.query(`
            ALTER TABLE goals
            ADD CONSTRAINT CHK_goals_status_valid 
            CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'))
        `);

        await queryRunner.query(`
            ALTER TABLE goals
            ADD CONSTRAINT CHK_goals_priority_range 
            CHECK (priority BETWEEN 1 AND 5)
        `);

        // Create trigger for automatic updated_at timestamp
        await queryRunner.query(`
            CREATE TRIGGER set_goals_timestamp
            BEFORE UPDATE ON goals
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all constraints and indices first
        await queryRunner.dropForeignKey('goals', 'FK_goals_user');
        await queryRunner.dropIndex('goals', 'IDX_goals_user_status');
        await queryRunner.dropIndex('goals', 'IDX_goals_status');
        await queryRunner.dropIndex('goals', 'IDX_goals_user_id');
        
        // Drop the trigger
        await queryRunner.query('DROP TRIGGER IF EXISTS set_goals_timestamp ON goals');
        
        // Drop the table
        await queryRunner.dropTable('goals', true, true, true);
    }
}