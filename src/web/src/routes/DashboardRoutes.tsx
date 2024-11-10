/**
 * DashboardRoutes Component
 * Defines and manages the routing configuration for the dashboard section with protected routes
 * 
 * Requirements addressed:
 * - Navigation Structure (Technical Specification/8.1.1 Mobile Navigation Structure)
 *   Implements dashboard navigation structure with routes for accounts, budgets, goals, and more
 * - Protected Routes (Technical Specification/9.1 Authentication and Authorization)
 *   Ensures routes are protected with JWT token-based authentication and 15-minute session validation
 */

// @version: react ^18.2.0
import React from 'react';
// @version: react-router-dom ^6.0.0
import { Route, Routes } from 'react-router-dom';

// Internal component imports
import Dashboard from '../pages/dashboard/Dashboard';
import Accounts from '../pages/accounts/Accounts';
import Budgets from '../pages/budgets/Budgets';
import PrivateRoute from './PrivateRoute';

// Human tasks:
// 1. Verify route access policies are configured in authentication service
// 2. Test session timeout handling and token refresh flow
// 3. Validate mobile navigation patterns with UX team
// 4. Review route transition animations for accessibility

/**
 * Props interface for DashboardRoutes component
 */
interface DashboardRoutesProps {}

/**
 * DashboardRoutes component that defines the routing structure for the dashboard section
 * with protected routes and authentication validation
 * 
 * @returns {JSX.Element} Rendered routes configuration with authentication protection
 */
const DashboardRoutes: React.FC<DashboardRoutesProps> = (): JSX.Element => {
  return (
    <Routes>
      {/* Main Dashboard Overview Route */}
      <Route
        path="/"
        element={
          <PrivateRoute redirectPath="/auth/login">
            <Dashboard />
          </PrivateRoute>
        }
      />

      {/* Accounts Management Route */}
      <Route
        path="/accounts/*"
        element={
          <PrivateRoute redirectPath="/auth/login">
            <Accounts />
          </PrivateRoute>
        }
      />

      {/* Budgets Management Route */}
      <Route
        path="/budgets/*"
        element={
          <PrivateRoute redirectPath="/auth/login">
            <Budgets />
          </PrivateRoute>
        }
      />

      {/* Catch-all redirect to main dashboard */}
      <Route
        path="*"
        element={
          <PrivateRoute redirectPath="/auth/login">
            <Dashboard />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

export default DashboardRoutes;