import { Account, Budget, Investment, Transaction, Goal, User, InvestmentPerformanceData } from '../types/models.types';

export const mockLinkToken = 'mock-link-token';

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
    institutionId: 'Chase',
    currency: 'USD',
    lastSynced: new Date(),
    isActive: true
  },
  {
    id: 'acc_savings_001',
    userId: 'user_001',
    accountType: 'SAVINGS',
    balance: 15000.00,
    institutionId: 'Chase',
    currency: 'USD',
    lastSynced: new Date(),
    isActive: true
  },
  {
    id: 'acc_credit_001',
    userId: 'user_001',
    accountType: 'CREDIT',
    balance: -1250.45,
    institutionId: 'Amex',
    currency: 'USD',
    lastSynced: new Date(),
    isActive: true
  },
  {
    id: 'acc_investment_001',
    userId: 'user_001',
    accountType: 'INVESTMENT',
    balance: 125750.85,
    institutionId: 'Fidelity',
    currency: 'USD',
    lastSynced: new Date(),
    isActive: true
  },
  {
    id: 'acc_loan_001',
    userId: 'user_001',
    accountType: 'LOAN',
    balance: -45000.00,
    institutionId: 'SallieMae',
    currency: 'USD',
    lastSynced: new Date(),
    isActive: true
  }
];

