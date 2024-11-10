// @version react ^18.0.0
// @version react-router-dom ^6.0.0

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import usePlaid from '../../hooks/usePlaid';
import Spinner from '../common/Spinner';

/**
 * Human Tasks:
 * 1. Configure OAuth redirect URI in Plaid Dashboard to match redirectUri prop
 * 2. Set up error monitoring for OAuth flow failures
 * 3. Implement proper logging for OAuth state validation failures
 * 4. Review security headers for OAuth endpoints
 */

interface PlaidOAuthProps {
  redirectUri: string;
  onSuccess: () => void;
  onError: () => void;
}

/**
 * Component that handles the OAuth redirect flow for Plaid Link with secure token exchange
 * Implements Technical Specification/1.1 System Overview/Core Features - Financial Institution Integration
 */
const PlaidOAuth: React.FC<PlaidOAuthProps> = ({
  redirectUri,
  onSuccess,
  onError
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [plaidState, { handlePlaidSuccess, handlePlaidError }] = usePlaid();

  /**
   * Handles the OAuth redirect and token exchange process with security validation
   * Implements Technical Specification/5.4 Security Architecture - Secure handling of OAuth flow
   */
  const handleOAuthRedirect = async (searchParams: URLSearchParams): Promise<void> => {
    try {
      // Extract OAuth parameters
      const publicToken = searchParams.get('public_token');
      const stateParam = searchParams.get('state');
      
      // Validate required parameters
      if (!publicToken || !stateParam) {
        throw new Error('Missing required OAuth parameters');
      }

      // Validate OAuth state parameter for CSRF protection
      const storedState = sessionStorage.getItem('plaidOAuthState');
      if (!storedState || stateParam !== storedState) {
        throw new Error('Invalid OAuth state parameter');
      }

      // Clean up stored state
      sessionStorage.removeItem('plaidOAuthState');

      // Exchange public token for access token
      const response = await handlePlaidSuccess(publicToken);
      
      if (response.success) {
        onSuccess();
      } else {
        throw new Error('Failed to exchange public token');
      }
    } catch (error) {
      console.error('Plaid OAuth Error:', error);
      handlePlaidError(error as Error);
      onError();
    } finally {
      // Clean up URL parameters for security
      navigate(redirectUri, { replace: true });
    }
  };

  /**
   * Handle OAuth redirect on component mount with proper cleanup
   * Implements Technical Specification/6.2.1 Account Synchronization Flow
   */
  useEffect(() => {
    if (searchParams.has('public_token')) {
      handleOAuthRedirect(searchParams);
    }
    
    // Cleanup function
    return () => {
      sessionStorage.removeItem('plaidOAuthState');
    };
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div 
      role="status" 
      aria-live="polite"
      className="plaid-oauth-container"
    >
      <Spinner 
        size="large" 
        color="primary" 
        ariaLabel="Processing bank connection..." 
      />
      <p className="sr-only">
        Securely connecting to your financial institution...
      </p>
    </div>
  );
};

export default PlaidOAuth;