// Third-party imports with versions
// jest: ^29.0.0
// ts-jest: ^29.0.0

/**
 * Human Tasks Required:
 * 1. Configure test environment variables in .env.test file
 * 2. Ensure Redis server is running and accessible for integration tests
 * 3. Configure database credentials and permissions for test database
 * 4. Set up SSL certificates if required for secure connections
 * 5. Verify network access to all required test services
 * 6. Configure test logging directory permissions
 * 7. Ensure all test dependencies are installed with correct versions
 */

/** 
 * Jest configuration for Mint Replica Lite test suite
 * Requirements addressed:
 * - Testing Standards (Technical Specification/A.1.2 Code Quality Standards)
 * - Development Standards (Technical Specification/A.4 Development Standards Reference)
 * - Secure Development (Technical Specification/9.3 Security Protocols/9.3.5 Secure Development)
 */
module.exports = {
  // Use ts-jest for TypeScript preprocessing
  preset: 'ts-jest',

  // Set Node.js as the test environment
  testEnvironment: 'node',

  // Root directory for tests
  roots: ['<rootDir>'],

  // File extensions to process
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Module path aliases for clean imports
  moduleNameMapper: {
    '@utils/(.*)': '<rootDir>/utils/$1',
    '@setup/(.*)': '<rootDir>/setup/$1',
    '@contracts/(.*)': '<rootDir>/contracts/$1',
    '@e2e/(.*)': '<rootDir>/e2e/$1',
    '@integration/(.*)': '<rootDir>/integration/$1',
    '@performance/(.*)': '<rootDir>/performance/$1',
    '@security/(.*)': '<rootDir>/security/$1',
    '@accessibility/(.*)': '<rootDir>/accessibility/$1'
  },

  // Global setup files
  setupFilesAfterEnv: ['<rootDir>/setup/global-setup.ts'],

  // Test file patterns to match
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
    '**/e2e/**/*.[jt]s?(x)',
    '**/integration/**/*.[jt]s?(x)',
    '**/contracts/**/*.[jt]s?(x)',
    '**/performance/**/*.[jt]s?(x)',
    '**/security/**/*.[jt]s?(x)',
    '**/accessibility/**/*.[jt]s?(x)'
  ],

  // Enable code coverage collection
  collectCoverage: true,

  // Coverage output directory
  coverageDirectory: '<rootDir>/reports/coverage',

  // Coverage report formats
  coverageReporters: ['text', 'lcov', 'html'],

  // Strict coverage thresholds (>80%)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test timeout in milliseconds
  testTimeout: 30000,

  // Verbose test output
  verbose: true,

  // Stop execution after first test failure
  bail: 1,

  // Limit parallel test execution to 50% of available CPU cores
  maxWorkers: '50%',

  // Global configuration for all tests
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: {
        warnOnly: false
      },
      isolatedModules: true
    }
  },

  // Transform files with ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/reports/'
  ],

  // Coverage collection ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/reports/',
    '/test/utils/',
    '/test/setup/'
  ],

  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/reports/junit',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],

  // Error handling configuration
  errorOnDeprecated: true,
  detectLeaks: true,
  detectOpenHandles: true,

  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Fail tests on console warnings/errors
  silent: false,
  logHeapUsage: true,

  // Security-related settings
  testEnvironmentOptions: {
    url: 'http://localhost',
    referrer: 'http://localhost',
    userAgent: 'jest-test-agent',
    runScripts: 'dangerously'
  },

  // Custom test environment setup
  globalSetup: '<rootDir>/setup/global-setup.ts',
  globalTeardown: '<rootDir>/setup/global-setup.ts'
};