export let mockBudgets: Budget[] = [
  {
    id: 'budget_monthly_essentials',
    userId: 'usr_01',
    name: 'Monthly Essentials',
    period: 'MONTHLY',
    amount: 2000,
    spent: 850,
    startDate: new Date("2024-03-01T00:00:00.000Z"),
    endDate: new Date("2024-03-31T23:59:59.999Z"),
    categories: [
      {
        id: 'category_groceries',
        budgetId: 'budget_monthly_essentials',
        name: 'Groceries',
        amount: 600,
        spent: 320,
        color: '#4CAF50',
      },
      {
        id: 'category_utilities',
        budgetId: 'budget_monthly_essentials',
        name: 'Utilities',
        amount: 400,
        spent: 380,
        color: '#2196F3',
      }
    ]
  },
  {
    id: 'budget_annual_savings',
    userId: 'usr_01',
    name: 'Annual Savings',
    period: 'YEARLY',
    amount: 12000,
    spent: 2500,
    startDate: new Date("2024-01-01T00:00:00.000Z"),
    endDate: new Date("2024-12-31T23:59:59.999Z"),
    categories: [
      {
        id: 'category_emergency_fund',
        budgetId: 'budget_annual_savings',
        name: 'Emergency Fund',
        amount: 6000,
        spent: 1500,
        color: '#9C27B0',
      },
      {
        id: 'category_vacation',
        budgetId: 'budget_annual_savings',
        name: 'Vacation',
        amount: 4000,
        spent: 1000,
        color: '#FF9800',
      }
    ]
  },
  {
    id: 'budget_weekly_entertainment',
    userId: 'usr_01',
    name: 'Weekly Entertainment',
    period: 'WEEKLY',
    amount: 150,
    spent: 90,
    startDate: new Date("2024-03-11T00:00:00.000Z"),
    endDate: new Date("2024-03-17T23:59:59.999Z"),
    categories: [
      {
        id: 'category_dining_out',
        budgetId: 'budget_weekly_entertainment',
        name: 'Dining Out',
        amount: 100,
        spent: 75,
        color: '#E91E63',
      },
      {
        id: 'category_movies',
        budgetId: 'budget_weekly_entertainment',
        name: 'Movies',
        amount: 50,
        spent: 15,
        color: '#673AB7',
      }
    ]
  },
  {
    id: 'budget_quarterly_maintenance',
    userId: 'usr_01',
    name: 'Home & Personal Development',
    period: 'QUARTERLY',
    amount: 3000,
    spent: 1250,
    startDate: new Date("2024-01-01T00:00:00.000Z"),
    endDate: new Date("2024-03-31T23:59:59.999Z"),
    categories: [
      {
        id: 'category_home_maintenance',
        budgetId: 'budget_quarterly_maintenance',
        name: 'Home Maintenance',
        amount: 1500,
        spent: 850,
        color: '#795548',
      },
      {
        id: 'category_education',
        budgetId: 'budget_quarterly_maintenance',
        name: 'Education & Courses',
        amount: 1000,
        spent: 300,
        color: '#009688',
      },
      {
        id: 'category_home_improvement',
        budgetId: 'budget_quarterly_maintenance',
        name: 'Home Improvement',
        amount: 500,
        spent: 100,
        color: '#FF5722',
      }
    ]
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: '507f1f77bcf86cd799439011',
    accountId: 'acc_checking_001',
    amount: 1250.00,
    date: new Date('2024-11-15'),
    description: 'Monthly Salary',
    categoryId: 'INCOME',
    pending: false,
    metadata: {}
  },
  {
    id: '507f1f77bcf86cd799439012',
    accountId: 'acc_checking_001',
    amount: -85.50,
    date: new Date('2024-11-14'),
    description: 'Grocery Store',
    categoryId: 'GROCERIES',
    pending: true,
    metadata: {}
  },
  {
    id: '507f1f77bcf86cd799439013',
    accountId: 'acc_savings_001',
    amount: -125.00,
    date: new Date('2024-11-13'),
    description: 'Electric Bill',
    categoryId: 'UTILITIES',
    pending: true,
    metadata: {}
  },
  {
    id: '507f1f77bcf86cd799439014',
    accountId: 'acc_credit_001',
    amount: -45.99,
    date: new Date('2024-10-12'),
    description: 'Netflix Subscription',
    categoryId: 'ENTERTAINMENT',
    pending: false,
    metadata: {}
  },
  {
    id: '507f1f77bcf86cd799439015',
    accountId: 'acc_savings_001',
    amount: -250.00,
    date: new Date('2024-10-11'),
    description: 'Car Insurance',
    categoryId: 'TRANSPORT',
    pending: false,
    metadata: {}
  },
  {
    id: '507f1f77bcf86cd799439016',
    accountId: 'acc_loan_001',
    amount: -450.00,
    date: new Date('2024-03-15'),
    description: 'Student Loan Monthly Payment',
    categoryId: 'LOAN_PAYMENT',
    pending: false,
    metadata: {
      paymentType: 'scheduled',
      principalAmount: 325.50,
      interestAmount: 124.50
    }
  },
  {
    id: '507f1f77bcf86cd799439017',
    accountId: 'acc_loan_001',
    amount: -124.50,
    date: new Date('2024-03-15'),
    description: 'Loan Interest Charge',
    categoryId: 'LOAN_INTEREST',
    pending: false,
    metadata: {
      interestRate: '5.5%',
      billingPeriod: '2024-02-15 to 2024-03-15'
    }
  },
  {
    id: '507f1f77bcf86cd799439018',
    accountId: 'acc_loan_001',
    amount: -450.00,
    date: new Date('2024-02-15'),
    description: 'Student Loan Monthly Payment',
    categoryId: 'LOAN_PAYMENT',
    pending: false,
    metadata: {
      paymentType: 'scheduled',
      principalAmount: 323.75,
      interestAmount: 126.25
    }
  },
  {
    id: '507f1f77bcf86cd799439019',
    accountId: 'acc_loan_001',
    amount: -126.25,
    date: new Date('2024-02-15'),
    description: 'Loan Interest Charge',
    categoryId: 'LOAN_INTEREST',
    pending: false,
    metadata: {
      interestRate: '5.5%',
      billingPeriod: '2024-01-15 to 2024-02-15'
    }
  },
  {
    id: '507f1f77bcf86cd799439020',
    accountId: 'acc_loan_001',
    amount: -1000.00,
    date: new Date('2024-02-01'),
    description: 'Extra Loan Payment',
    categoryId: 'LOAN_PAYMENT',
    pending: false,
    metadata: {
      paymentType: 'extra',
      principalAmount: 1000.00,
      interestAmount: 0
    }
  }
];

