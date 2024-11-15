/**
 * HUMAN TASKS:
 * 1. Configure JWT token refresh mechanism in production environment
 * 2. Set up monitoring for session timeouts and authentication failures
 * 3. Verify responsive layout breakpoints in theme configuration
 * 4. Test navigation accessibility with screen readers
 * 5. Configure error tracking service integration
 */

// Third-party imports
// @version: ^18.2.0
import React from 'react';
// @version: ^6.8.0
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Internal imports
import AuthRoutes from './AuthRoutes';
import DashboardRoutes from './DashboardRoutes';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';

/**
 * Application route path definitions with proper security considerations
 * Implements Technical Specification/8.1.1 Mobile Navigation Structure
 */
const APP_ROUTES = {
  ROOT: '/',
  AUTH: '/auth/*',
  DASHBOARD: '/dashboard/*',
  NOT_FOUND: '*'
} as const;

/**
 * Main routing component that defines the application's route structure
 * with JWT token-based authentication and session validation
 * 
 * Implements requirements:
 * - Technical Specification/8.1.1 Mobile Navigation Structure
 *   Implements overall navigation structure with mobile-first design
 * - Technical Specification/9.1.1 Authentication Methods
 *   Configures routes with JWT token-based protection
 * - Technical Specification/8.1 User Interface Design
 *   Implements responsive support from 320px to 2048px width
 * 
 * @returns {JSX.Element} Rendered routing configuration with secure route protection
 */
const AppRoutes: React.FC = (): JSX.Element => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root route - Redirect to dashboard if authenticated */}
        <Route
          path={APP_ROUTES.ROOT}
          element={<Navigate to={APP_ROUTES.DASHBOARD} replace />}
        />

        {/* Public authentication routes */}
        <Route
          path={APP_ROUTES.AUTH}
          element={
            <PublicRoute redirectPath={APP_ROUTES.DASHBOARD}>
              <AuthRoutes />
            </PublicRoute>
          }
        />

        {/* Protected dashboard routes with JWT validation */}
        <Route
          path={APP_ROUTES.DASHBOARD}
          element={
            <PrivateRoute redirectPath="/auth/login">
              <DashboardRoutes />
            </PrivateRoute>
          }
        />

        {/* 404 Not Found - Redirect to dashboard */}
        <Route
          path={APP_ROUTES.NOT_FOUND}
          element={<Navigate to={APP_ROUTES.DASHBOARD} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
};

/**
 * Props interface for AppRoutes component
 * Currently empty as component doesn't require props
 */
interface AppRoutesProps {}

// Export the main routing configuration
export default AppRoutes;