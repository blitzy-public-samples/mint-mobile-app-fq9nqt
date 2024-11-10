// TypeORM v0.3.0
import { DataSource } from 'typeorm';

// @faker-js/faker v8.0.0
import { faker } from '@faker-js/faker';

// bcrypt v5.0.1
import * as bcrypt from 'bcrypt';

import { User } from '../../modules/users/entities/user.entity';
import { Account } from '../../modules/accounts/entities/account.entity';
import { Transaction } from '../../modules/transactions/entities/transaction.entity';
import { Budget } from '../../modules/budgets/entities/budget.entity';

/**
 * Human Tasks:
 * 1. Ensure database connection is properly configured in environment
 * 2. Configure bcrypt salt rounds in environment (default: 12)
 * 3. Verify test data meets security and privacy requirements
 * 4. Set up proper data cleanup procedures for test environments
 */

/**
 * Creates test users with securely hashed passwords
 * Requirements addressed:
 * - Development Environment Setup (Technical Specification/A.1.1)
 * - Data Security (Technical Specification/9.2.2)
 */
async function createTestUsers(dataSource: DataSource): Promise<User[]> {
  const userRepository = dataSource.getRepository(User);
  const users: User[] = [];

  for (let i = 0; i < 5; i++) {
    const user = new User();
    user.email = faker.internet.email().toLowerCase();
    user.password = await bcrypt.hash('Test123!@#', 12); // Secure test password
    user.firstName = faker.person.firstName();
    user.lastName = faker.person.lastName();
    user.isActive = true;
    user.preferences = {
      theme: faker.helpers.arrayElement(['light', 'dark']),
      notifications: true,
      currency: 'USD'
    };
    users.push(user);
  }

  return await userRepository.save(users);
}

/**
 * Creates test accounts with proper relationships
 * Requirements addressed:
 * - Development Environment Setup (Technical Specification/A.1.1)
 */
async function createTestAccounts(dataSource: DataSource, users: User[]): Promise<Account[]> {
  const accountRepository = dataSource.getRepository(Account);
  const accounts: Account[] = [];

  const accountTypes = ['CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT'];
  const institutions = [
    { id: 'ins_1', name: 'Test Bank' },
    { id: 'ins_2', name: 'Credit Union' },
    { id: 'ins_3', name: 'Investment Firm' }
  ];

  for (const user of users) {
    // Create 2-3 accounts per user
    const numAccounts = faker.number.int({ min: 2, max: 3 });
    
    for (let i = 0; i < numAccounts; i++) {
      const institution = faker.helpers.arrayElement(institutions);
      const account = new Account();
      account.userId = user.id;
      account.institutionId = institution.id;
      account.accountType = faker.helpers.arrayElement(accountTypes);
      account.balance = faker.number.float({ min: 1000, max: 50000, precision: 0.01 });
      account.currency = 'USD';
      account.name = `${institution.name} ${account.accountType.toLowerCase()}`;
      account.mask = faker.string.numeric(4);
      account.isActive = true;
      account.lastSyncedAt = faker.date.recent();
      account.metadata = {
        institution: institution.name,
        logo: faker.image.url()
      };
      accounts.push(account);
    }
  }

  return await accountRepository.save(accounts);
}

/**
 * Creates test transactions with proper categorization
 * Requirements addressed:
 * - Development Environment Setup (Technical Specification/A.1.1)
 */
