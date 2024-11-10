// Third-party imports
// @version: react ^18.0.0
import React, { useState, useCallback } from 'react';
// @version: classnames ^2.3.2
import classNames from 'classnames';

// Internal imports
import { Input } from '../common/Input';
import { validateEmail } from '../../utils/validation.utils';
import { requestPasswordReset } from '../../services/api/auth.api';

/**
 * Human Tasks:
 * 1. Verify email service configuration for password reset emails
 * 2. Test screen reader compatibility with form error states
 * 3. Confirm form submission throttling settings
 * 4. Validate WCAG 2.1 color contrast compliance
 * 5. Test touch target sizes on mobile devices
 */

interface ForgotPasswordFormProps {
  onSuccess: (email: string) => void;
  onCancel: () => void;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * ForgotPasswordForm component for handling password reset requests
 * Addresses requirements:
 * - Authentication Methods (Technical Specification/9.1.1 Authentication Methods)
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 */
export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
  onCancel,
  className,
  'aria-label': ariaLabel = 'Password reset request form',
  'aria-describedby': ariaDescribedBy
}) => {
  // Form state
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle email input changes with validation
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (error && validateEmail(value)) {
      setError('');
    }
  }, [error]);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate email format
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await requestPasswordReset(email);
      onSuccess(email);
    } catch (err) {
      setError('Unable to process your request. Please try again later.');
      // Update aria-live region for screen readers
      const statusElement = document.getElementById('form-status');
      if (statusElement) {
        statusElement.textContent = 'Error: Unable to process your request. Please try again later.';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formClasses = classNames(
    'forgot-password-form',
    {
      'forgot-password-form--loading': isLoading
    },
    className
  );

  return (
    <form
      className={formClasses}
      onSubmit={handleSubmit}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      noValidate
    >
      {/* Status message for screen readers */}
      <div
        id="form-status"
        className="sr-only"
        role="status"
        aria-live="polite"
      />

      <Input
        type="email"
        name="email"
        label="Email Address"
        value={email}
        onChange={handleEmailChange}
        error={error}
        required
        disabled={isLoading}
        aria-describedby="email-hint"
      />

      <div id="email-hint" className="form-hint">
        Enter the email address associated with your account to receive password reset instructions
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Cancel password reset"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading}
          aria-label="Request password reset"
          aria-busy={isLoading}
        >
          {isLoading ? 'Sending...' : 'Reset Password'}
        </button>
      </div>

      {error && (
        <div
          className="form-error"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
    </form>
  );
};

export default ForgotPasswordForm;