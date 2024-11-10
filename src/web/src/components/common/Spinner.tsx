/**
 * A reusable loading spinner component that provides visual feedback during asynchronous operations.
 * Implements WCAG 2.1 compliant loading indicators with customizable size and color.
 * 
 * Requirements addressed:
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 *   Implements loading state indicator following design system specifications
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 *   Ensures loading states are properly communicated to screen readers
 */

// @version: react ^18.0.0
import React from 'react';

// Human tasks:
// 1. Ensure CSS variables for colors are defined in the theme configuration
// 2. Verify that the animation performance is optimized for lower-end devices
// 3. Confirm that the color contrast ratios meet WCAG 2.1 AA standards

interface SpinnerProps {
  /**
   * Size of the spinner: 'small' (16px), 'medium' (24px), or 'large' (32px)
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Color of the spinner: 'primary', 'secondary', or any valid CSS color value
   */
  color?: string;
  
  /**
   * Additional CSS classes to apply to the spinner
   */
  className?: string;
  
  /**
   * Custom aria-label for screen readers
   */
  ariaLabel?: string;
  
  /**
   * Test ID for component testing
   */
  testId?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className = '',
  ariaLabel = 'Loading...',
  testId,
}) => {
  // Map size values to pixel dimensions
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px',
  };

  // Map color values to CSS variables
  const colorMap = {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
  };

  // Determine final size and color values
  const spinnerSize = sizeMap[size as keyof typeof sizeMap];
  const spinnerColor = colorMap[color as keyof typeof colorMap] || color;

  // Styles for the spinner container
  const spinnerStyles: React.CSSProperties = {
    display: 'inline-block',
    width: spinnerSize,
    height: spinnerSize,
    borderRadius: '50%',
    border: `2px solid ${spinnerColor}`,
    borderTopColor: 'transparent',
    animation: 'spin 0.8s linear infinite',
    verticalAlign: 'middle',
  };

  // Keyframe animation for rotation
  const keyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div
        className={`spinner ${className}`.trim()}
        style={spinnerStyles}
        role="status"
        aria-label={ariaLabel}
        data-testid={testId ? 'spinner' : undefined}
      >
        <span className="sr-only" style={{ display: 'none' }}>
          {ariaLabel}
        </span>
      </div>
    </>
  );
};

export default Spinner;