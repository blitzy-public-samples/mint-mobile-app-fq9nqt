/**
 * HUMAN TASKS:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards for all variant colors
 * 2. Test with screen readers to ensure ARIA labels are properly announced
 * 3. Validate progress bar behavior with different viewport sizes
 */

// React v18.0.0
import React from 'react';

// Import theme colors for progress bar variants
import { colors } from '../../config/theme.config';

// Type definition for progress bar style variants
type ProgressBarVariant = 'default' | 'success' | 'warning' | 'danger';

// Props interface with accessibility support
interface ProgressBarProps {
  value: number;
  max: number;
  variant?: ProgressBarVariant;
  label?: string;
  showPercentage?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Calculates the percentage value for the progress bar with validation
 * @param value Current progress value
 * @param max Maximum possible value
 * @returns Calculated percentage between 0 and 100
 */
const calculatePercentage = (value: number, max: number): number => {
  // Validate input values are non-negative
  if (value < 0 || max < 0) {
    return 0;
  }

  // Ensure max value is greater than zero
  if (max <= 0) {
    return 0;
  }

  // Calculate percentage and clamp between 0 and 100
  const percentage = (value / max) * 100;
  return Math.min(Math.max(Math.round(percentage), 0), 100);
};

/**
 * A reusable progress bar component that displays progress or completion status
 * with customizable appearance and behavior, supporting high contrast themes
 * and ARIA accessibility.
 * 
 * Requirements addressed:
 * - Budget Status Display (Technical Specification/8.1.2 Main Dashboard)
 * - Goal Progress Tracking (Technical Specification/6.1.1 Core Application Components)
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  variant = 'default',
  label,
  showPercentage = false,
  className = '',
  ariaLabel,
}) => {
  const percentage = calculatePercentage(value, max);

  // Determine color based on variant
  const getVariantColor = (): string => {
    switch (variant) {
      case 'success':
        return colors.success[500];
      case 'warning':
        return colors.warning[500];
      case 'danger':
        return colors.error[500];
      default:
        return colors.primary[500];
    }
  };

  // Base styles for progress bar container
  const containerStyles: React.CSSProperties = {
    width: '100%',
    backgroundColor: colors.primary[100],
    borderRadius: '0.25rem',
    overflow: 'hidden',
  };

  // Styles for progress bar fill
  const fillStyles: React.CSSProperties = {
    width: `${percentage}%`,
    height: '0.75rem',
    backgroundColor: getVariantColor(),
    transition: 'width 0.3s ease-in-out',
    borderRadius: '0.25rem',
  };

  // Styles for label and percentage text
  const textStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: colors.primary[900],
  };

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div style={textStyles}>
          {label && <span>{label}</span>}
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || label}
        style={containerStyles}
      >
        <div style={fillStyles} />
      </div>
    </div>
  );
};

export default ProgressBar;