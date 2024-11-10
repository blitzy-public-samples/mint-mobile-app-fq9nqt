/**
 * Human Tasks:
 * 1. Set up Plaid environment variables in .env:
 *    - VITE_PLAID_CLIENT_ID
 *    - VITE_PLAID_ENV (sandbox/development/production)
 * 2. Configure error monitoring service for Plaid integration
 * 3. Review and adjust error handling strategies for production
 * 4. Test accessibility with screen readers
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useEffect, useCallback } from 'react';
// @version: @plaid/link-react ^3.4.0
import { PlaidLinkOnSuccess, PlaidLinkOnExit, PlaidLinkError, usePlaidLink } from '@plaid/link-react';

// Internal imports
import usePlaid from '../../hooks/usePlaid';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

/**
 * Props interface for PlaidLink component with comprehensive error handling
 * Implements Technical Specification/6.2.1 Account Synchronization Flow
 */
interface PlaidLinkProps {
  buttonText?: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline';
  onSuccess?: (publicToken: string, metadata: any) => void;
  onExit?: (error: PlaidLinkError | null) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * PlaidLink component that implements secure bank account connection
 * Implements:
 * - Technical Specification/1.1 System Overview/Core Features
 * - Technical Specification/6.2.1 Account Synchronization Flow
 * - Technical Specification/5.4 Security Architecture
 */
const PlaidLink: React.FC<PlaidLinkProps> = ({
  buttonText = 'Connect Bank Account',
  buttonVariant = 'primary',
  onSuccess,
  onExit,
  disabled = false,
  className = '',
  ariaLabel = 'Connect your bank account securely with Plaid'
}) => {
  // Initialize Plaid hook for state management and actions
  const [
    { isLoading, error, linkToken, isLinkReady },
    { initializePlaidLink, handlePlaidSuccess, handlePlaidError }
  ] = usePlaid();

  // Initialize Plaid Link on component mount
  useEffect(() => {
    if (!linkToken && !isLoading && !error) {
      initializePlaidLink();
    }
  }, [linkToken, isLoading, error, initializePlaidLink]);

  // Handle successful Plaid Link connection
  const handleSuccess = useCallback<PlaidLinkOnSuccess>(
    async (public_token, metadata) => {
      try {
        await handlePlaidSuccess(public_token);
        onSuccess?.(public_token, metadata);
      } catch (error) {
        console.error('Plaid Link success handler error:', error);
        handlePlaidError(error as Error);
      }
    },
    [handlePlaidSuccess, handlePlaidError, onSuccess]
  );

  // Handle Plaid Link exit
  const handleExit = useCallback<PlaidLinkOnExit>(
    (error) => {
      if (error) {
        console.error('Plaid Link exit error:', error);
        handlePlaidError(error);
      }
      onExit?.(error);
    },
    [handlePlaidError, onExit]
  );

  // Configure Plaid Link with OAuth and security settings
  const config = {
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: handleExit,
    // OAuth configuration for secure redirect flow
    receivedRedirectUri: window.location.href,
  };

  // Initialize Plaid Link hook with configuration
  const { open, ready } = usePlaidLink(config);

  // Handle button click to open Plaid Link
  const handleClick = useCallback(() => {
    if (ready && !disabled) {
      open();
    }
  }, [ready, disabled, open]);

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <Spinner size="small" color="primary" ariaLabel="Initializing bank connection..." />
        <span className="ml-2">Initializing...</span>
      </div>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <Button
        variant="danger"
        onClick={initializePlaidLink}
        className={className}
        ariaLabel="Retry bank connection"
        disabled={disabled}
      >
        Retry Connection
      </Button>
    );
  }

  // Render connect button when ready
  return (
    <Button
      variant={buttonVariant}
      onClick={handleClick}
      disabled={!ready || disabled || !linkToken}
      className={className}
      ariaLabel={ariaLabel}
    >
      {buttonText}
    </Button>
  );
};

export default PlaidLink;