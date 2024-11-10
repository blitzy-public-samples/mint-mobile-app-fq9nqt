// Human Tasks:
// 1. Install required ESLint dependencies listed in package.json
// 2. Configure IDE/editor to use project's ESLint configuration
// 3. Set up pre-commit hooks to run ESLint checks
// 4. Ensure TypeScript and Node.js versions match project requirements

/** @type {import('eslint').Linter.Config} */
module.exports = {
  // Requirement: Backend Technologies - Configures linting for Node.js 16+ with TypeScript runtime environment
  parser: '@typescript-eslint/parser', // @typescript-eslint/parser@^5.0.0
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
    ecmaVersion: 2020,
    tsconfigRootDir: __dirname,
  },

  // Requirement: Development Standards - Implements TypeScript style guide and coding standards
  plugins: [
    '@typescript-eslint/eslint-plugin', // @typescript-eslint/eslint-plugin@^5.0.0
    'prettier', // eslint-plugin-prettier@^4.0.0
  ],

  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // eslint-config-prettier@^8.3.0
  ],

  root: true,

  env: {
    node: true,
    jest: true,
  },

  ignorePatterns: [
    '.eslintrc.js',
    'dist',
    'node_modules',
    'coverage',
    '*.js',
    '*.d.ts',
  ],

  // Requirement: Code Quality Standards - Enforces code quality standards including complexity limits
  rules: {
    // TypeScript-specific rules
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-empty-interface': 'error',
    '@typescript-eslint/no-inferrable-types': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I']
      },
      {
        selector: 'enum',
        format: ['PascalCase']
      }
    ],

    // Code complexity rules
    'complexity': ['error', 15], // Maximum cyclomatic complexity
    'max-lines-per-function': ['error', 50], // Maximum lines per function
    'max-depth': ['error', 4], // Maximum block nesting depth
    'max-params': ['error', 4], // Maximum number of parameters
    'max-nested-callbacks': ['error', 3], // Maximum callback nesting

    // General code quality rules
    'no-console': 'warn',
    'no-duplicate-imports': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-unused-expressions': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'no-return-await': 'error',
    'require-await': 'error',

    // NestJS-specific rules
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
    '@typescript-eslint/no-parameter-properties': 'off',

    // Prettier integration
    'prettier/prettier': ['error', {
      singleQuote: true,
      trailingComma: 'all',
      endOfLine: 'lf',
    }],

    // Error prevention rules
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    'no-throw-literal': 'error',
    'no-return-assign': ['error', 'always'],
    'no-promise-executor-return': 'error',

    // Code style rules
    'arrow-body-style': ['error', 'as-needed'],
    'curly': ['error', 'all'],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'return' },
      { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
      { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] }
    ],
  },

  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: 'tsconfig.json',
      },
    },
  },

  overrides: [
    {
      files: ['*.spec.ts', '*.e2e-spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'max-lines-per-function': 'off',
      },
    },
  ],
};