export const mockInvestments: Investment[] = [
  {
    id: "AAPL",
    accountId: "acc_003",
    symbol: "AAPL",
    quantity: 15,
    costBasis: 2141.25,
    currentPrice: 175.50,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    assetType: 'STOCK',
    currentValue: 2632.50,
    return: 23.64
  },
  {
    id: "GOOGL",
    accountId: "acc_003",
    symbol: "GOOGL",
    quantity: 8,
    costBasis: 22284.00,
    currentPrice: 3150.75,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    assetType: 'STOCK',
    currentValue: 25206.00,
    return: 13.11
  },
  {
    id: "VTI",
    accountId: "acc_003",
    symbol: "VTI",
    quantity: 45,
    costBasis: 8808.75,
    currentPrice: 215.25,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    assetType: 'ETF',
    currentValue: 9686.25,
    return: 9.96
  },
  {
    id: "VXUS",
    accountId: "acc_003",
    symbol: "VXUS",
    quantity: 75,
    costBasis: 3960.00,
    currentPrice: 57.92,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    assetType: 'ETF',
    currentValue: 4344.00,
    return: 9.70
  },
  {
    id: "BND",
    accountId: "acc_003",
    symbol: "BND",
    quantity: 100,
    costBasis: 7245.00,
    currentPrice: 70.85,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    assetType: 'ETF',
    currentValue: 7085.00,
    return: -2.21
  },
  {
    id: "MSFT",
    accountId: "acc_003",
    symbol: "MSFT",
    quantity: 12,
    costBasis: 3747.00,
    currentPrice: 425.22,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    assetType: 'STOCK',
    currentValue: 5102.64,
    return: 36.18
  },
  {
    id: "AMZN",
    accountId: "acc_003",
    symbol: "AMZN",
    quantity: 20,
    costBasis: 2710.00,
    currentPrice: 178.75,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    assetType: 'STOCK',
    currentValue: 3575.00,
    return: 31.92
  },
  {
    id: "SCHD",
    accountId: "acc_003",
    symbol: "SCHD",
    quantity: 60,
    costBasis: 4455.00,
    currentPrice: 77.85,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    assetType: 'ETF',
    currentValue: 4671.00,
    return: 4.85
  },
  {
    id: "BTC",
    accountId: "acc_003",
    symbol: "BTC",
    quantity: 0.75,
    costBasis: 26250.00,
    currentPrice: 68750.00,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    assetType: 'CRYPTO',
    currentValue: 51562.50,
    return: 96.43
  },
  {
    id: "ETH",
    accountId: "acc_003",
    symbol: "ETH",
    quantity: 4.5,
    costBasis: 9900.00,
    currentPrice: 3850.00,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    assetType: 'CRYPTO',
    currentValue: 17325.00,
    return: 75.00
  },
  {
    id: "SOL",
    accountId: "acc_003",
    symbol: "SOL",
    quantity: 85,
    costBasis: 3888.75,
    currentPrice: 125.50,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    assetType: 'CRYPTO',
    currentValue: 10667.50,
    return: 174.32
  },
  {
    id: "LINK",
    accountId: "acc_003",
    symbol: "LINK",
    quantity: 250,
    costBasis: 3125.00,
    currentPrice: 18.75,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    assetType: 'CRYPTO',
    currentValue: 4687.50,
    return: 50.00
  }
];

