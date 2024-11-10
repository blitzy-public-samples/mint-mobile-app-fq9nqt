import { validate } from './validation.schema';

/**
 * Human Tasks:
 * 1. Set up secure environment variables in production deployment
 * 2. Configure strong JWT secret (min 32 chars) in production
 * 3. Set up encrypted database credentials in production
 * 4. Configure AWS credentials with least-privilege IAM roles
 * 5. Set up Plaid API credentials for production environment
 * 6. Enable Redis password authentication in production
 * 7. Review and update port configurations based on infrastructure
 */

// Default ports with security considerations
const DEFAULT_PORT = 3000; // Must be > 1024 for security
const DEFAULT_DB_PORT = 5432;
const DEFAULT_REDIS_PORT = 6379;

/**
 * Requirement: Backend Framework Stack
 * Location: Technical Specification/7.2.2 Backend Framework Stack
 * Implementation: NestJS configuration factory with comprehensive validation
 */

/**
 * Requirement: Security Architecture
 * Location: Technical Specification/5.4 Security Architecture
 * Implementation: Secure configuration management with strict validation rules
 */

/**
 * Requirement: Data Security
 * Location: Technical Specification/9.2 Data Security
 * Implementation: Encryption and security controls with validated parameters
 */
export default () => {
  // Construct the configuration object
  const config = {
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || DEFAULT_PORT,
    database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || DEFAULT_DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10) || DEFAULT_REDIS_PORT,
      password: process.env.REDIS_PASSWORD || '',
    },
    plaid: {
      clientId: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      environment: process.env.PLAID_ENVIRONMENT || 'sandbox',
    },
    aws: {
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };

  // Validate the configuration against security constraints
  const { error, value } = validate(config);
  
  if (error) {
    throw new Error(`Configuration validation failed: ${error.message}`);
  }

  return value;
};