/**
 * Human Tasks:
 * 1. Ensure faker.js and dayjs are installed in package.json
 * 2. Configure test data generation settings in test environment
 * 3. Update mockCategories and mockInstitutions as needed for your test scenarios
 */

// @faker-js/faker v8.0.0
import { faker } from '@faker-js/faker';
// dayjs v1.11.0
import dayjs from 'dayjs';

import { User } from '../../backend/src/modules/users/entities/user.entity';
import { Account } from '../../backend/src/modules/accounts/entities/account.entity';
import { Transaction } from '../../backend/src/modules/transactions/entities/transaction.entity';

/**
 * Requirements addressed:
 * - Testing Data (Technical Specification/8. System Design/Testing Standards)
 *   Provides standardized test data for unit tests, integration tests and e2e tests
 * 
 * - Data Models (Technical Specification/6.1.1 Core Application Components)
 *   Implements mock data matching core domain models
 */

// Predefined transaction categories for consistent testing
export const mockCategories = [
  'Housing',
  'Transportation',
  'Food & Dining',
  'Utilities',
  'Healthcare',
  'Shopping',
  'Entertainment',
  'Travel',
  'Education',
  'Investments',
  'Income',
  'Other'
];

// Mock financial institutions with consistent test data
export const mockInstitutions = [
  {
    id: 'inst_1',
    name: 'Chase Bank',
    logo: 'https://example.com/logos/chase.png'
  },
  {
    id: 'inst_2',
    name: 'Bank of America',
    logo: 'https://example.com/logos/boa.png'
  },
  {
    id: 'inst_3',
    name: 'Wells Fargo',
    logo: 'https://example.com/logos/wellsfargo.png'
  },
  {
    id: 'inst_4',
    name: 'Citibank',
    logo: 'https://example.com/logos/citi.png'
  }
];

/**
 * Creates a mock user with realistic data using faker.js
 */
export const createMockUser = (overrides: Partial<User> = {}): User => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  const user = new User();
  user.id = faker.string.uuid();
  user.email = faker.internet.email({ firstName, lastName });
  user.firstName = firstName;
  user.lastName = lastName;
  user.isActive = true;
  user.preferences = {
    theme: 'light',
    currency: 'USD',
    notifications: {
      email: true,
      push: true
    }
  };
  user.lastLoginAt = faker.date.recent();
  user.createdAt = faker.date.past();
  user.updatedAt = faker.date.recent();

  return { ...user, ...overrides };
};

/**
 * Creates a mock financial account with realistic banking data
 */
export const createMockAccount = (userId: string, overrides: Partial<Account> = {}): Account => {
  const institution = faker.helpers.arrayElement(mockInstitutions);
  const accountTypes = ['checking', 'savings', 'credit', 'investment', 'loan'];
  
  const account = new Account();
  account.id = faker.string.uuid();
  account.userId = userId;
  account.institutionId = institution.id;
  account.accountType = faker.helpers.arrayElement(accountTypes);
  account.balance = parseFloat(faker.finance.amount(100, 50000, 2));
  account.currency = 'USD';
  account.name = `${institution.name} ${account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}`;
  account.mask = faker.string.numeric(4);
  account.isActive = true;
  account.lastSyncedAt = faker.date.recent();
  account.metadata = {
    institutionName: institution.name,
    institutionLogo: institution.logo
  };
  account.createdAt = faker.date.past();
  account.updatedAt = faker.date.recent();

  return { ...account, ...overrides };
};

/**
 * Creates a mock financial transaction with realistic transaction data
 */
export const createMockTransaction = (
  accountId: string,
  userId: string,
  overrides: Partial<Transaction> = {}
): Transaction => {
  const category = faker.helpers.arrayElement(mockCategories);
  const isDebit = faker.datatype.boolean();
  const amount = parseFloat(faker.finance.amount(5, 1000, 2)) * (isDebit ? -1 : 1);
  
  const transaction = new Transaction();
  transaction.id = faker.string.uuid();
  transaction.accountId = accountId;
  transaction.userId = userId;
  transaction.amount = amount;
  transaction.description = faker.commerce.productName();
  transaction.category = category;
  transaction.merchantName = faker.company.name();
  transaction.transactionDate = dayjs()
    .subtract(faker.number.int({ min: 1, max: 90 }), 'days')
    .toDate();
  transaction.pending = faker.datatype.boolean({ probability: 0.1 });
  transaction.metadata = {
    location: faker.location.city(),
    paymentMethod: faker.helpers.arrayElement(['card', 'ach', 'wire', 'cash']),
    notes: faker.lorem.sentence()
  };
  transaction.createdAt = faker.date.past();
  transaction.updatedAt = faker.date.recent();

  return { ...transaction, ...overrides };
};

/**
 * Creates a mock budget with realistic categories and allocations
 */
export const createMockBudget = (userId: string, overrides: Partial<any> = {}) => {
  const startDate = dayjs().startOf('month').toDate();
  const endDate = dayjs().endOf('month').toDate();
  
  const budget = {
    id: faker.string.uuid(),
    userId,
    name: `${dayjs(startDate).format('MMMM YYYY')} Budget`,
    startDate,
    endDate,
    categories: mockCategories.map(category => ({
      category,
      allocated: parseFloat(faker.finance.amount(100, 2000, 2)),
      spent: parseFloat(faker.finance.amount(0, 1500, 2))
    })),
    totalAllocated: 0,
    totalSpent: 0,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent()
  };

  // Calculate totals
  budget.totalAllocated = budget.categories.reduce((sum, cat) => sum + cat.allocated, 0);
  budget.totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spent, 0);

  return { ...budget, ...overrides };
};