export const mockInvestmentPerformance: Record<string, InvestmentPerformanceData> = {
  "AAPL": {
    returnRate: 23.64,
    totalValue: 2632.50,
    gainLoss: 491.25,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    historicalData: [
      { x: "2023-03-15", y: 2452.50 }, // $163.50
      { x: "2023-06-15", y: 2751.75 }, // $183.45
      { x: "2023-09-15", y: 2395.50 }, // $159.70
      { x: "2023-12-15", y: 2846.25 }, // $189.75
      { x: "2024-01-15", y: 2891.25 }, // $192.75
      { x: "2024-02-15", y: 2587.50 }, // $172.50
      { x: "2024-03-15", y: 2632.50 }  // $175.50
    ]
  },
  "GOOGL": {
    returnRate: 13.11,
    totalValue: 25206.00,
    gainLoss: 2922.00,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    historicalData: [
      { x: "2023-03-15", y: 19960.00 }, // $2495.00
      { x: "2023-06-15", y: 23592.00 }, // $2949.00
      { x: "2023-09-15", y: 22288.00 }, // $2786.00
      { x: "2023-12-15", y: 23976.00 }, // $2997.00
      { x: "2024-01-15", y: 24472.00 }, // $3059.00
      { x: "2024-02-15", y: 24880.00 }, // $3110.00
      { x: "2024-03-15", y: 25206.00 }  // $3150.75
    ]
  },
  "VTI": {
    returnRate: 9.96,
    totalValue: 9686.25,
    gainLoss: 877.50,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    historicalData: [
      { x: "2023-03-15", y: 8775.00 },  // $195.00
      { x: "2023-06-15", y: 9450.00 },  // $210.00
      { x: "2023-09-15", y: 9000.00 },  // $200.00
      { x: "2023-12-15", y: 9675.00 },  // $215.00
      { x: "2024-01-15", y: 9900.00 },  // $220.00
      { x: "2024-02-15", y: 9562.50 },  // $212.50
      { x: "2024-03-15", y: 9686.25 }   // $215.25
    ]
  },
  "VXUS": {
    returnRate: 9.70,
    totalValue: 4344.00,
    gainLoss: 384.00,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    historicalData: [
      { x: "2023-03-15", y: 4087.50 },  // $54.50
      { x: "2023-06-15", y: 4200.00 },  // $56.00
      { x: "2023-09-15", y: 3975.00 },  // $53.00
      { x: "2023-12-15", y: 4275.00 },  // $57.00
      { x: "2024-01-15", y: 4312.50 },  // $57.50
      { x: "2024-02-15", y: 4237.50 },  // $56.50
      { x: "2024-03-15", y: 4344.00 }   // $57.92
    ]
  },
  "BND": {
    returnRate: -2.21,
    totalValue: 7085.00,
    gainLoss: -160.00,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    historicalData: [
      { x: "2023-03-15", y: 7500.00 },  // $75.00
      { x: "2023-06-15", y: 7300.00 },  // $73.00
      { x: "2023-09-15", y: 6900.00 },  // $69.00
      { x: "2023-12-15", y: 7200.00 },  // $72.00
      { x: "2024-01-15", y: 7250.00 },  // $72.50
      { x: "2024-02-15", y: 7150.00 },  // $71.50
      { x: "2024-03-15", y: 7085.00 }   // $70.85
    ]
  },
  "MSFT": {
    returnRate: 36.18,
    totalValue: 5102.64,
    gainLoss: 1355.64,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    historicalData: [
      { x: "2023-03-15", y: 3396.00 },  // $283.00
      { x: "2023-06-15", y: 3960.00 },  // $330.00
      { x: "2023-09-15", y: 3900.00 },  // $325.00
      { x: "2023-12-15", y: 4440.00 },  // $370.00
      { x: "2024-01-15", y: 4680.00 },  // $390.00
      { x: "2024-02-15", y: 4920.00 },  // $410.00
      { x: "2024-03-15", y: 5102.64 }   // $425.22
    ]
  },
  "AMZN": {
    returnRate: 31.92,
    totalValue: 3575.00,
    gainLoss: 865.00,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    historicalData: [
      { x: "2023-03-15", y: 2000.00 },  // $100.00
      { x: "2023-06-15", y: 2600.00 },  // $130.00
      { x: "2023-09-15", y: 2700.00 },  // $135.00
      { x: "2023-12-15", y: 3000.00 },  // $150.00
      { x: "2024-01-15", y: 3300.00 },  // $165.00
      { x: "2024-02-15", y: 3500.00 },  // $175.00
      { x: "2024-03-15", y: 3575.00 }   // $178.75
    ]
  },
  "SCHD": {
    returnRate: 4.85,
    totalValue: 4671.00,
    gainLoss: 216.00,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    historicalData: [
      { x: "2023-03-15", y: 4440.00 },  // $74.00
      { x: "2023-06-15", y: 4260.00 },  // $71.00
      { x: "2023-09-15", y: 4320.00 },  // $72.00
      { x: "2023-12-15", y: 4560.00 },  // $76.00
      { x: "2024-01-15", y: 4620.00 },  // $77.00
      { x: "2024-02-15", y: 4680.00 },  // $78.00
      { x: "2024-03-15", y: 4671.00 }   // $77.85
    ]
  },
  "BTC": {
    returnRate: 96.43,
    totalValue: 51562.50,
    gainLoss: 25312.50,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    historicalData: [
      { x: "2023-03-15", y: 22500.00 },  // $30000
      { x: "2023-06-15", y: 24750.00 },  // $33000
      { x: "2023-09-15", y: 30000.00 },  // $40000
      { x: "2023-12-15", y: 37500.00 },  // $50000
      { x: "2024-01-15", y: 41250.00 },  // $55000
      { x: "2024-02-15", y: 48750.00 },  // $65000
      { x: "2024-03-15", y: 51562.50 }   // $68750
    ]
  },
  "ETH": {
    returnRate: 75.00,
    totalValue: 17325.00,
    gainLoss: 7425.00,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    historicalData: [
      { x: "2023-03-15", y: 9900.00 },   // $2200
      { x: "2023-06-15", y: 11250.00 },  // $2500
      { x: "2023-09-15", y: 13500.00 },  // $3000
      { x: "2023-12-15", y: 15750.00 },  // $3500
      { x: "2024-01-15", y: 16200.00 },  // $3600
      { x: "2024-02-15", y: 16875.00 },  // $3750
      { x: "2024-03-15", y: 17325.00 }   // $3850
    ]
  },
  "SOL": {
    returnRate: 174.32,
    totalValue: 10667.50,
    gainLoss: 6779.25,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    historicalData: [
      { x: "2023-03-15", y: 3825.00 },   // $45.00
      { x: "2023-06-15", y: 5100.00 },   // $60.00
      { x: "2023-09-15", y: 6375.00 },   // $75.00
      { x: "2023-12-15", y: 8500.00 },   // $100.00
      { x: "2024-01-15", y: 9350.00 },   // $110.00
      { x: "2024-02-15", y: 10200.00 },  // $120.00
      { x: "2024-03-15", y: 10667.50 }   // $125.50
    ]
  },
  "LINK": {
    returnRate: 50.00,
    totalValue: 4687.50,
    gainLoss: 1562.50,
    lastUpdated: new Date("2024-03-15T16:00:00Z"),
    historicalData: [
      { x: "2023-03-15", y: 3125.00 },   // $12.50
      { x: "2023-06-15", y: 3500.00 },   // $14.00
      { x: "2023-09-15", y: 3750.00 },   // $15.00
      { x: "2023-12-15", y: 4000.00 },   // $16.00
      { x: "2024-01-15", y: 4250.00 },   // $17.00
      { x: "2024-02-15", y: 4500.00 },   // $18.00
      { x: "2024-03-15", y: 4687.50 }    // $18.75
    ]
  }
};

