// Third-party imports
// @version: react ^18.0.0
import React, { useState, useCallback, useRef, useEffect } from 'react';
// @version: classnames ^2.3.2
import classNames from 'classnames';

// Internal imports
import { InputProps } from '../../types/components.types';
import { validateEmail } from '../../utils/validation.utils';

/**
 * Human Tasks:
 * 1. Verify WCAG 2.1 color contrast ratios in theme configuration
 * 2. Confirm touch target sizes meet 44x44 points requirement
 * 3. Test with screen readers for proper ARIA label announcements
 * 4. Validate input masks align with data format requirements
 */

/**
 * Input component implementing design system specifications with validation and accessibility
 * Addresses requirements:
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 * - Input Validation (Technical Specification/9.2 Data Security/9.2.1 Data Classification)
 */
export const Input: React.FC<InputProps> = ({
  type = 'text',
  name,
  value,
  placeholder,
  disabled = false,
  onChange,
  error,
  label,
  required = false,
  helperText,
  className
}) => {
  // State for internal validation
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Input validation based on type
  const validateInput = useCallback((value: string): boolean => {
    switch (type) {
      case 'email':
        return validateEmail(value);
      case 'tel':
        return /^\+?[\d\s-()]{10,}$/.test(value);
      case 'number':
        return !isNaN(Number(value)) && value.length > 0;
      case 'date':
        return !isNaN(Date.parse(value));
      default:
        return true;
    }
  }, [type]);

  // Sanitize input to prevent XSS
  const sanitizeInput = (value: string): string => {
    return value
      .replace(/[<>]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  };

  // Handle input change with validation
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const sanitizedValue = sanitizeInput(newValue);
    
    if (required && sanitizedValue.length === 0) {
      setInternalError('This field is required');
    } else if (!validateInput(sanitizedValue)) {
      setInternalError(`Invalid ${type} format`);
    } else {
      setInternalError('');
    }

    onChange(sanitizedValue);
  }, [onChange, required, type, validateInput]);

  // Handle input blur for validation feedback
  const handleBlur = useCallback(() => {
    setTouched(true);
    
    if (required && !value) {
      setInternalError('This field is required');
    } else if (!validateInput(value)) {
      setInternalError(`Invalid ${type} format`);
    }

    // Trigger screen reader announcement for validation errors
    if (internalError && inputRef.current) {
      inputRef.current.setAttribute('aria-invalid', 'true');
    }
  }, [required, value, validateInput, type, internalError]);

  // Update aria-invalid when error prop changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setAttribute('aria-invalid', (!!error || !!internalError).toString());
    }
  }, [error, internalError]);

  const inputClasses = classNames(
    'input-field',
    {
      'input-field--error': (touched && (!!error || !!internalError)),
      'input-field--disabled': disabled,
      'input-field--with-label': !!label
    },
    className
  );

  const inputId = `input-${name}`;
  const errorId = `error-${name}`;
  const helperId = `helper-${name}`;

  return (
    <div className="input-container">
      {label && (
        <label 
          htmlFor={inputId}
          className="input-label"
        >
          {label}
          {required && <span className="input-required" aria-hidden="true">*</span>}
        </label>
      )}
      
      <input
        ref={inputRef}
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClasses}
        aria-required={required}
        aria-invalid={touched && (!!error || !!internalError)}
        aria-describedby={`${error || internalError ? errorId : ''} ${helperText ? helperId : ''}`}
        // Ensure minimum touch target size of 44x44 points
        style={{ minHeight: '44px', minWidth: '44px' }}
      />

      {(touched && (error || internalError)) && (
        <div 
          id={errorId}
          className="input-error"
          role="alert"
        >
          {error || internalError}
        </div>
      )}

      {helperText && (
        <div 
          id={helperId}
          className="input-helper-text"
        >
          {helperText}
        </div>
      )}
    </div>
  );
};

export default Input;