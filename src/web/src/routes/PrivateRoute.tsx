/**
 * Human Tasks:
 * 1. Ensure environment variables are configured for authentication endpoints
 * 2. Configure route access policies in authentication service
 * 3. Set up error tracking for authentication failures
 */

import React from 'react'; // @version ^18.2.0
import { Navigate } from 'react-router-dom'; // @version ^6.8.0
import { useAuth } from '../contexts/AuthContext';

/**
 * Interface for PrivateRoute component props
 * Defines the structure for protected route configuration
 */
interface PrivateRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

/**
 * PrivateRoute Component
 * Higher-order component that protects routes by checking authentication status
 * and redirecting unauthorized users to the login page
 * 
 * Implements:
 * - Technical Specification/9.1.1 Authentication Methods
 * - Technical Specification/9.1.3 Session Management
 * 
 * @param {React.ReactNode} children - The protected route content to render
 * @param {string} redirectPath - Optional custom redirect path (defaults to /auth/login)
 * @returns {JSX.Element} Protected route content or redirect to login
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  redirectPath = '/auth/login' 
}): JSX.Element => {
  // Get authentication status from AuthContext
  const { authState: { isAuthenticated } } = useAuth();

  /**
   * If user is not authenticated, redirect to login page
   * Implements Technical Specification/9.1.1 Authentication Methods
   */
  if (!isAuthenticated) {
    // Store the attempted URL for redirect after login
    const currentPath = window.location.pathname;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    
    return <Navigate to={redirectPath} replace />;
  }

  /**
   * If authenticated, render the protected route content
   * Implements Technical Specification/9.1.3 Session Management
   */
  return <>{children}</>;
};

export default PrivateRoute;