export const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    userId: 'usr_01',
    name: 'Emergency Fund',
    type: 'EMERGENCY_FUND',
    targetAmount: 10000,
    currentAmount: 5000,
    targetDate: '2024-12-31',
    status: 'IN_PROGRESS'
  },
  {
    id: 'goal-2',
    userId: 'usr_01',
    name: 'Down Payment',
    type: 'SAVINGS',
    targetAmount: 50000,
    currentAmount: 15000,
    targetDate: '2025-06-30',
    status: 'ON_TRACK'
  },
  {
    id: 'goal-3',
    userId: 'usr_01',
    name: 'Student Loan',
    type: 'DEBT_PAYMENT',
    targetAmount: 25000,
    currentAmount: 5000,
    targetDate: '2024-09-30',
    status: 'AT_RISK'
  },
  {
    id: 'goal-4',
    userId: 'usr_01',
    name: 'Retirement Fund',
    type: 'INVESTMENT',
    targetAmount: 100000,
    currentAmount: 0,
    targetDate: '2030-12-31',
    status: 'NOT_STARTED'
  },
  {
    id: 'goal-5',
    userId: 'usr_01',
    name: 'Vacation Fund',
    type: 'CUSTOM',
    targetAmount: 5000,
    currentAmount: 5000,
    targetDate: '2024-03-01',
    status: 'COMPLETED'
  }
]; 