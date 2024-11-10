# Mint Replica Lite Backend Service

> Human Tasks:
> 1. Configure environment variables in .env file based on deployment environment
> 2. Set up SSL certificates for HTTPS in production
> 3. Configure Plaid API credentials and environment
> 4. Set up monitoring alerts and logging infrastructure
> 5. Configure database backup schedule and retention policy
> 6. Set up WAF rules and rate limiting thresholds
> 7. Configure Redis cluster for production environment
> 8. Set up JWT RS256 signing keys
> 9. Configure email service for notifications
> 10. Set up CI/CD pipeline credentials

## Project Overview

Mint Replica Lite backend service is a robust, scalable financial management API built with NestJS and TypeScript. The service follows a microservices architecture pattern and implements comprehensive security features.

Key Features:
- Secure user authentication and authorization
- Financial account aggregation via Plaid
- Transaction processing and categorization
- Budget management and tracking
- Investment portfolio monitoring
- Real-time notifications
- Comprehensive API documentation

## Prerequisites

### Required Software
- Node.js 16+ (LTS version recommended)
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose
- Git

### Development Tools
- TypeScript 4.8+
- NestJS CLI 9.0+
- npm 8+

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd src/backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
npm run typeorm migration:run
```

5. Start the development server:
```bash
npm run start:dev
```

## Development

### Project Structure
```
src/
├── common/          # Shared utilities, decorators, and middleware
├── config/          # Configuration modules and validation schemas
├── modules/         # Feature modules (auth, accounts, transactions, etc.)
├── database/        # Database migrations and seeds
├── queue/          # Background job processors
├── health/         # Health check endpoints
└── main.ts         # Application entry point
```

### Development Workflow
1. Create feature branch from development
2. Implement changes following coding standards
3. Write unit and integration tests
4. Update API documentation
5. Create pull request for review

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Maintain minimum 80% test coverage
- Document all public APIs
- Follow SOLID principles

## Testing

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Testing Requirements
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows
- Minimum 80% code coverage
- Security testing compliance

## Deployment

### Production Requirements
- Node.js 16+ runtime
- 2 CPU cores minimum
- 4GB RAM minimum
- PostgreSQL 14+ database
- Redis 6+ cluster
- SSL certificate
- Configured environment variables

### Deployment Steps
1. Build production assets:
```bash
npm run build
```

2. Configure production environment:
```bash
# Set production environment variables
export NODE_ENV=production
export PORT=3000
# Configure other required variables
```

3. Start production server:
```bash
npm run start:prod
```

### Kubernetes Deployment
```bash
# Apply Kubernetes configurations
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secrets.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/ingress.yaml
```

## API Documentation

### OpenAPI Specification
- API documentation available at `/api/docs`
- Swagger UI for interactive testing
- Authentication endpoints
- Account management
- Transaction processing
- Budget operations
- Investment tracking

### Authentication
- JWT-based authentication
- RS256 signing algorithm
- 15-minute access token expiry
- 7-day refresh token rotation
- Rate limiting protection

## Database

### PostgreSQL Configuration
- Connection pooling enabled
- SSL connections required in production
- Automated backups configured
- Read replicas for scaling
- Migration version control

### TypeORM Setup
```typescript
// Database configuration
{
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.NODE_ENV === 'production',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development'
}
```

## Security

### Security Features
- HTTPS enforcement
- CORS protection
- Helmet security headers
- Rate limiting
- SQL injection prevention
- XSS protection
- CSRF tokens
- Request validation
- Audit logging

### Environment Variables
```bash
# Required environment variables
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
```

## Monitoring

### Health Checks
- Database connectivity
- Redis connection
- External service status
- Memory usage
- CPU utilization

### Logging
- ELK Stack integration
- Request/response logging
- Error tracking
- Performance metrics
- Security events

### Metrics
- Prometheus metrics exposed
- Grafana dashboards
- Alert configurations
- Performance monitoring
- Resource utilization

### Alert Configurations
- CPU usage > 80%
- Memory usage > 85%
- Error rate > 1%
- Response time > 500ms
- Failed health checks

## Scripts

### Development Scripts
```bash
npm run start:dev      # Start development server
npm run test:watch    # Run tests in watch mode
npm run lint         # Run ESLint
```

### Production Scripts
```bash
npm run build        # Build production assets
npm run start:prod   # Start production server
```

### Database Scripts
```bash
npm run migration:generate  # Generate new migration
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
```

## Contributing

Please refer to CONTRIBUTING.md for detailed guidelines on:
- Code style guide
- Commit message format
- Pull request process
- Testing requirements
- Documentation standards

## License

Copyright © 2023 Mint Replica Lite. All rights reserved.