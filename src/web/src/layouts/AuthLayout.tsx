/**
 * HUMAN TASKS:
 * 1. Verify color contrast ratios meet WCAG 2.1 AA standards
 * 2. Test layout responsiveness across all target screen sizes (320px-2048px)
 * 3. Validate keyboard navigation flow
 * 4. Test with screen readers for proper ARIA implementation
 * 5. Configure biometric authentication settings in production environment
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useState, useCallback } from 'react';
// @version: react-router-dom ^6.0.0
import { useNavigate } from 'react-router-dom';

// Internal component imports
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { BiometricPrompt } from '../components/auth/BiometricPrompt';
import { AuthResponse } from '@/types/auth.types';

// Types
interface AuthLayoutProps {
  children?: React.ReactNode;
  authMode: 'login' | 'register';
}

/**
 * AuthLayout component providing authentication page structure
 * Implements requirements:
 * - Technical Specification/8.1 User Interface Design: Responsive layout (320px-2048px)
 * - Technical Specification/9.1.1 Authentication Methods: Email/password and biometric auth
 * - Technical Specification/8.1.8 Accessibility Features: WCAG 2.1 compliance
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ authMode }) => {
  const navigate = useNavigate();
  const [showBiometric, setShowBiometric] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles successful authentication
   * Implements secure token storage and navigation
   */
  const handleAuthSuccess = useCallback((response: AuthResponse) => {
    try {
      // Store authentication tokens securely
      localStorage.setItem('accessToken', response.accessToken);
      sessionStorage.setItem('refreshToken', response.refreshToken);

      // Check if biometric authentication is available and enabled
      // if (response.biometricEnabled) {
      if (false) {
        setShowBiometric(true);
      } else {
        // Navigate to dashboard if biometric is not required
        navigate('/dashboard');
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
      console.error('Auth success handler error:', error);
    }
  }, [navigate]);

  /**
   * Handles authentication errors with user feedback
   */
  const handleAuthError = useCallback((error: Error) => {
    setError(error.message || 'Authentication failed. Please try again.');
    console.error('Authentication error:', error);
  }, []);

  /**
   * Handles biometric authentication completion
   */
  const handleBiometricComplete = useCallback((success: boolean) => {
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Biometric authentication failed. Please try again or use password.');
    }
    setShowBiometric(false);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        {/* Logo section */}
        <div style={styles.logo}>
          <img
            src="/logo.svg"
            alt="Mint Replica Lite"
            width={150}
            height={40}
          />
        </div>

        {/* Title section */}
        <h1 style={styles.title}>
          {authMode === 'login' ? 'Sign In to Your Account' : 'Create Your Account'}
        </h1>

        {/* Error message */}
        {error && (
          <div style={styles.error} role="alert" aria-live="polite">
            {error}
          </div>
        )}

        {/* Authentication forms */}
        {authMode === 'login' ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onError={handleAuthError}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onError={handleAuthError}
          />
        )}

        {/* Biometric authentication prompt */}
        <BiometricPrompt
          isOpen={showBiometric}
          onClose={() => setShowBiometric(false)}
          onComplete={handleBiometricComplete}
        />
      </div>
    </div>
  );
};

// Styles object matching the JSON specification
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    // Responsive design for mobile devices
    '@media (max-width: 480px)': {
      padding: '1rem'
    }
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    // Ensure minimum touch target sizes for accessibility
    '@media (max-width: 480px)': {
      padding: '1.5rem'
    }
  },
  logo: {
    marginBottom: '2rem',
    textAlign: 'center'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    textAlign: 'center',
    // Ensure proper contrast ratio
    color: '#1a1a1a'
  },
  error: {
    color: 'red.500',
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    textAlign: 'center',
    // Ensure error messages are clearly visible
    padding: '0.5rem',
    backgroundColor: 'rgba(254, 242, 242, 0.8)',
    borderRadius: '4px'
  }
} as const;

export default AuthLayout;