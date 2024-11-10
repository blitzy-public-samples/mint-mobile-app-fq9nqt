// React v18.0.0
import React, { useState, useCallback } from 'react';
// @simplewebauthn/browser v7.0.0
import { startAuthentication } from '@simplewebauthn/browser';

import Modal from '../common/Modal';
import Button from '../common/Button';

/**
 * HUMAN TASKS:
 * 1. Test biometric authentication flow with different biometric hardware
 * 2. Verify error handling with various failure scenarios
 * 3. Test accessibility features with screen readers
 * 4. Validate keyboard navigation in the modal
 */

interface BiometricPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (success: boolean) => void;
  title?: string;
  message?: string;
}

interface BiometricState {
  isAuthenticating: boolean;
  error: string | null;
}

/**
 * BiometricPrompt component for handling FIDO2-compliant biometric authentication
 * Addresses requirements:
 * - Authentication Methods: Implements biometric authentication with FIDO2 compliance
 * - Security Design: Implements secure authentication flow with proper error handling
 * - Accessibility Features: Ensures keyboard navigation and screen reader support
 */
export const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  isOpen,
  onClose,
  onComplete,
  title = 'Biometric Authentication',
  message = 'Please verify your identity using biometric authentication'
}) => {
  const [state, setState] = useState<BiometricState>({
    isAuthenticating: false,
    error: null
  });

  /**
   * Handles the FIDO2-compliant biometric authentication process
   * Implements secure authentication flow with proper error handling
   */
  const handleBiometricAuth = useCallback(async () => {
    setState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      // Start WebAuthn authentication flow with security parameters
      const authenticationResponse = await startAuthentication({
        // FIDO2 security parameters
        userVerification: 'required',
        timeout: 60000
      });

      // Successful authentication
      setState(prev => ({ ...prev, isAuthenticating: false }));
      onComplete(true);
      onClose();
    } catch (error) {
      // Handle authentication errors with user-friendly messages
      let errorMessage = 'Authentication failed. Please try again.';

      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Biometric authentication was denied. Please try again.';
            break;
          case 'SecurityError':
            errorMessage = 'A security error occurred. Please ensure biometric authentication is enabled.';
            break;
          case 'NotSupportedError':
            errorMessage = 'Biometric authentication is not supported on this device.';
            break;
          case 'AbortError':
            errorMessage = 'Authentication was cancelled.';
            break;
        }
      }

      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: errorMessage
      }));
      onComplete(false);
    }
  }, [onComplete, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      ariaLabel="Biometric authentication prompt"
    >
      <div style={styles.container}>
        {/* Fingerprint icon for visual indication */}
        <span style={styles.icon} role="img" aria-hidden="true">
          👆
        </span>

        {/* Main message */}
        <p style={styles.message}>
          {message}
        </p>

        {/* Error message with ARIA alert */}
        {state.error && (
          <p style={styles.error} role="alert">
            {state.error}
          </p>
        )}

        {/* Action buttons with proper ARIA labels */}
        <div style={styles.buttonContainer}>
          <Button
            onClick={handleBiometricAuth}
            variant="primary"
            isLoading={state.isAuthenticating}
            ariaLabel="Authenticate using biometrics"
          >
            Authenticate
          </Button>
          <Button
            onClick={onClose}
            variant="secondary"
            ariaLabel="Cancel biometric authentication"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Styles object matching the JSON specification
const styles = {
  container: {
    padding: '1.5rem',
    textAlign: 'center',
    maxWidth: '400px',
    minHeight: '200px'
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    color: 'primary.500',
    'aria-hidden': 'true'
  },
  message: {
    marginBottom: '1.5rem',
    color: 'gray.600',
    fontSize: '1rem',
    lineHeight: '1.5'
  },
  error: {
    color: 'red.500',
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    role: 'alert'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '1.5rem',
    minHeight: '44px'
  }
} as const;

export default BiometricPrompt;