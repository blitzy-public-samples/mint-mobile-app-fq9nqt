# Mint Replica Lite Web Application

A modern financial management web application with mobile-first design built with React and TypeScript.

## Human Tasks
1. Create `.env` file based on `.env.example` and configure environment variables
2. Set up SSL certificates for local HTTPS development
3. Configure CDN settings if using one in production
4. Review and adjust Content Security Policy headers for production
5. Set up monitoring tools for build performance tracking

## Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Git for version control
- SSL certificates for local HTTPS development

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd src/web
```

2. Install dependencies:
```bash
npm install
```

3. Create and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start development server:
```bash
npm run dev
```

The application will be available at `https://localhost:3000`

## Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally

### Testing
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

### Code Quality
- `npm run lint` - Lint source files
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type check TypeScript files

## Architecture

### Folder Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Page components and routing
├── services/      # API and external service integrations
├── hooks/         # Custom React hooks
├── utils/         # Utility functions and helpers
├── types/         # TypeScript type definitions
├── styles/        # Global styles and theme configuration
├── contexts/      # React context providers
└── assets/        # Static assets
```

## Development Standards

### Code Quality Requirements
- Minimum 80% test coverage
- ESLint with TypeScript rules enabled
- Prettier for consistent code formatting
- Strict TypeScript mode
- Git hooks for pre-commit validation

### Performance Standards
- Bundle size optimization with code splitting
- Lazy loading for routes and heavy components
- Caching strategy for static assets and API responses
- Mobile-first responsive design
- Core Web Vitals optimization

### Security Standards
- JWT-based authentication
- Secure storage for sensitive data
- HTTPS enforced
- CORS configuration
- Regular security audits
- Content Security Policy implementation

## Dependencies

### Core Dependencies
- react ^18.2.0 - Core React library
- react-dom ^18.2.0 - React DOM bindings
- react-router-dom ^6.11.0 - Routing
- @reduxjs/toolkit ^1.9.5 - State management
- axios ^1.4.0 - HTTP client
- chart.js ^4.3.0 - Data visualization
- date-fns ^2.30.0 - Date utilities
- plaid ^13.0.0 - Plaid integration
- zod ^3.21.0 - Schema validation

### Development Dependencies
- typescript ^4.8.0 - TypeScript language
- vite ^4.3.0 - Build tool
- jest ^29.5.0 - Testing framework
- @testing-library/react ^14.0.0 - React testing utilities
- eslint ^8.39.0 - Linting
- prettier ^2.8.8 - Code formatting

## Browser Support

### Production
- >0.2%
- not dead
- not op_mini all

### Development
- Last 1 Chrome version
- Last 1 Firefox version
- Last 1 Safari version

## Deployment

1. Build the production bundle:
```bash
npm run build
```

2. Preview the production build locally:
```bash
npm run preview
```

3. Deploy the `dist` directory to your hosting service

## Contributing

1. Ensure all tests pass:
```bash
npm test
```

2. Verify code quality:
```bash
npm run lint
npm run typecheck
```

3. Format code before committing:
```bash
npm run format
```

4. Follow the Git commit message conventions
5. Create pull requests for all changes
6. Ensure CI/CD pipeline passes

## License

UNLICENSED - Private repository