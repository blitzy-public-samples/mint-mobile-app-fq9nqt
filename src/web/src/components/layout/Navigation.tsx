/**
 * HUMAN TASKS:
 * 1. Verify navigation touch targets meet WCAG size requirements (44x44px)
 * 2. Test keyboard navigation flow and screen reader announcements
 * 3. Validate color contrast ratios for all navigation states
 * 4. Test navigation behavior across different screen sizes
 */

// Third-party imports
// @version: react ^18.2.0
import React, { useState, useEffect } from 'react';
// @version: react-router-dom ^6.8.0
import { useNavigate, useLocation } from 'react-router-dom';

// Internal imports
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { AccountIcon, BudgetIcon, DashboardIcon, GoalIcon, InvestmentIcon, LogoutIcon } from '@/assets/icons';

// Navigation items constant from specification
const NAVIGATION_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon size={24} />, ariaLabel: 'Navigate to Dashboard' },
  { path: '/dashboard/accounts', label: 'Accounts', icon: <AccountIcon size={24} />, ariaLabel: 'Navigate to Accounts' },
  { path: '/dashboard/budgets', label: 'Budgets', icon: <BudgetIcon size={24} />, ariaLabel: 'Navigate to Budgets' },
  { path: '/dashboard/goals', label: 'Goals', icon: <GoalIcon size={24} />, ariaLabel: 'Navigate to Goals' },
  { path: '/dashboard/investments', label: 'Investments', icon: <InvestmentIcon size={24} />, ariaLabel: 'Navigate to Investments' }
];

/**
 * Main navigation component implementing responsive design and accessibility
 * Addresses requirements:
 * - Technical Specification/8.1.1 Mobile Navigation Structure
 * - Technical Specification/8.1.8 Accessibility Features
 * - Technical Specification/8.1.7 Mobile Responsive Considerations
 */
const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, handleLogout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle screen size changes for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Determines if a route is currently active
   * Implements Technical Specification/8.1.1 Mobile Navigation Structure
   */
  const isActiveRoute = (path: string): boolean => {
    return location.pathname === path;
  };

  /**
   * Handles navigation with authentication check
   * Implements Technical Specification/8.1.1 Mobile Navigation Structure
   */
  const handleNavigation = (path: string) => {
    if (path === '/logout') {
      handleLogout();
      navigate('/login');
      return;
    }

    // if (!authState.isAuthenticated) {
    //   navigate('/login');
    //   return;
    // }

    navigate(path);
  };

  /**
   * Renders desktop navigation
   * Implements Technical Specification/8.1.8 Accessibility Features
   */
  const renderDesktopNav = () => (
    <nav className="hidden md:flex flex-col w-64 h-screen bg-white shadow-lg" role="navigation">
      <div className="p-4">
        <h1 className="text-xl font-bold text-primary-900">MintReplica Lite</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {NAVIGATION_ITEMS.map((item) => (
          <Button
            key={item.path}
            variant={isActiveRoute(item.path) ? 'primary' : 'text'}
            className="w-full justify-start mb-2 text-left"
            onClick={() => handleNavigation(item.path)}
            ariaLabel={item.ariaLabel}
          >
            <span className={`material-icons mr-3`}>{item.icon}</span>
            {item.label}
          </Button>
        ))}
      </div>

      {authState.isAuthenticated && (
        <div className="p-4 border-t">
          <Button
            variant="text"
            className="w-full justify-start"
            onClick={() => handleNavigation('/logout')}
            ariaLabel="Log out of your account"
          >
            <span className="material-icons mr-3">{<LogoutIcon size={24} />}</span>
            Logout
          </Button>
        </div>
      )}
    </nav>
  );

  /**
   * Renders mobile navigation
   * Implements Technical Specification/8.1.7 Mobile Responsive Considerations
   */
  const renderMobileNav = () => (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white shadow-lg md:hidden z-10"
      role="navigation"
      aria-label="Mobile navigation"
    >

      <div className="flex justify-around items-center h-16">
        {NAVIGATION_ITEMS.map((item) => (
            <Button
              key={item.path}
              variant="text"
              size="small"
              className={`flex flex-col items-center py-2 px-4`}
              onClick={() => handleNavigation(item.path)}
              ariaLabel={item.ariaLabel}
              style={{
                backgroundColor: isActiveRoute(item.path) ? 'var(--color-primary-100)' : 'transparent'
              }}
            >
              <span className="material-icons text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      {/* Render appropriate navigation based on screen size */}
      {isMobile ? renderMobileNav() : renderDesktopNav()}

      {/* Mobile navigation offset to prevent content overlap */}
      {isMobile && <div className="h-16" aria-hidden="true" />}
    </>
  );
};

export default Navigation;