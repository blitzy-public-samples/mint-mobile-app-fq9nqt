/**
 * A reusable card component that provides a consistent container style with optional title,
 * loading state, and customizable content. Implements the design system's card styles with
 * proper accessibility features and responsive behavior.
 * 
 * Requirements addressed:
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 *   Implements card container component following design system specifications
 * - Mobile-First Design (Technical Specification/1.1 System Overview)
 *   Ensures responsive behavior and proper touch targets
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 *   Implements proper ARIA attributes and keyboard navigation support
 */

// @version: react ^18.0.0
import React from 'react';
// @version: classnames ^2.3.2
import classNames from 'classnames';

// Internal imports
import { CardProps } from '../../types/components.types';
import Spinner from './Spinner';

// Human tasks:
// 1. Verify that CSS variables for shadows and colors are defined in the theme
// 2. Confirm touch target sizes meet minimum 44x44px requirement for mobile
// 3. Validate color contrast ratios meet WCAG 2.1 AA standards
// 4. Test high contrast mode compatibility

const Card: React.FC<CardProps> = ({
  title,
  children,
  loading = false,
  className = '',
  testId,
  onClick,
  elevated = false,
  style,
}) => {
  // Combine CSS classes based on props
  const cardClasses = classNames(
    'card',
    {
      'card--elevated': elevated,
      'card--loading': loading,
    },
    className
  );

  // Base styles following design system specifications
  const styles = {
    card: {
      backgroundColor: 'var(--color-background)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--color-border)',
      padding: 'var(--spacing-4)',
      transition: 'box-shadow 0.2s ease-in-out',
      minHeight: '100px', // Ensures minimum touch target size
      width: '100%',
    },
    elevated: {
      boxShadow: 'var(--shadow-md)',
    },
    header: {
      marginBottom: 'var(--spacing-4)',
      paddingBottom: 'var(--spacing-3)',
      borderBottom: '1px solid var(--color-border)',
    },
    title: {
      fontSize: 'var(--font-size-lg)',
      fontWeight: 'var(--font-weight-bold)',
      color: 'var(--color-text-primary)',
      margin: 0,
    },
    content: {
      position: 'relative' as const,
      minHeight: loading ? '100px' : 'auto',
    },
    loadingOverlay: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--color-background-overlay)',
      borderRadius: 'var(--border-radius-lg)',
      zIndex: 1,
    },
  };

  // Combine base styles with elevated styles if enabled
  const cardStyle = {
    ...styles.card,
    ...(elevated ? styles.elevated : {}),
    ...style,
  };

  return (
    <article
      className={cardClasses}
      style={cardStyle}
      role="article"
      onClick={onClick}
      data-testid={testId}
      tabIndex={0} // Make card focusable for keyboard navigation
    >
      {title && (
        <header style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
        </header>
      )}
      
      <div style={styles.content}>
        {loading && (
          <div style={styles.loadingOverlay}>
            <Spinner
              size="large"
              color="primary"
              ariaLabel="Loading card content"
            />
          </div>
        )}
        <div
          style={{
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          {children}
        </div>
      </div>
    </article>
  );
};

export default Card;