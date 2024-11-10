/**
 * HUMAN TASKS:
 * 1. Test biometric authentication setup with various FIDO2-compliant authenticators
 * 2. Verify password complexity rules meet security requirements
 * 3. Test MFA setup with different TOTP authenticator apps
 * 4. Validate session timeout behavior across different devices
 * 5. Test backup code generation and usage flows
 */

// React v18.0.0
import React, { useState, useEffect, useCallback } from 'react';
// @simplewebauthn/browser v7.0.0
import { startRegistration } from '@simplewebauthn/browser';

// Internal imports
import Button from '../../components/common/Button';
import BiometricPrompt from '../../components/auth/BiometricPrompt';
import { getAuthState } from '../../utils/auth.utils';

// Types for security settings
interface SecuritySettings {
  hasBiometrics: boolean;
  hasMFA: boolean;
  activeSessions: string[];
  lastPasswordChange: Date;
  mfaBackupCodes: string[];
}

/**
 * Security settings page component
 * Addresses requirements:
 * - Technical Specification/9.1.1 Authentication Methods
 * - Technical Specification/9.1.3 Session Management
 * - Technical Specification/9.3.5 Secure Development
 */
const SecurityPage: React.FC = () => {
  // State management
  const [settings, setSettings] = useState<SecuritySettings>({
    hasBiometrics: false,
    hasMFA: false,
    activeSessions: [],
    lastPasswordChange: new Date(),
    mfaBackupCodes: []
  });
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current security settings
  useEffect(() => {
    const loadSecuritySettings = async () => {
      try {
        const authState = getAuthState();
        if (!authState.isAuthenticated) {
          throw new Error('User not authenticated');
        }

        // API call to fetch security settings would go here
        // For now using mock data
        setSettings({
          hasBiometrics: false,
          hasMFA: false,
          activeSessions: ['Current Browser', 'iPhone 13', 'MacBook Pro'],
          lastPasswordChange: new Date(),
          mfaBackupCodes: []
        });
      } catch (err) {
        setError('Failed to load security settings');
        console.error('Error loading security settings:', err);
      }
    };

    loadSecuritySettings();
  }, []);

  /**
   * Handle password change with security requirements
   * Addresses requirement: Technical Specification/9.1.1 Authentication Methods
   */
  const handlePasswordChange = useCallback(async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate password complexity
      if (newPassword.length < 12) {
        throw new Error('Password must be at least 12 characters long');
      }

      // Password complexity regex: at least one uppercase, lowercase, number, and special character
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
      if (!passwordRegex.test(newPassword)) {
        throw new Error('Password must contain uppercase, lowercase, number, and special character');
      }

      // API call to change password would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call

      setSettings(prev => ({
        ...prev,
        lastPasswordChange: new Date()
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      console.error('Error changing password:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle FIDO2-compliant biometric authentication setup
   * Addresses requirement: Technical Specification/9.1.1 Authentication Methods
   */
  const handleBiometricSetup = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Start WebAuthn registration
      const registrationResponse = await startRegistration({
        challenge: 'random-challenge', // Would come from server
        rp: {
          name: 'Mint Replica Lite',
          id: window.location.hostname
        },
        user: {
          id: 'user-id', // Would come from auth state
          name: 'user@example.com',
          displayName: 'User Name'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        timeout: 60000,
        attestation: 'direct',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'required'
        }
      });

      // API call to verify and save credential would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call

      setSettings(prev => ({
        ...prev,
        hasBiometrics: true
      }));
    } catch (err) {
      setError('Failed to setup biometric authentication');
      console.error('Error setting up biometric auth:', err);
    } finally {
      setIsLoading(false);
      setShowBiometricPrompt(false);
    }
  }, []);

  /**
   * Handle MFA toggle with TOTP setup
   * Addresses requirement: Technical Specification/9.1.1 Authentication Methods
   */
  const handleMFAToggle = useCallback(async (enabled: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      if (enabled) {
        // Generate TOTP secret and backup codes
        // API call would go here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call

        setSettings(prev => ({
          ...prev,
          hasMFA: true,
          mfaBackupCodes: [
            'XXXX-XXXX-XXXX',
            'YYYY-YYYY-YYYY',
            'ZZZZ-ZZZZ-ZZZZ'
          ]
        }));
      } else {
        // Disable MFA
        // API call would go here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call

        setSettings(prev => ({
          ...prev,
          hasMFA: false,
          mfaBackupCodes: []
        }));
      }
    } catch (err) {
      setError('Failed to update MFA settings');
      console.error('Error updating MFA:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div style={styles.container}>
      {/* Password Section */}
      <section style={styles.section}>
        <h2 style={styles.heading}>Password Settings</h2>
        <p style={styles.description}>
          Manage your password and security preferences. Passwords must be at least 12 characters long.
        </p>
        <Button
          variant="primary"
          onClick={() => {/* Open password change modal */}}
          ariaLabel="Change password"
        >
          Change Password
        </Button>
        <p style={styles.description}>
          Last changed: {settings.lastPasswordChange.toLocaleDateString()}
        </p>
      </section>

      {/* Biometric Authentication Section */}
      <section style={styles.section}>
        <h2 style={styles.heading}>Biometric Authentication</h2>
        <p style={styles.description}>
          Use your device's biometric authentication for secure access.
        </p>
        <Button
          variant="primary"
          onClick={() => setShowBiometricPrompt(true)}
          isLoading={isLoading}
          disabled={settings.hasBiometrics}
          ariaLabel="Setup biometric authentication"
        >
          {settings.hasBiometrics ? 'Biometrics Enabled' : 'Setup Biometrics'}
        </Button>
      </section>

      {/* Two-Factor Authentication Section */}
      <section style={styles.section}>
        <h2 style={styles.heading}>Two-Factor Authentication</h2>
        <p style={styles.description}>
          Add an extra layer of security to your account with 2FA.
        </p>
        <Button
          variant="primary"
          onClick={() => handleMFAToggle(!settings.hasMFA)}
          isLoading={isLoading}
          ariaLabel="Toggle two-factor authentication"
        >
          {settings.hasMFA ? 'Disable 2FA' : 'Enable 2FA'}
        </Button>
        {settings.hasMFA && settings.mfaBackupCodes.length > 0 && (
          <div style={styles.backupCodes}>
            <h3>Backup Codes</h3>
            <ul>
              {settings.mfaBackupCodes.map((code, index) => (
                <li key={index}>{code}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Active Sessions Section */}
      <section style={styles.section}>
        <h2 style={styles.heading}>Active Sessions</h2>
        <p style={styles.description}>
          Manage your active sessions. Maximum 3 devices allowed.
        </p>
        <ul style={styles.sessionList}>
          {settings.activeSessions.map((session, index) => (
            <li key={index} style={styles.sessionItem}>
              <span>{session}</span>
              <Button
                variant="danger"
                onClick={() => {/* Handle session termination */}}
                ariaLabel={`Terminate session for ${session}`}
              >
                Terminate
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {/* Error Display */}
      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}

      {/* Biometric Setup Modal */}
      <BiometricPrompt
        isOpen={showBiometricPrompt}
        onClose={() => setShowBiometricPrompt(false)}
        onComplete={(success) => {
          if (success) {
            handleBiometricSetup();
          }
        }}
      />
    </div>
  );
};

// Styles object matching the JSON specification
const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto'
  },
  section: {
    marginBottom: '2rem',
    padding: '1.5rem',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: 'gray.900'
  },
  description: {
    color: 'gray.600',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.5'
  },
  error: {
    color: 'red',
    padding: '1rem',
    marginBottom: '1rem',
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderRadius: '4px'
  },
  backupCodes: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: 'gray.50',
    borderRadius: '4px'
  },
  sessionList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  sessionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid gray.200'
  }
} as const;

export default SecurityPage;