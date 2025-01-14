// React v18.0.0
import React, { useEffect, useCallback, useRef } from 'react';
// ReactDOM v18.0.0
import ReactDOM from 'react-dom';
// framer-motion v6.0.0
import { motion, AnimatePresence } from 'framer-motion';
import { colors }from '../../config/theme.config';

/**
 * HUMAN TASKS:
 * 1. Test modal with screen readers to verify ARIA implementation
 * 2. Verify focus trap functionality with keyboard navigation
 * 3. Test modal responsiveness across different device sizes
 * 4. Validate animation performance on lower-end devices
 */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

// Custom hook for keyboard interactions and focus management
const useModalKeyboard = (onClose: () => void) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Store the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Handle keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when modal closes
      previousFocusRef.current?.focus();
    };
  }, [onClose]);
};

// Modal size configuration
const sizeConfig = {
  sm: '400px',
  md: '600px',
  lg: '800px',
  xl: '1000px',
  full: '100%'
};

// Animation variants for modal and overlay
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 }
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
  ariaLabel,
  ariaDescribedBy
}) => {
  // Initialize keyboard handling
  useModalKeyboard(onClose);

  // Create portal container if it doesn't exist
  const getPortalRoot = useCallback(() => {
    let portalRoot = document.getElementById('modal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'modal-root';
      document.body.appendChild(portalRoot);
    }
    return portalRoot;
  }, []);

  // Handle overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handleOverlayClick}
          role="presentation"
        >
          <motion.div
            variants={modalVariants}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            style={{
              backgroundColor: colors.neutral[50],
              borderRadius: '0.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxWidth: sizeConfig[size],
              width: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
            className={className}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel || title}
            aria-describedby={ariaDescribedBy}
          >
            {/* Modal Header */}
            {(title || showCloseButton) && (
              <div
                style={{
                  padding: '1rem',
                  borderBottom: `1px solid ${colors.neutral[200]}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {title && (
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: colors.neutral[900]
                    }}
                  >
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      color: colors.neutral[500],
                      transition: 'color 0.2s'
                    }}
                    aria-label="Close modal"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Modal Content */}
            <div
              style={{
                padding: '1rem',
                color: colors.neutral[800]
              }}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, getPortalRoot());
};

export default Modal;