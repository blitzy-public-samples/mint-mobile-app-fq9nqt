// class-validator v0.14.0
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

/**
 * Data Transfer Object for validating user login credentials
 * 
 * Requirements addressed:
 * - Authentication Methods (Technical Specification/9.1.1): 
 *   Implements email/password authentication with 12+ char password requirement
 * - Input Validation (Technical Specification/9.3.1): 
 *   Validates login credentials format with strict input validation
 * - Security Controls (Technical Specification/9.2): 
 *   Enforces password complexity and validation rules
 */
export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email must be a string' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @Matches(
    /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, 
    { message: 'Password must contain uppercase, lowercase, number/special character' }
  )
  password: string;
}