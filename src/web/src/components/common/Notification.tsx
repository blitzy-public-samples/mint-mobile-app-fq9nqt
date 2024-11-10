// @version: react ^18.0.0
import React, { useEffect, useState } from 'react';
// @version: framer-motion ^6.0.0
import { motion, AnimatePresence } from 'framer-motion';

// Human Tasks:
// 1. Ensure CSS variables are defined in the root stylesheet:
//    --color-success-50, --color-success-500, --color-success-700
//    --color-error-50, --color-error-500, --color-error-700
//    --color-warning-50, --color-warning-500, --color-warning-700
//    --color-info-50, --color-info-500, --color-info-700
//    --spacing-3, --spacing-4, --spacing-8
//    --shadow-lg
// 2. Verify that the notification z-index (50) doesn't conflict with other UI elements

/**
 * Type for notification severity levels following the design system
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Props interface for the Notification component
 */
export interface NotificationProps {
  message: string;
  type: NotificationType;
  duration?: number;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Custom hook to handle auto-dismissal of notifications with cleanup
 */
const useNotificationTimer = (duration: number, onClose: () => void): void => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration, onClose]);
};

/**
 * A reusable notification component that displays alerts, messages and feedback
 * Implements Technical Specification/8.1 User Interface Design - notification patterns
 * Implements Technical Specification/8.1.8 Accessibility Features
 */
export const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  duration = 5000,
  isVisible,
  onClose
}) => {
  const [isExiting, setIsExiting] = useState(false);

  // Set up auto-dismissal timer
  useNotificationTimer(duration, () => {
    setIsExiting(true);
    setTimeout(onClose, 200); // Wait for exit animation
  });

  // Handle escape key press for accessibility
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExiting(true);
        setTimeout(onClose, 200);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  // Animation variants
  const variants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <AnimatePresence>
      {isVisible && !isExiting && (
        <motion.div
          role="alert"
          aria-live="polite"
          className={`notification ${type}`}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={{ duration: 0.2 }}
          tabIndex={0}
          style={{
            position: 'fixed',
            top: 'var(--spacing-4)',
            right: 'var(--spacing-4)',
            padding: 'var(--spacing-3) var(--spacing-4)',
            borderRadius: '0.375rem',
            minWidth: '320px',
            maxWidth: 'calc(100vw - var(--spacing-8))',
            zIndex: 50,
            boxShadow: 'var(--shadow-lg)',
            backgroundColor: `var(--color-${type}-50)`,
            borderLeft: `4px solid var(--color-${type}-500)`,
            color: `var(--color-${type}-700)`
          }}
        >
          {/* Screen reader text for notification type */}
          <span className="sr-only">{type} notification:</span>
          
          {message}
          
          {/* Close button for keyboard accessibility */}
          <button
            onClick={() => {
              setIsExiting(true);
              setTimeout(onClose, 200);
            }}
            className="close-button"
            aria-label="Close notification"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'inherit'
            }}
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;