async function createTestTransactions(dataSource: DataSource, accounts: Account[]): Promise<Transaction[]> {
  const transactionRepository = dataSource.getRepository(Transaction);
  const transactions: Transaction[] = [];

  const categories = [
    'GROCERIES', 'RESTAURANTS', 'SHOPPING', 'UTILITIES', 
    'TRANSPORTATION', 'ENTERTAINMENT', 'HEALTHCARE', 'INCOME'
  ];

  const merchants = {
    'GROCERIES': ['Whole Foods', 'Trader Joe\'s', 'Safeway'],
    'RESTAURANTS': ['Chipotle', 'Starbucks', 'Local Cafe'],
    'SHOPPING': ['Amazon', 'Target', 'Walmart'],
    'UTILITIES': ['Electric Company', 'Water Service', 'Internet Provider'],
    'TRANSPORTATION': ['Uber', 'Lyft', 'Gas Station'],
    'ENTERTAINMENT': ['Netflix', 'Spotify', 'Movie Theater'],
    'HEALTHCARE': ['Pharmacy', 'Doctor Office', 'Health Insurance'],
    'INCOME': ['Employer Deposit', 'Freelance Payment', 'Investment Return']
  };

  for (const account of accounts) {
    // Create 15-30 transactions per account over last 90 days
    const numTransactions = faker.number.int({ min: 15, max: 30 });
    
    for (let i = 0; i < numTransactions; i++) {
      const category = faker.helpers.arrayElement(categories);
      const isIncome = category === 'INCOME';
      
      const transaction = new Transaction();
      transaction.accountId = account.id;
      transaction.userId = account.userId;
      transaction.amount = isIncome ? 
        faker.number.float({ min: 1000, max: 5000, precision: 0.01 }) :
        -faker.number.float({ min: 10, max: 500, precision: 0.01 });
      transaction.category = category;
      transaction.merchantName = faker.helpers.arrayElement(merchants[category]);
      transaction.description = `${transaction.merchantName} - ${category.toLowerCase()}`;
      transaction.transactionDate = faker.date.recent({ days: 90 });
      transaction.pending = faker.datatype.boolean({ probability: 0.1 });
      transaction.metadata = {
        location: faker.location.city(),
        paymentMethod: faker.helpers.arrayElement(['credit', 'debit', 'transfer'])
      };
      transactions.push(transaction);
    }
  }

  return await transactionRepository.save(transactions);
}

/**
 * Creates test budgets with spending tracking
 * Requirements addressed:
 * - Development Environment Setup (Technical Specification/A.1.1)
 */
async function createTestBudgets(dataSource: DataSource, users: User[]): Promise<Budget[]> {
  const budgetRepository = dataSource.getRepository(Budget);
  const budgets: Budget[] = [];

  const categories = [
    'GROCERIES', 'RESTAURANTS', 'SHOPPING', 'UTILITIES', 
    'TRANSPORTATION', 'ENTERTAINMENT', 'HEALTHCARE'
  ];

  for (const user of users) {
    // Create 3-5 budgets per user
    const numBudgets = faker.number.int({ min: 3, max: 5 });
    const selectedCategories = faker.helpers.arrayElements(categories, numBudgets);
    
    for (const category of selectedCategories) {
      const budget = new Budget();
      budget.userId = user.id;
      budget.name = `${category.charAt(0) + category.slice(1).toLowerCase()} Budget`;
      budget.description = `Monthly budget for ${category.toLowerCase()} expenses`;
      budget.amount = faker.number.float({ min: 200, max: 1000, precision: 0.01 });
      budget.currency = 'USD';
      budget.period = 'MONTHLY';
      budget.spent = faker.number.float({ min: 0, max: budget.amount, precision: 0.01 });
      budget.category = category;
      budget.isActive = true;
      budget.startDate = faker.date.recent({ days: 30 });
      budget.endDate = faker.date.soon({ days: 30, refDate: budget.startDate });
      budget.metadata = {
        notifications: true,
        alertThreshold: 0.8
      };
      budgets.push(budget);
    }
  }

  return await budgetRepository.save(budgets);
}

/**
 * Main seeding function that orchestrates test data creation
 * Requirements addressed:
 * - Development Environment Setup (Technical Specification/A.1.1)
 * - Data Security (Technical Specification/9.2.2)
 */
export async function seed(dataSource: DataSource): Promise<void> {
  try {
    console.log('Starting test data seeding...');

    // Create test data in proper order to maintain relationships
    const users = await createTestUsers(dataSource);
    console.log(`Created ${users.length} test users`);

    const accounts = await createTestAccounts(dataSource, users);
    console.log(`Created ${accounts.length} test accounts`);

    const transactions = await createTestTransactions(dataSource, accounts);
    console.log(`Created ${transactions.length} test transactions`);

    const budgets = await createTestBudgets(dataSource, users);
    console.log(`Created ${budgets.length} test budgets`);

    console.log('Test data seeding completed successfully');
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
}