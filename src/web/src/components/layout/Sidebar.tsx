/**
 * HUMAN TASKS:
 * 1. Verify sidebar touch targets meet minimum size requirements (44x44 points)
 * 2. Test sidebar keyboard navigation flow with screen readers
 * 3. Validate color contrast ratios in all themes and modes
 * 4. Test sidebar behavior on various mobile devices and orientations
 */

// Third-party imports
// @version: react ^18.2.0
import React, { useState, useEffect, useCallback } from 'react';
// @version: react-router-dom ^6.8.0
import { useNavigate, NavLink } from 'react-router-dom';
// @version: classnames ^2.3.2
import classNames from 'classnames';

// Internal imports
import { Button } from '../common/Button';
import { AccountIcon, BudgetIcon, GoalIcon, InvestmentIcon } from '@/assets/icons';

/**
 * Interface for Sidebar component props
 */
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

/**
 * Sidebar component providing main navigation structure
 * Addresses requirements:
 * - Navigation Structure (Technical Specification/8.1.1)
 * - Mobile Responsive Considerations (Technical Specification/8.1.7)
 * - Accessibility Features (Technical Specification/8.1.8)
 */
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
  const navigate = useNavigate();
  const [mediaQuery, setMediaQuery] = useState<MediaQueryList | null>(null);

  // Navigation items defined in specification
  const navigationItems = [
    { route: '/dashboard', label: 'Dashboard', icon: 'dashboard', ariaLabel: 'Navigate to Dashboard' },
    { route: '/dashboard/accounts', label: 'Accounts', icon: <AccountIcon size={24} />, ariaLabel: 'Navigate to Accounts' },
    { route: '/dashboard/budgets', label: 'Budgets', icon: <BudgetIcon size={24} />, ariaLabel: 'Navigate to Budgets' },
    { route: '/dashboard/goals', label: 'Goals', icon: <GoalIcon size={24} />, ariaLabel: 'Navigate to Goals' },
    { route: '/dashboard/investments', label: 'Investments', icon: <InvestmentIcon size={24} />, ariaLabel: 'Navigate to Investments' },
    { route: '/dashboard/settings', label: 'Settings', icon: 'settings', ariaLabel: 'Navigate to Settings' }
  ];

  /**
   * Handle navigation with proper focus management
   * Addresses requirement: Accessibility Features
   */
  const handleNavigation = useCallback((route: string) => {
    navigate(route);
    if (isMobile) {
      onClose();
    }
  }, [navigate, isMobile, onClose]);

  /**
   * Set up media query listener for responsive behavior
   * Addresses requirement: Mobile Responsive Considerations
   */
  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)');
    setMediaQuery(query);

    const handleChange = (e: MediaQueryListEvent) => {
      if (!e.matches && isOpen) {
        onClose();
      }
    };

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, [isOpen, onClose]);

  /**
   * Handle keyboard navigation and accessibility
   * Addresses requirement: Accessibility Features
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Base classes for sidebar layout
  const sidebarClasses = classNames(
    'fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out transform',
    'flex flex-col h-full',
    {
      'translate-x-0': isOpen,
      '-translate-x-full': !isOpen,
      'lg:translate-x-0': !isMobile
    }
  );

  // Overlay for mobile view
  const overlayClasses = classNames(
    'fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300',
    {
      'opacity-100': isOpen && isMobile,
      'opacity-0 pointer-events-none': !isOpen || !isMobile
    }
  );

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={overlayClasses}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar navigation */}
      <nav
        className={sidebarClasses}
        aria-label="Main navigation"
        role="navigation"
        aria-expanded={isOpen}
      >
        {/* Logo section */}
        <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700">
          <div className="text-xl font-semibold text-gray-800 dark:text-white">
            MintReplica
          </div>
          {isMobile && (
            <Button
              variant="text"
              ariaLabel="Close navigation menu"
              onClick={onClose}
              className="lg:hidden"
            >
              <span className="material-icons">close</span>
            </Button>
          )}
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto">
          <ul className="py-4">
            {navigationItems.map(({ route, label, icon, ariaLabel }) => (
              <li key={route} className="px-2">
                <NavLink
                  to={route}
                  onClick={() => handleNavigation(route)}
                  className={({ isActive }) => classNames(
                    'flex items-center px-4 py-3 rounded-md transition-colors duration-200',
                    'min-h-[44px]', // Minimum touch target size
                    {
                      'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-100': isActive,
                      'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700': !isActive
                    }
                  )}
                  aria-label={ariaLabel}
                >
                  <span className="material-icons mr-3">{icon}</span>
                  <span className="font-medium">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* User section */}
        <div className="p-4 border-t dark:border-gray-700">
          <Button
            variant="outline"
            size="medium"
            onClick={() => handleNavigation('/settings/profile')}
            className="w-full justify-start"
            ariaLabel="View profile settings"
          >
            <span className="material-icons mr-3">account_circle</span>
            <span>Profile</span>
          </Button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;