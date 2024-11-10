// TypeORM v0.3.0
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

/*
Human Tasks:
1. Ensure database encryption keys are properly configured in the environment for sensitive data encryption
2. Verify that the users table exists and has the expected UUID primary key structure
3. Confirm that the database user has the necessary permissions to create tables, indexes, and foreign keys
*/

export class CreateNotificationsTable1234567890123 implements MigrationInterface {
    // Table name constant for reusability
    private readonly tableName = 'notifications';

    // Notification type enum values
    private readonly notificationTypes = [
        'BUDGET_ALERT',
        'GOAL_MILESTONE',
        'TRANSACTION_ALERT',
        'SECURITY_ALERT',
        'SYSTEM_NOTIFICATION',
        'INVESTMENT_ALERT',
        'SYNC_NOTIFICATION'
    ];

    // Priority levels enum values
    private readonly priorityLevels = [
        'LOW',
        'MEDIUM',
        'HIGH',
        'URGENT'
    ];

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types first
        await queryRunner.query(`
            CREATE TYPE notification_type AS ENUM (${this.notificationTypes.map(type => `'${type}'`).join(', ')});
            CREATE TYPE notification_priority AS ENUM (${this.priorityLevels.map(level => `'${level}'`).join(', ')});
        `);

        // Create the notifications table
        // Requirement: Real-time notification system (Technical Specification/1.1 System Overview)
        await queryRunner.createTable(new Table({
            name: this.tableName,
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    default: "uuid_generate_v4()",
                    comment: "Unique identifier for the notification"
                },
                {
                    name: "user_id",
                    type: "uuid",
                    isNullable: false,
                    comment: "Reference to the user who will receive the notification"
                },
                {
                    name: "type",
                    type: "notification_type",
                    isNullable: false,
                    comment: "Type of notification for proper handling and display"
                },
                {
                    name: "title",
                    type: "varchar",
                    length: "255",
                    isNullable: false,
                    comment: "Notification title/heading"
                },
                {
                    name: "message",
                    type: "text",
                    isNullable: false,
                    comment: "Detailed notification message"
                },
                {
                    name: "priority",
                    type: "notification_priority",
                    isNullable: false,
                    comment: "Priority level for notification processing"
                },
                {
                    name: "data",
                    type: "jsonb",
                    isNullable: true,
                    comment: "Additional metadata for the notification"
                },
                {
                    name: "scheduled_at",
                    type: "timestamp with time zone",
                    isNullable: true,
                    comment: "Scheduled delivery time for the notification"
                },
                {
                    name: "sent_at",
                    type: "timestamp with time zone",
                    isNullable: true,
                    comment: "Timestamp when notification was sent"
                },
                {
                    name: "is_read",
                    type: "boolean",
                    default: false,
                    isNullable: false,
                    comment: "Flag indicating if notification has been read"
                },
                {
                    name: "read_at",
                    type: "timestamp with time zone",
                    isNullable: true,
                    comment: "Timestamp when notification was read"
                },
                {
                    name: "created_at",
                    type: "timestamp with time zone",
                    default: "CURRENT_TIMESTAMP",
                    isNullable: false,
                    comment: "Timestamp when notification was created"
                },
                {
                    name: "updated_at",
                    type: "timestamp with time zone",
                    default: "CURRENT_TIMESTAMP",
                    isNullable: false,
                    comment: "Timestamp when notification was last updated"
                }
            ]
        }), true);

        // Create foreign key constraint
        // Requirement: Data Security (Technical Specification/9.2 Data Security)
        await queryRunner.createForeignKey(this.tableName, new TableForeignKey({
            name: `fk_${this.tableName}_user_id`,
            columnNames: ["user_id"],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
            onUpdate: "CASCADE"
        }));

        // Create indexes for performance optimization
        // Requirement: Push Notification Services (Technical Specification/5.1 High-Level Architecture Overview)
        await queryRunner.createIndex(this.tableName, new TableIndex({
            name: `idx_${this.tableName}_user_id`,
            columnNames: ["user_id"]
        }));

        await queryRunner.createIndex(this.tableName, new TableIndex({
            name: `idx_${this.tableName}_type`,
            columnNames: ["type"]
        }));

        await queryRunner.createIndex(this.tableName, new TableIndex({
            name: `idx_${this.tableName}_priority`,
            columnNames: ["priority"]
        }));

        // Composite index for efficient user notification queries
        await queryRunner.createIndex(this.tableName, new TableIndex({
            name: `idx_${this.tableName}_user_created`,
            columnNames: ["user_id", "created_at"]
        }));

        // Enable row level security for additional data protection
        // Requirement: Data Security (Technical Specification/9.2 Data Security)
        await queryRunner.query(`
            ALTER TABLE ${this.tableName} ENABLE ROW LEVEL SECURITY;
            CREATE POLICY ${this.tableName}_user_isolation ON ${this.tableName}
                USING (user_id = current_user_id());
        `);

        // Create trigger for updating updated_at timestamp
        await queryRunner.query(`
            CREATE TRIGGER update_${this.tableName}_updated_at
                BEFORE UPDATE ON ${this.tableName}
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all created indexes
        await queryRunner.dropIndex(this.tableName, `idx_${this.tableName}_user_created`);
        await queryRunner.dropIndex(this.tableName, `idx_${this.tableName}_priority`);
        await queryRunner.dropIndex(this.tableName, `idx_${this.tableName}_type`);
        await queryRunner.dropIndex(this.tableName, `idx_${this.tableName}_user_id`);

        // Drop foreign key constraint
        await queryRunner.dropForeignKey(this.tableName, `fk_${this.tableName}_user_id`);

        // Drop the notifications table
        await queryRunner.dropTable(this.tableName);

        // Drop custom enum types
        await queryRunner.query(`
            DROP TYPE IF EXISTS notification_priority;
            DROP TYPE IF EXISTS notification_type;
        `);
    }
}