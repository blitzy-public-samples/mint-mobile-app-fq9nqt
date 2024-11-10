// @ts-nocheck
import * as Joi from 'joi'; // ^17.9.0

/**
 * Human Tasks:
 * 1. Ensure environment variables are properly set in deployment configurations
 * 2. Update JWT secret with a secure value (min 32 chars) in production
 * 3. Configure secure database credentials in production
 * 4. Set up proper AWS credentials with limited IAM permissions
 * 5. Configure Plaid API credentials for production environment
 */

/**
 * Requirement: API Security - Input Validation
 * Location: Technical Specification/9.3.1 API Security
 * Implementation: Comprehensive validation schema for all configuration values
 * with strict security constraints
 */

/**
 * Requirement: Backend Framework Stack
 * Location: Technical Specification/7.2.2 Backend Framework Stack
 * Implementation: Configuration validation using Joi as specified in the backend stack
 */

// Environment validation schema
const environmentSchema = Joi.string()
  .required()
  .valid('development', 'production', 'test', 'staging')
  .description('Application environment');

// Port validation schema with safe range
const portSchema = Joi.number()
  .required()
  .min(1024)
  .max(65535)
  .description('Application port number');

// Database configuration schema with security constraints
const databaseSchema = Joi.object({
  host: Joi.string()
    .required()
    .pattern(/^[\w.-]+$/)
    .description('Database hostname'),
  port: Joi.number()
    .required()
    .min(1024)
    .max(65535)
    .description('Database port'),
  username: Joi.string()
    .required()
    .min(3)
    .max(64)
    .description('Database username'),
  password: Joi.string()
    .required()
    .min(8)
    .pattern(/^[ -~]+$/)
    .description('Database password'),
  database: Joi.string()
    .required()
    .pattern(/^[\w-]+$/)
    .description('Database name')
}).required();

// JWT configuration schema with security requirements
const jwtSchema = Joi.object({
  secret: Joi.string()
    .required()
    .min(32)
    .pattern(/^[ -~]+$/)
    .description('JWT secret key'),
  expiresIn: Joi.string()
    .required()
    .pattern(/^\d+[smhd]$/)
    .description('JWT expiration time')
}).required();

// Redis configuration schema with security validation
const redisSchema = Joi.object({
  host: Joi.string()
    .required()
    .pattern(/^[\w.-]+$/)
    .description('Redis hostname'),
  port: Joi.number()
    .required()
    .min(1024)
    .max(65535)
    .description('Redis port'),
  password: Joi.string()
    .pattern(/^[ -~]*$/)
    .allow('')
    .required()
    .description('Redis password')
}).required();

// Plaid API configuration schema with environment restrictions
const plaidSchema = Joi.object({
  clientId: Joi.string()
    .required()
    .pattern(/^[a-zA-Z0-9]+$/)
    .description('Plaid client ID'),
  secret: Joi.string()
    .required()
    .min(32)
    .pattern(/^[ -~]+$/)
    .description('Plaid secret key'),
  environment: Joi.string()
    .required()
    .valid('sandbox', 'development', 'production')
    .description('Plaid API environment')
}).required();

// AWS configuration schema with credential validation
const awsSchema = Joi.object({
  region: Joi.string()
    .required()
    .pattern(/^[a-z]{2}-[a-z]+-\d{1}$/)
    .description('AWS region'),
  accessKeyId: Joi.string()
    .required()
    .pattern(/^[A-Z0-9]{20}$/)
    .description('AWS access key ID'),
  secretAccessKey: Joi.string()
    .required()
    .min(40)
    .pattern(/^[ -~]+$/)
    .description('AWS secret access key')
}).required();

// Complete validation schema combining all configuration sections
export const validationSchema = Joi.object({
  environment: environmentSchema,
  port: portSchema,
  database: databaseSchema,
  jwt: jwtSchema,
  redis: redisSchema,
  plaid: plaidSchema,
  aws: awsSchema
}).required();