/**
 * HUMAN TASKS:
 * 1. Configure password complexity requirements in validation constants
 * 2. Set up error tracking service integration
 * 3. Test form submission with screen readers
 * 4. Verify color contrast ratios meet WCAG 2.1 standards
 * 5. Test keyboard navigation flow
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useState, useCallback } from 'react';

// Internal imports
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { login } from '../../services/api/auth.api';
import { LoginCredentials, AuthResponse } from '../../types/auth.types';

/**
 * Props interface for LoginForm component
 */
interface LoginFormProps {
  onSuccess: (response: AuthResponse) => void;
  onError: (error: Error) => void;
}

/**
 * LoginForm component implementing secure authentication with email/password
 * Addresses requirements:
 * - Technical Specification/9.1.1 Authentication Methods
 * - Technical Specification/8.1 User Interface Design
 * - Technical Specification/8.1.8 Accessibility Features
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError
}) => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validates email format
   * Implements email validation requirements
   */
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    setErrors(prev => ({
      ...prev,
      email: value.length === 0 
        ? 'Email is required'
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? 'Please enter a valid email address'
          : undefined
    }));
  }, []);

  /**
   * Validates password complexity
   * Implements password requirements from Technical Specification/9.1.1
   */
  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    setErrors(prev => ({
      ...prev,
      password: value.length === 0
        ? 'Password is required'
        : value.length < 12
          ? 'Password must be at least 12 characters long'
          : !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)
            ? 'Password must include uppercase, lowercase, number and special character'
            : undefined
    }));
  }, []);

  /**
   * Handles form submission and authentication
   * Implements secure login functionality
   */
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate form before submission
    const formErrors = {
      email: !email ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Invalid email format' : undefined,
      password: !password ? 'Password is required' : password.length < 12 ? 'Password must be at least 12 characters' : undefined
    };

    setErrors(formErrors);

    // Check for validation errors
    if (Object.values(formErrors).some(error => error)) {
      return;
    }

    setIsLoading(true);

    try {
      const credentials: LoginCredentials = {
        email,
        password
      };

      const response = await login(credentials);
      
      // Clear form on successful login
      setEmail('');
      setPassword('');
      setErrors({});
      
      onSuccess(response);
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [email, password, onSuccess, onError]);

  return (
    <form 
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
      aria-label="Login form"
    >
      <Input
        type="email"
        name="email"
        label="Email Address"
        value={email}
        onChange={handleEmailChange}
        error={errors.email}
        required
        aria-label="Email address"
        disabled={isLoading}
      />

      <Input
        type="password"
        name="password"
        label="Password"
        value={password}
        onChange={handlePasswordChange}
        error={errors.password}
        required
        aria-label="Password"
        disabled={isLoading}
      />

      <Button
        type="submit"
        variant="primary"
        size="large"
        isLoading={isLoading}
        disabled={isLoading || Object.values(errors).some(error => error)}
        className="w-full"
        ariaLabel="Sign in"
      >
        Sign In
      </Button>
    </form>
  );
};

export default LoginForm;