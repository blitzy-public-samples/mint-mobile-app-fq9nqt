/**
 * HUMAN TASKS:
 * 1. Configure FIDO2 WebAuthn settings in production environment
 * 2. Set up error tracking service integration
 * 3. Test authentication flow with various biometric devices
 * 4. Verify WCAG 2.1 compliance with screen readers
 * 5. Test responsive layout across all target screen sizes (320px-2048px)
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useState, useCallback } from 'react';
// @version: react-router-dom ^6.0.0
import { useNavigate } from 'react-router-dom';

// Internal imports
import { LoginForm } from '../../components/auth/LoginForm';
import { BiometricPrompt } from '../../components/auth/BiometricPrompt';
import { AuthLayout } from '../../layouts/AuthLayout';
import { AuthResponse } from '../../types/auth.types';

/**
 * Login page component implementing secure authentication
 * Addresses requirements:
 * - Technical Specification/9.1.1 Authentication Methods: Email/password and FIDO2 biometric
 * - Technical Specification/8.1 User Interface Design: Responsive layout
 * - Technical Specification/9.3 Security Protocols: Secure auth flow
 */
const Login: React.FC = () => {
  const navigate = useNavigate();
  
  // Component state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBiometric, setShowBiometric] = useState(false);

  /**
   * Handles successful login attempts
   * Implements secure token storage and state management
   */
  const handleLoginSuccess = useCallback((response: AuthResponse) => {
    try {
      // Store authentication tokens securely
      localStorage.setItem('accessToken', response.accessToken);
      sessionStorage.setItem('refreshToken', response.refreshToken);

      // Reset states
      setError(null);
      setIsLoading(false);

      // Check if biometric authentication is available
      if (response.biometricEnabled) {
        setShowBiometric(true);
      } else {
        // Navigate to dashboard if biometric is not required
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login success handler error:', error);
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  }, [navigate]);

  /**
   * Handles login failure scenarios
   * Implements user-friendly error handling
   */
  const handleLoginError = useCallback((error: Error) => {
    console.error('Login error:', error);
    setError(error.message || 'Authentication failed. Please try again.');
    setIsLoading(false);
  }, []);

  /**
   * Handles FIDO2-compliant biometric authentication flow
   * Implements secure biometric verification
   */
  const handleBiometricAuth = useCallback((success: boolean) => {
    if (success) {
      // Clear sensitive data and navigate on success
      setError(null);
      setShowBiometric(false);
      navigate('/dashboard');
    } else {
      // Handle biometric authentication failure
      setError('Biometric authentication failed. Please try again or use password.');
      setShowBiometric(false);
    }
  }, [navigate]);

  return (
    <AuthLayout authMode="login">
      {/* Main login form */}
      <LoginForm
        onSuccess={handleLoginSuccess}
        onError={handleLoginError}
      />

      {/* FIDO2 biometric authentication prompt */}
      <BiometricPrompt
        isOpen={showBiometric}
        onClose={() => setShowBiometric(false)}
        onComplete={handleBiometricAuth}
        title="Verify Your Identity"
        message="Please complete biometric authentication to continue"
      />

      {/* Error message display */}
      {error && (
        <div 
          className="mt-4 p-3 bg-red-50 text-red-600 rounded-md"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div 
          className="mt-4 text-center text-gray-600"
          aria-live="polite"
        >
          Authenticating...
        </div>
      )}
    </AuthLayout>
  );
};

export default Login;