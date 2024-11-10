/**
 * Human Tasks:
 * 1. Verify redirect paths align with application routing structure
 * 2. Ensure authentication state persistence settings are configured
 */

import React from 'react'; // @version ^18.2.0
import { Navigate, Outlet } from 'react-router-dom'; // @version ^6.8.0
import { useAuth } from '../contexts/AuthContext';

/**
 * PublicRoute Component
 * Implements:
 * - Technical Specification/9.1.1 Authentication Methods
 * - Technical Specification/9.1.3 Session Management
 * 
 * A route wrapper that ensures routes are only accessible to non-authenticated users.
 * Redirects authenticated users to the dashboard or specified path.
 */
const PublicRoute: React.FC<{ redirectPath?: string }> = ({ 
  redirectPath = '/dashboard' 
}) => {
  // Get authentication state from context to check JWT token validity
  const { authState: { isAuthenticated } } = useAuth();

  // If user is authenticated with valid session, redirect to specified path
  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // If not authenticated or session expired, render child routes
  return <Outlet />;
};

export default PublicRoute;