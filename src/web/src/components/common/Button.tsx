/**
 * HUMAN TASKS:
 * 1. Verify button touch targets meet minimum size requirements on mobile devices
 * 2. Test button interactions with screen readers and keyboard navigation
 * 3. Validate color contrast ratios in all button variants and states
 */

// Third-party imports
// @version: react ^18.0.0
import React from 'react';
// @version: classnames ^2.3.2
import classNames from 'classnames';

// Internal imports
import { ButtonProps } from '../../types/components.types';
// import { colors } from '../../config/theme.config';

/**
 * Generates class names for button styling based on variant, size, and state
 * Addresses requirement: User Interface Design - Design System Implementation
 */
const getButtonClasses = (props: ButtonProps): string => {
  const {
    variant,
    size,
    disabled,
    isLoading,
    className
  } = props;

  // Base classes including minimum touch target size (44x44 points)
  const baseClasses = 'inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Size-specific classes
  const sizeClasses = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  // Variant-specific classes using theme color tokens
  const variantClasses = {
    primary: `bg-primary-300 hover:bg-primary-400 active:bg-primary-500 focus:ring-primary-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    secondary: `bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300 focus:ring-neutral-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    outline: `border-2 border-primary-500 text-primary-500 bg-transparent hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    text: `text-primary-500 bg-transparent hover:bg-primary-100 active:bg-primary-100 focus:ring-primary-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    danger: `bg-error-400 hover:bg-error-500 active:bg-error-600 focus:ring-error-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`,
    success: `bg-success-500 hover:bg-success-600 active:bg-success-700 focus:ring-success-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
  };

  // Loading state classes
  const loadingClasses = isLoading ? 'relative !text-transparent' : '';

  // High contrast mode support
  const highContrastClasses = '@media (forced-colors: active) { border: 1px solid ButtonText; }';

  return classNames(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    loadingClasses,
    highContrastClasses,
    className
  );
};

/**
 * Button component implementing the design system's button styles and behaviors
 * Addresses requirements:
 * - User Interface Design (8.1.1 Design System)
 * - Accessibility Features (8.1.8 WCAG Compliance)
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children,
  className,
  ariaLabel,
  isLoading = false,
  ...props
}) => {
  return (
    <button
      type="button"
      className={getButtonClasses({
        variant,
        size,
        disabled,
        isLoading,
        className,
        onClick,
        children,
        ariaLabel
      })}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
};

export default Button;