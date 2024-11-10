// @package class-validator ^0.14.0
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object for user registration with comprehensive validation rules
 * 
 * Requirements addressed:
 * - User Authentication (Technical Specification/9.1.1 Authentication Methods)
 *   Implements email/password registration with validation rules including 12-character 
 *   minimum password length and complexity requirements
 * 
 * - Data Security (Technical Specification/9.2.1 Encryption Standards)
 *   Ensures secure user data validation during registration with strict input validation rules
 * 
 * - Input Validation (Technical Specification/9.3.1 API Security)
 *   Validates registration input data using class-validator with comprehensive validation rules
 *   for all fields
 */
export class RegisterDto {
    @IsNotEmpty()
    @IsEmail()
    @MaxLength(255)
    email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(12)
    @MaxLength(72)
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        { message: 'Password must contain uppercase, lowercase, number and special character' }
    )
    password: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    firstName: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    lastName: string;
}