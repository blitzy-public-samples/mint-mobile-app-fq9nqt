// TypeORM v0.3.0
import { DataSource } from 'typeorm';

/**
 * Human Tasks:
 * 1. Ensure database connection is properly configured before running seeds
 * 2. Verify database user has sufficient privileges for index creation
 * 3. Consider running this seed only in fresh database installations
 * 4. Review and customize categories based on regional/business requirements
 */

/**
 * Default transaction categories and subcategories for system initialization
 * 
 * Requirements addressed:
 * - Transaction Categorization (Technical Specification/1.2 Scope/Core Features)
 *   Provides standardized categories for transaction tracking and categorization
 * 
 * - Budget Creation (Technical Specification/1.2 Scope/Core Features)
 *   Supports budget creation with predefined category options
 */
export const DEFAULT_CATEGORIES = [
  {
    name: 'Income',
    subcategories: ['Salary', 'Investments', 'Freelance', 'Other Income']
  },
  {
    name: 'Housing',
    subcategories: ['Rent/Mortgage', 'Utilities', 'Maintenance', 'Insurance']
  },
  {
    name: 'Transportation',
    subcategories: ['Public Transit', 'Fuel', 'Car Maintenance', 'Parking']
  },
  {
    name: 'Food & Dining',
    subcategories: ['Groceries', 'Restaurants', 'Coffee Shops', 'Food Delivery']
  },
  {
    name: 'Shopping',
    subcategories: ['Clothing', 'Electronics', 'Home Goods', 'Personal Care']
  },
  {
    name: 'Healthcare',
    subcategories: ['Medical', 'Pharmacy', 'Insurance', 'Fitness']
  },
  {
    name: 'Entertainment',
    subcategories: ['Movies', 'Music', 'Hobbies', 'Subscriptions']
  },
  {
    name: 'Education',
    subcategories: ['Tuition', 'Books', 'Courses', 'Supplies']
  },
  {
    name: 'Savings',
    subcategories: ['Emergency Fund', 'Retirement', 'Investments', 'Goals']
  },
  {
    name: 'Miscellaneous',
    subcategories: ['Gifts', 'Donations', 'Fees', 'Other']
  }
];

/**
 * Seeds the database with default transaction categories
 * @param dataSource TypeORM DataSource instance
 */
export async function seed(dataSource: DataSource): Promise<void> {
  try {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if categories table exists, create if not
      const tableExists = await queryRunner.hasTable('categories');
      if (!tableExists) {
        await queryRunner.query(`
          CREATE TABLE categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            subcategories JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }

      // Check if categories already exist
      const existingCategories = await queryRunner.query(
        'SELECT COUNT(*) as count FROM categories'
      );

      if (existingCategories[0].count === 0) {
        // Insert default categories
        for (const category of DEFAULT_CATEGORIES) {
          await queryRunner.query(
            `INSERT INTO categories (name, subcategories) 
             VALUES ($1, $2)`,
            [category.name, JSON.stringify({ items: category.subcategories })]
          );
        }

        // Create indexes for efficient querying
        await queryRunner.query(
          'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories (name)'
        );
        await queryRunner.query(
          'CREATE INDEX IF NOT EXISTS idx_categories_subcategories ON categories USING gin (subcategories)'
        );

        console.log('Successfully seeded default transaction categories');
      } else {
        console.log('Categories already exist, skipping seed');
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('Error seeding default categories:', error);
    throw error;
  }
}