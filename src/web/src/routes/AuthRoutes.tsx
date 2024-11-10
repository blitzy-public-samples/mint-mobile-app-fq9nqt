/**
 * HUMAN TASKS:
 * 1. Configure FIDO2 WebAuthn settings in production environment
 * 2. Verify WCAG 2.1 compliance for authentication flows
 * 3. Test responsive layout across all target screen sizes (320px-2048px)
 * 4. Set up error tracking service integration
 * 5. Conduct security audit of authentication routes
 */

// Third-party imports
// @version: ^18.0.0
import React from 'react';
// @version: ^6.0.0
import { Route, Routes } from 'react-router-dom';

// Internal imports
import { Login, handleLoginSuccess, handleLoginError } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { AuthLayout } from '../layouts/AuthLayout';

/**
 * Authentication route path definitions with proper security considerations
 * Implements Technical Specification/9.1 Authentication and Authorization
 */
const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  RESET_PASSWORD: '/auth/reset-password'
} as const;

/**
 * AuthRoutes component that defines authentication-related routes with proper security controls
 * Implements requirements:
 * - Technical Specification/9.1.1 Authentication Methods: Email/password and FIDO2 biometric
 * - Technical Specification/8.1 User Interface Design: Responsive layout support
 * - Technical Specification/9.1 Authentication and Authorization: Protected routes and auth flow
 */
const AuthRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Login route with email/password and biometric support */}
      <Route
        path={AUTH_ROUTES.LOGIN}
        element={
          <AuthLayout authMode="login">
            <Login
              onLoginSuccess={handleLoginSuccess}
              onLoginError={handleLoginError}
            />
          </AuthLayout>
        }
      />

      {/* Registration route with security controls */}
      <Route
        path={AUTH_ROUTES.REGISTER}
        element={
          <AuthLayout authMode="register">
            <Register />
          </AuthLayout>
        }
      />

      {/* Password reset route */}
      <Route
        path={AUTH_ROUTES.RESET_PASSWORD}
        element={
          <AuthLayout authMode="reset">
            {/* Reset password component will be implemented separately */}
            <div>Reset Password</div>
          </AuthLayout>
        }
      />

      {/* Redirect unmatched auth routes to login */}
      <Route
        path="/auth/*"
        element={
          <AuthLayout authMode="login">
            <Login
              onLoginSuccess={handleLoginSuccess}
              onLoginError={handleLoginError}
            />
          </AuthLayout>
        }
      />
    </Routes>
  );
};

/**
 * Props interface for AuthRoutes component
 * Currently empty as component doesn't require props
 */
interface AuthRoutesProps {}

// Export the authentication routes configuration
export default AuthRoutes;