import { Account, Budget, Investment, Transaction, Goal, User } from '../types/models.types';

export const mockUser: User = {
  id: 'usr_01',
  email: 'john.smith@example.com',
  firstName: 'John',
  lastName: 'Smith',
  passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HsVqZFm',
  createdAt: new Date('2023-09-15T08:30:00Z'),
  updatedAt: new Date('2024-02-20T14:22:31Z'),
  preferences: {}
};

export const mockAccounts: Account[] = [
  {
    id: 'acc_checking_001',
    userId: 'user_001',
    accountType: 'CHECKING',
    balance: 2547.83,
    institutionId: 'ins_chase',
    currency: 'USD',
    lastSynced: new Date(),
    isActive: true
  },
  {
    id: 'acc_savings_001',
    userId: 'user_001',
    accountType: 'SAVINGS',
    balance: 15000.00,
    institutionId: 'ins_chase',
    currency: 'USD',
    lastSynced: new Date(),
    isActive: true
  },
  {
    id: 'acc_credit_001',
    userId: 'user_001',
    accountType: 'CREDIT',
    balance: -1250.45,
    institutionId: 'ins_amex',
    currency: 'USD',
    lastSynced: new Date(),
    isActive: true
  }
];

export const mockBudgets: Budget[] = [
  {
    id: 'budget-id-1',
    userId: '1',
    name: 'Monthly Essentials',
    period: 'MONTHLY',
    amount: 2000,
    spent: 850,
    startDate: new Date("2024-03-01T00:00:00.000Z"),
    endDate: new Date("2024-03-31T23:59:59.999Z"),
    categories: [
      {
        id: 'category-id-1',
        budgetId: 'budget-id-1',
        name: 'Groceries',
        amount: 600,
        spent: 320,
        color: '#4CAF50',
      },
      {
        id: 'category-id-2',
        budgetId: 'budget-id-1',
        name: 'Utilities',
        amount: 400,
        spent: 380,
        color: '#2196F3',
      }
    ]
  },
  {
    id: 'budget-id-2',
    userId: '1',
    name: 'Annual Savings',
    period: 'YEARLY',
    amount: 12000,
    spent: 2500,
    startDate: new Date("2024-01-01T00:00:00.000Z"),
    endDate: new Date("2024-12-31T23:59:59.999Z"),
    categories: [
      {
        id: 'category-id-3',
        budgetId: 'budget-id-2',
        name: 'Emergency Fund',
        amount: 6000,
        spent: 1500,
        color: '#9C27B0',
      },
      {
        id: 'category-id-4',
        budgetId: 'budget-id-2',
        name: 'Vacation',
        amount: 4000,
        spent: 1000,
        color: '#FF9800',
      }
    ]
  },
  {
    id: 'budget-id-3',
    userId: '1',
    name: 'Weekly Entertainment',
    period: 'WEEKLY',
    amount: 150,
    spent: 90,
    startDate: new Date("2024-03-11T00:00:00.000Z"),
    endDate: new Date("2024-03-17T23:59:59.999Z"),
    categories: [
      {
        id: 'category-id-5',
        budgetId: 'budget-id-3',
        name: 'Dining Out',
        amount: 100,
        spent: 75,
        color: '#E91E63',
      },
      {
        id: 'category-id-6',
        budgetId: 'budget-id-3',
        name: 'Movies',
        amount: 50,
        spent: 15,
        color: '#673AB7',
      }
    ]
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: '507f1f77bcf86cd799439011',
    accountId: 'acc_checking_001',
    amount: 1250.00,
    date: new Date('2024-03-15'),
    description: 'Monthly Salary',
    categoryId: 'INCOME',
    pending: false,
    metadata: {}
  },
  {
    id: '507f1f77bcf86cd799439012',
    accountId: 'acc_checking_001',
    amount: -85.50,
    date: new Date('2024-03-14'),
    description: 'Grocery Store',
    categoryId: 'GROCERIES',
    pending: true,
    metadata: {}
  },
  {
    id: '507f1f77bcf86cd799439013',
    accountId: 'acc_savings_001',
    amount: -125.00,
    date: new Date('2024-03-13'),
    description: 'Electric Bill',
    categoryId: 'UTILITIES',
    pending: true,
    metadata: {}
  },
  {
    id: '507f1f77bcf86cd799439014',
    accountId: 'acc_credit_001',
    amount: -45.99,
    date: new Date('2024-03-12'),
    description: 'Netflix Subscription',
    categoryId: 'ENTERTAINMENT',
    pending: false,
    metadata: {}
  },
  {
    id: '507f1f77bcf86cd799439015',
    accountId: 'acc_savings_001',
    amount: -250.00,
    date: new Date('2024-03-11'),
    description: 'Car Insurance',
    categoryId: 'TRANSPORT',
    pending: false,
    metadata: {}
  }
];

export const mockInvestments: Investment[] = [
  {
    id: "inv_001",
    accountId: "acc_003",
    symbol: "AAPL",
    quantity: 10,
    costBasis: 150.00,
    currentPrice: 175.50,
    lastUpdated: new Date("2024-03-15T12:00:00Z"),
    assetType: 'STOCK',
    currentValue: 1755.00,
    return: 10.00
  },
  {
    id: "inv_002",
    accountId: "acc_003",
    symbol: "GOOGL",
    quantity: 5,
    costBasis: 2800.00,
    currentPrice: 3150.75,
    lastUpdated: new Date("2024-03-15T12:00:00Z"),
    assetType: 'STOCK',
    currentValue: 15753.75,
    return: 10.00
  },
  {
    id: "inv_003",
    accountId: "acc_003",
    symbol: "VTI",
    quantity: 25,
    costBasis: 200.00,
    currentPrice: 215.25,
    lastUpdated: new Date("2024-03-15T12:00:00Z"),
    assetType: 'ETF',
    currentValue: 5381.25,
    return: 10.00
  }
];

export const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    userId: 'usr_01',
    name: 'Emergency Fund',
    type: 'EMERGENCY_FUND',
    targetAmount: 10000,
    currentAmount: 5000,
    targetDate: new Date('2024-12-31'),
    status: 'IN_PROGRESS'
  },
  {
    id: 'goal-2',
    userId: 'usr_01',
    name: 'Down Payment',
    type: 'SAVINGS',
    targetAmount: 50000,
    currentAmount: 15000,
    targetDate: new Date('2025-06-30'),
    status: 'ON_TRACK'
  },
  {
    id: 'goal-3',
    userId: 'usr_01',
    name: 'Student Loan',
    type: 'DEBT_PAYMENT',
    targetAmount: 25000,
    currentAmount: 5000,
    targetDate: new Date('2024-09-30'),
    status: 'AT_RISK'
  },
  {
    id: 'goal-4',
    userId: 'usr_01',
    name: 'Retirement Fund',
    type: 'INVESTMENT',
    targetAmount: 100000,
    currentAmount: 0,
    targetDate: new Date('2030-12-31'),
    status: 'NOT_STARTED'
  },
  {
    id: 'goal-5',
    userId: 'usr_01',
    name: 'Vacation Fund',
    type: 'CUSTOM',
    targetAmount: 5000,
    currentAmount: 5000,
    targetDate: new Date('2024-03-01'),
    status: 'COMPLETED'
  }
]; 