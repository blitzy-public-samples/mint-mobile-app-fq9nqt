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
import React, { useCallback, useEffect } from 'react';
// @version: react-router-dom ^6.0.0
import { useNavigate } from 'react-router-dom';

// Internal imports
import PlaidLink from '../../components/plaid/PlaidLink';
import Button from '../../components/common/Button';
import usePlaid from '../../hooks/usePlaid';

/**
 * Props interface for LinkAccount component
 * Implements Technical Specification/6.2.1 Account Synchronization Flow
 */
interface LinkAccountProps {}

/**
 * Page component for securely linking financial accounts using Plaid
 * Implements:
 * - Technical Specification/1.2 Scope/Core Features/Financial Institution Integration
 * - Technical Specification/6.2.1 Account Synchronization Flow/Integration with Plaid
 * - Technical Specification/5.4 Security Architecture/Secure handling of credentials
 */
const LinkAccount: React.FC<LinkAccountProps> = () => {
  const navigate = useNavigate();
  const [
    { isLoading, error },
    { handlePlaidSuccess, handlePlaidError, refreshAccounts }
  ] = usePlaid();

  /**
   * Handle successful account linking with proper token exchange
   * Implements Technical Specification/6.2.1 Account Synchronization Flow
   */
  const handleSuccess = useCallback(async (publicToken: string) => {
    try {
      // Exchange public token and sync account data
      await handlePlaidSuccess(publicToken);
      
      // Refresh accounts list after successful linking
      await refreshAccounts();
      
      // Navigate back to accounts page
      navigate('/accounts');
    } catch (error) {
      console.error('Error linking account:', error);
      handlePlaidError(error as Error);
    }
  }, [handlePlaidSuccess, handlePlaidError, refreshAccounts, navigate]);

  /**
   * Handle cancellation of account linking process
   * Implements Technical Specification/5.4 Security Architecture
   */
  const handleCancel = useCallback(() => {
    navigate('/accounts');
  }, [navigate]);

  /**
   * Handle Plaid Link exit with proper error handling
   * Implements Technical Specification/5.4 Security Architecture
   */
  const handleExit = useCallback((err: Error | null) => {
    if (err) {
      console.error('Plaid Link exit error:', err);
      handlePlaidError(err);
    }
  }, [handlePlaidError]);

  // Clean up any pending operations on unmount
  useEffect(() => {
    return () => {
      // Cleanup will be handled by usePlaid hook
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <h1 className="text-2xl font-semibold mb-8">
        Link Your Bank Account
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-error-50 text-error-700 rounded-md" role="alert">
          <p>Error: {error}</p>
          <p className="text-sm mt-2">Please try again or contact support if the issue persists.</p>
        </div>
      )}

      <div className="flex flex-col gap-4 w-full max-w-md">
        <PlaidLink
          buttonText="Connect Your Bank"
          buttonVariant="primary"
          onSuccess={handleSuccess}
          onExit={handleExit}
          disabled={isLoading}
          className="w-full"
          ariaLabel="Connect your bank account securely with Plaid"
        />

        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className="w-full"
          ariaLabel="Cancel account linking process"
        >
          Cancel
        </Button>
      </div>

      <p className="mt-6 text-sm text-neutral-600 text-center max-w-md">
        Your financial data is securely handled using Plaid's industry-leading security standards and encryption.
      </p>
    </div>
  );
};

export default LinkAccount;