/**
 * Human Tasks:
 * 1. Verify password complexity requirements in validation constants
 * 2. Configure error tracking service integration
 * 3. Test form submission with screen readers
 * 4. Validate WCAG 2.1 compliance for error states
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useState, useCallback } from 'react';

// Internal imports
import { RegisterCredentials, AuthResponse } from '../../types/auth.types';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { register } from '../../services/api/auth.api';
import { validateEmail, validatePassword } from '../../utils/validation.utils';

/**
 * Props interface for RegisterForm component
 */
interface RegisterFormProps {
  onSuccess: (response: AuthResponse) => void;
  onError: (error: Error) => void;
}

/**
 * Interface for form field state management
 */
interface FormState {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Interface for form validation error messages
 */
interface ValidationErrors {
  email: string | null;
  password: string | null;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Registration form component implementing secure user registration
 * Addresses requirements:
 * - Technical Specification/9.1.1 Authentication Methods: Email/password registration
 * - Technical Specification/8.1 User Interface Design: Form layout and styling
 * - Technical Specification/9.2 Data Security/9.2.1 Data Classification: Input validation
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onError }) => {
  // Form state management
  const [formData, setFormData] = useState<FormState>({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  // Validation errors state
  const [errors, setErrors] = useState<ValidationErrors>({
    email: null,
    password: null,
    firstName: null,
    lastName: null
  });

  // Loading state for submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validates all form fields against security and business rules
   */
  const validateForm = useCallback((data: FormState): ValidationErrors => {
    const newErrors: ValidationErrors = {
      email: null,
      password: null,
      firstName: null,
      lastName: null
    };

    // Email validation
    if (!data.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(data.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation with complexity rules
    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(data.password)) {
      newErrors.password = 'Password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters';
    }

    // First name validation
    if (!data.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (data.firstName.length > 50) {
      newErrors.firstName = 'First name must not exceed 50 characters';
    }

    // Last name validation
    if (!data.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (data.lastName.length > 50) {
      newErrors.lastName = 'Last name must not exceed 50 characters';
    }

    return newErrors;
  }, []);

  /**
   * Handles input field value changes with validation
   */
  const handleInputChange = useCallback((field: keyof FormState, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    setErrors(prev => ({
      ...prev,
      [field]: null
    }));

    // Real-time validation for email and password
    if (field === 'email' && value) {
      if (!validateEmail(value)) {
        setErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address'
        }));
      }
    }
    if (field === 'password' && value) {
      if (!validatePassword(value)) {
        setErrors(prev => ({
          ...prev,
          password: 'Password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters'
        }));
      }
    }
  }, []);

  /**
   * Handles form submission and registration API call
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate all fields
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    // Check if there are any validation errors
    if (Object.values(validationErrors).some(error => error !== null)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create registration credentials object
      const credentials: RegisterCredentials = {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim()
      };

      // Call registration API
      const response = await register(credentials);
      
      // Handle successful registration
      onSuccess(response);

      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
      });
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="register-form"
      noValidate
      aria-label="Registration form"
    >
      <div className="form-fields">
        <Input
          type="text"
          name="firstName"
          label="First Name"
          value={formData.firstName}
          onChange={(value) => handleInputChange('firstName', value)}
          error={errors.firstName}
          required
          aria-required="true"
        />

        <Input
          type="text"
          name="lastName"
          label="Last Name"
          value={formData.lastName}
          onChange={(value) => handleInputChange('lastName', value)}
          error={errors.lastName}
          required
          aria-required="true"
        />

        <Input
          type="email"
          name="email"
          label="Email Address"
          value={formData.email}
          onChange={(value) => handleInputChange('email', value)}
          error={errors.email}
          required
          aria-required="true"
        />

        <Input
          type="password"
          name="password"
          label="Password"
          value={formData.password}
          onChange={(value) => handleInputChange('password', value)}
          error={errors.password}
          helperText="Must be at least 12 characters with uppercase, lowercase, numbers, and special characters"
          required
          aria-required="true"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        isLoading={isSubmitting}
        className="w-full mt-6"
        aria-label="Create account"
      >
        Create Account
      </Button>
    </form>
  );
};

export default RegisterForm;