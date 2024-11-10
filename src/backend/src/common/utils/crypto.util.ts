import * as bcrypt from 'bcrypt'; // v5.0.1
import * as crypto from 'crypto'; // Node.js built-in
import configuration from '../../config/configuration';

/**
 * Human Tasks:
 * 1. Ensure secure key storage in production environment
 * 2. Configure hardware security module (HSM) for key management if required
 * 3. Set up key rotation policies and procedures
 * 4. Configure secure environment variables for encryption keys
 * 5. Review and update security parameters based on requirements
 */

// Security constants based on industry standards
const SALT_ROUNDS = 12;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Requirement: Authentication Security
 * Location: Technical Specification/9.1 Authentication and Authorization/9.1.1 Authentication Methods
 * Implementation: Secure password hashing using bcrypt with configurable salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error('Password is required');
  }

  // Validate password complexity
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error('Password does not meet complexity requirements');
  }

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Password hashing failed');
  }
}

/**
 * Requirement: Authentication Security
 * Location: Technical Specification/9.1 Authentication and Authorization/9.1.1 Authentication Methods
 * Implementation: Secure password comparison using timing-safe bcrypt compare
 */
export async function comparePassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
  if (!plainTextPassword || !hashedPassword) {
    throw new Error('Both password and hash are required');
  }

  try {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
}

/**
 * Requirement: Data Security
 * Location: Technical Specification/9.2 Data Security/9.2.1 Encryption Standards
 * Implementation: AES-256-GCM encryption with secure IV generation
 */
export function encryptData(data: string): { iv: string; encryptedData: string; authTag: string } {
  if (!data) {
    throw new Error('Data is required for encryption');
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(configuration().jwt.secret, 'utf-8');
    
    // Ensure key length is exactly 32 bytes for AES-256
    const hash = crypto.createHash('sha256').update(key).digest();
    
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, hash, iv);
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      encryptedData,
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    throw new Error('Data encryption failed');
  }
}

/**
 * Requirement: Data Security
 * Location: Technical Specification/9.2 Data Security/9.2.1 Encryption Standards
 * Implementation: AES-256-GCM decryption with authentication verification
 */
export function decryptData(encryptedData: { iv: string; encryptedData: string; authTag: string }): string {
  if (!encryptedData?.iv || !encryptedData.encryptedData || !encryptedData.authTag) {
    throw new Error('Invalid encrypted data structure');
  }

  try {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const key = Buffer.from(configuration().jwt.secret, 'utf-8');
    const hash = crypto.createHash('sha256').update(key).digest();
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, hash, iv);
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Data decryption failed');
  }
}

/**
 * Requirement: Security Architecture
 * Location: Technical Specification/5.4 Security Architecture
 * Implementation: Cryptographically secure token generation
 */
export function generateSecureToken(bytes: number): string {
  if (!bytes || bytes <= 0) {
    throw new Error('Number of bytes must be positive');
  }

  try {
    const buffer = crypto.randomBytes(bytes);
    // Use URL-safe Base64 encoding
    return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (error) {
    throw new Error('Secure token generation failed');
  }
}

// Export constants for testing and configuration
export const CRYPTO_CONSTANTS = {
  SALT_ROUNDS,
  ENCRYPTION_ALGORITHM,
  IV_LENGTH,
  AUTH_TAG_LENGTH
};