# Mint Replica Lite API Documentation

> Human Tasks:
> 1. Configure rate limiting settings in production environment
> 2. Set up monitoring alerts for authentication failures
> 3. Configure JWT RS256 signing keys in production
> 4. Set up WAF rules in production environment
> 5. Configure Plaid API credentials and environment variables

## Introduction

This document provides comprehensive documentation for the Mint Replica Lite API v1. The API follows REST principles and uses OpenAPI 3.0 specifications.

**Base URL**: `/api/v1`  
**API Version**: v1  
**Content Type**: application/json

### Authentication

All API requests require authentication using JWT tokens with RS256 signing. Access tokens expire after 15 minutes, while refresh tokens are valid for 7 days.

```typescript
// Request headers
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Rate Limiting

```typescript
// Rate limit headers
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1640995200
```

- 100 requests per minute per IP
- 1000 requests per hour per user
- Exponential backoff recommended for retry attempts

## Authentication Endpoints

### POST /auth/login

Authenticates a user and returns JWT tokens.

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "deviceId": "string"
}
```

**Response:** (200 OK)
```json
{
  "accessToken": "string", // 15-minute expiry
  "refreshToken": "string", // 7-day expiry
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string"
  }
}
```

### POST /auth/register

Registers a new user account.

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "deviceId": "string"
}
```

**Response:** (201 Created)
```json
{
  "accessToken": "string",
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "createdAt": "string"
  }
}
```

### POST /auth/refresh

Refreshes an expired access token.

**Request:**
```json
{
  "refreshToken": "string"
}
```

**Response:** (200 OK)
```json
{
  "accessToken": "string",
  "expiresIn": 900 // 15 minutes in seconds
}
```

### POST /auth/logout

Invalidates the current session.

**Request:**
```json
{
  "userId": "string",
  "deviceId": "string"
}
```

**Response:** (204 No Content)

## Account Management Endpoints

### GET /accounts

Retrieves all accounts for the authenticated user.

**Response:** (200 OK)
```json
{
  "accounts": [
    {
      "id": "string",
      "institutionId": "string",
      "accountType": "CHECKING | SAVINGS | CREDIT | INVESTMENT",
      "name": "string",
      "balance": "number",
      "currency": "string",
      "lastSynced": "string",
      "isActive": "boolean"
    }
  ]
}
```

### POST /accounts

Creates a new financial account connection.

**Request:**
```json
{
  "institutionId": "string",
  "publicToken": "string", // Plaid public token
  "accountType": "CHECKING | SAVINGS | CREDIT | INVESTMENT",
  "name": "string"
}
```

**Response:** (201 Created)
```json
{
  "id": "string",
  "institutionId": "string",
  "accountType": "string",
  "name": "string",
  "balance": "number",
  "currency": "string",
  "lastSynced": "string"
}
```

### GET /accounts/{id}

Retrieves details for a specific account.

**Response:** (200 OK)
```json
{
  "id": "string",
  "institutionId": "string",
  "accountType": "string",
  "name": "string",
  "balance": "number",
  "currency": "string",
  "lastSynced": "string",
  "transactions": [
    {
      "id": "string",
      "date": "string",
      "description": "string",
      "amount": "number",
      "category": "string"
    }
  ]
}
```

### PUT /accounts/{id}

Updates account information.

**Request:**
```json
{
  "name": "string",
  "isActive": "boolean"
}
```

**Response:** (200 OK)
```json
{
  "id": "string",
  "name": "string",
  "isActive": "boolean",
  "updatedAt": "string"
}
```

### DELETE /accounts/{id}

Deactivates an account connection.

**Response:** (204 No Content)

### POST /accounts/{id}/sync

Synchronizes account data with the financial institution.

**Response:** (200 OK)
```json
{
  "status": "SUCCESS | PENDING | FAILED",
  "lastSynced": "string",
  "newTransactions": "number"
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object | null"
  }
}
```

### HTTP Status Codes

- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity
- 429: Too Many Requests
- 500: Internal Server Error

### Common Error Codes

```typescript
const ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH001',
  TOKEN_EXPIRED: 'AUTH002',
  INVALID_TOKEN: 'AUTH003',
  ACCOUNT_NOT_FOUND: 'ACC001',
  SYNC_FAILED: 'SYNC001',
  RATE_LIMIT_EXCEEDED: 'RATE001',
  VALIDATION_ERROR: 'VAL001'
};
```

## Security Measures

### API Security Controls

1. JWT Authentication with RS256 signing
2. Rate limiting per IP and user
3. Request payload validation
4. SQL injection prevention
5. XSS protection
6. CSRF tokens for state-changing operations
7. WAF protection
8. HTTPS only with TLS 1.3
9. Secure headers implementation
10. OWASP compliance

### Data Security

```typescript
// Security headers
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## Integration Patterns

### Plaid Integration

1. Initialize Plaid Link
2. Exchange public token
3. Store access token securely
4. Sync account data
5. Handle webhooks for updates

```typescript
// Plaid Link flow
POST /plaid/link/token
-> Receive link token
-> Initialize Plaid Link
-> Receive public token
POST /plaid/exchange_token
-> Store access token
-> Begin account sync
```

### Webhook Events

```json
{
  "webhook_type": "TRANSACTIONS",
  "webhook_code": "SYNC_UPDATES_AVAILABLE",
  "item_id": "string",
  "account_ids": ["string"],
  "timestamp": "string"
}
```

## Data Models

### User Model

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  preferences: {
    notifications: boolean;
    defaultCurrency: string;
  };
}
```

### Account Model

```typescript
interface Account {
  id: string;
  userId: string;
  institutionId: string;
  accountType: AccountType;
  name: string;
  balance: number;
  currency: string;
  lastSynced: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: {
    plaidItemId?: string;
    plaidAccessToken?: string;
    lastSuccessfulSync?: string;
  };
}
```

### Transaction Model

```typescript
interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  pending: boolean;
  metadata: {
    plaidTransactionId?: string;
    merchantName?: string;
    location?: {
      address?: string;
      city?: string;
      country?: string;
    };
  };
}
```

## API Versioning

API versioning is managed through URL path prefixing:

- Current version: `/api/v1/*`
- Future versions: `/api/v2/*`

Version changes follow semantic versioning:
- MAJOR: Breaking changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes, backward compatible

## Rate Limiting

```typescript
// Rate limit implementation
const RATE_LIMITS = {
  IP_RATE: {
    window: '1m',
    max: 100
  },
  USER_RATE: {
    window: '1h',
    max: 1000
  },
  AUTH_RATE: {
    window: '15m',
    max: 5
  }
};
```

## API Changelog

### Version 1.0.0 (Current)
- Initial API release
- Basic authentication flows
- Account management
- Transaction sync
- Plaid integration

### Version 1.1.0 (Planned)
- Enhanced security measures
- Improved rate limiting
- Additional account types
- Extended transaction data
- Webhook improvements

## Support and Contact

For API support and technical questions:
- Email: api-support@mintreplicalite.com
- Documentation: https://docs.mintreplicalite.com
- Status page: https://status.mintreplicalite.com

## License

Copyright © 2023 Mint Replica Lite. All rights reserved.