// @ts-check

/** @type {import('@jest/types').Config.InitialOptions} */

// Jest configuration for Mint Replica Lite web application
// Required packages:
// - jest@^29.0.0
// - @testing-library/jest-dom@^5.16.0
// - @types/jest@^29.0.0

/*
Human Tasks:
1. Ensure test/__mocks__/fileMock.js is created for handling static file imports
2. Configure IDE Jest plugin settings to use this configuration
3. Verify that all path aliases in tsconfig.json are correctly mapped in moduleNameMapper
*/

module.exports = {
  // Implements Technical Specification/9.3.5 Secure Development/Phase/Development
  // Configure testing environment and framework settings
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],

  // Implements Technical Specification/A.1.2 Code Quality Standards
  // Configure coverage thresholds and reporting
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test pattern matching
  testMatch: [
    '<rootDir>/tests/**/*.test.(ts|tsx)',
    '<rootDir>/src/**/*.test.(ts|tsx)'
  ],

  // Module resolution and path mapping aligned with tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },

  // TypeScript configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  transformIgnorePatterns: [
    '/node_modules/(?![@autofiy/autofiyable|@autofiy/property]).+\\.js$'
  ],

  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json'
    }
  },

  // Watch plugins for better development experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],

  // Error handling and reporting
  verbose: true,
  bail: 1,
  errorOnDeprecated: true,

  // Test environment configuration
  testEnvironmentOptions: {
    url: 'http://localhost'
  },

  // Cleanup and initialization
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,

  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest'
};