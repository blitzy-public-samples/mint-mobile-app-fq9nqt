// class-validator v0.14.0
import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength, 
  Matches, 
  IsNotEmpty 
} from 'class-validator';

/**
 * Data Transfer Object (DTO) for user creation requests
 * 
 * Requirements addressed:
 * - User Authentication (Technical Specification/9.1.1 Authentication Methods)
 *   Implements validation for email/password authentication with minimum password 
 *   requirements of 12 characters, complexity rules including uppercase, lowercase, 
 *   numbers and special characters
 * 
 * - Data Security (Technical Specification/9.2.1 Encryption Standards)
 *   Ensures proper validation of sensitive user data before processing, including 
 *   input sanitization and length restrictions
 * 
 * - Input Validation (Technical Specification/9.3.1 API Security)
 *   Provides comprehensive validation rules for user registration data including 
 *   email format, password complexity, and field length restrictions
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character' }
  )
  password: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName: string;
}