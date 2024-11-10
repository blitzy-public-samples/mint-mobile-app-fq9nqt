/**
 * Jest Configuration for Mint Replica Lite Backend Service
 * 
 * Human Tasks:
 * 1. Ensure Node.js version 16+ is installed for Jest 29 compatibility
 * 2. Configure CI/CD pipeline to include test coverage reporting
 * 3. Set up test result reporting integration with your monitoring system
 */

// @ts-check

/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  // Addresses requirement: Testing Framework (Technical Specification/7.2 Frameworks and Libraries)
  // Using Jest 29.0+ for unit and integration testing
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  
  // Test file pattern matching
  testRegex: '.*\\.spec\\.ts$',
  
  // TypeScript transformation configuration using ts-jest
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  
  // Coverage collection configuration
  // Addresses requirement: Code Quality Standards (Technical Specification/A.1.2 Code Quality Standards)
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/index.ts',
    '!**/*.mock.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts'
  ],
  coverageDirectory: '../coverage',
  
  // Test environment configuration
  // Addresses requirement: Development Standards (Technical Specification/A.4 Development Standards Reference)
  testEnvironment: 'node',
  
  // Module path mapping for absolute imports
  moduleNameMapper: {
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@database/(.*)$': '<rootDir>/database/$1'
  },
  
  // Coverage thresholds enforcement
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test execution configuration
  testTimeout: 15000,
  maxWorkers: '50%',
  verbose: true,
  
  // Cleanup and error handling
  detectOpenHandles: true,
  forceExit: true,
  
  // Additional Jest configuration options
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Test setup and teardown
  setupFilesAfterEnv: [
    '<rootDir>/../test/jest-setup.ts'
  ],
  
  // Global configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: false,
      isolatedModules: true
    }
  }
};

module.exports = config;