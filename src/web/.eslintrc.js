// ESLint configuration for Mint Replica Lite web application
// @version 1.0.0

// External dependencies versions:
// eslint: ^8.0.0
// @typescript-eslint/parser: ^5.0.0
// @typescript-eslint/eslint-plugin: ^5.0.0
// eslint-plugin-react: ^7.32.0
// eslint-plugin-react-hooks: ^4.6.0
// eslint-config-prettier: ^8.0.0
// eslint-plugin-import: ^2.26.0

/* Human Tasks:
1. Ensure all listed dependencies are installed in package.json with correct versions
2. Verify that Prettier is configured and installed for code formatting
3. Configure your IDE/editor to use this ESLint configuration
4. Set up pre-commit hooks to run ESLint before commits
5. Configure CI pipeline to run ESLint checks
*/

module.exports = {
  // Implements Technical Specification/5.3.1 Frontend Technologies
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true
  },

  // Implements Technical Specification/A.4 Development Standards Reference/Code Standards
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'prettier' // Must be last to override other configs
  ],

  // TypeScript parser configuration
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    project: './tsconfig.json'
  },

  // Required plugins
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import'
  ],

  // Plugin-specific settings
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  },

  // Implements Technical Specification/A.1.2 Code Quality Standards
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/explicit-function-return-type': 'off', // Allow type inference
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Allow type inference for exported functions
    '@typescript-eslint/no-explicit-any': 'error', // Enforce type safety
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_' // Allow unused variables that start with underscore
    }],
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports'
    }],
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/no-floating-promises': 'error',

    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    'react-hooks/rules-of-hooks': 'error', // Enforce hooks rules
    'react-hooks/exhaustive-deps': 'warn', // Warn about missing dependencies
    'react/prop-types': 'off', // Not needed with TypeScript
    'react/jsx-no-target-blank': 'error',
    'react/jsx-key': ['error', { checkFragmentShorthand: true }],

    // Import/export rules
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc'
      }
    }],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    'import/no-useless-path-segments': 'error',

    // General code quality rules
    'no-console': ['warn', {
      allow: ['warn', 'error']
    }],
    'eqeqeq': ['error', 'always'], // Require strict equality
    'curly': ['error', 'all'], // Require curly braces
    'no-var': 'error',
    'prefer-const': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'no-shadow': 'error',
    'no-return-await': 'error',
    'require-await': 'error',
    'no-throw-literal': 'error',
    'prefer-template': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'object-shorthand': ['error', 'always'],
    'max-depth': ['error', 4],
    'max-lines': ['error', {
      max: 300,
      skipBlankLines: true,
      skipComments: true
    }],
    'complexity': ['error', {
      max: 15 // Implements requirement for complexity <15
    }]
  },

  // Override rules for specific file patterns
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'max-lines': 'off'
      }
    },
    {
      files: ['vite.config.ts', '*.config.ts', '*.config.js'],
      rules: {
        'import/no-default-export': 'off'
      }
    }
  ]
};