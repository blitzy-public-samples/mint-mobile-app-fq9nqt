/**
 * HUMAN TASKS:
 * 1. Verify color contrast ratios meet WCAG 2.1 Level AA standards (minimum 4.5:1 for normal text)
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate touch target sizes on mobile devices (minimum 44x44px)
 * 4. Ensure proper focus management during navigation
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useState, useCallback, useEffect } from 'react';
// @version: classnames ^2.3.2
import classNames from 'classnames';

// Internal imports
import { useTheme } from '../../hooks/useTheme';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';
import { User } from '@/types/models.types';

// Props interface for Header component
interface HeaderProps {
  className?: string;
  isAuthenticated: boolean;
  user?: User;
}

/**
 * Header component that provides navigation, theme controls, and user menu
 * Addresses requirements:
 * - Mobile-First Design (Technical Specification/1.1 System Overview)
 * - User Interface Design (Technical Specification/8.1 User Interface Design/8.1.2 Main Dashboard)
 * - Accessibility Features (Technical Specification/8.1.8 Accessibility Features)
 */
export const Header: React.FC<HeaderProps> = ({
  className,
  isAuthenticated,
  user
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [announceTheme, setAnnounceTheme] = useState(false);

  // Navigation menu options
  const menuOptions = [
    { value: 'profile', label: 'Profile Settings' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'logout', label: 'Sign Out' }
  ];

  // Handle theme toggle with screen reader announcement
  const handleThemeToggle = useCallback(() => {
    toggleTheme();
    setAnnounceTheme(true);
  }, [toggleTheme]);

  // Clear screen reader announcement after it's read
  useEffect(() => {
    if (announceTheme) {
      const timer = setTimeout(() => setAnnounceTheme(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [announceTheme]);

  // Handle user menu selection
  const handleMenuSelect = useCallback((value: string) => {
    setIsMenuOpen(false);
    // Menu actions would be implemented here
  }, []);

  return (
    <header 
      className={classNames('header', className)}
      role="banner"
    >
      {/* Logo and branding */}
      <div className="flex items-center">
        <img 
          src="/logo.svg" 
          alt="Mint Replica Lite" 
          className="header-logo"
        />
      </div>

      {/* Header actions */}
      <div className="header-actions">
        {/* Theme toggle button */}
        <Button
          variant="text"
          className="theme-toggle"
          onClick={handleThemeToggle}
          ariaLabel={`Switch to ${theme.mode === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme.mode === 'light' ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </Button>

        {/* Screen reader announcement for theme changes */}
        {announceTheme && (
          <div 
            role="status" 
            aria-live="polite" 
            className="sr-only"
          >
            {`Theme changed to ${theme.mode} mode`}
          </div>
        )}

        {/* User menu for authenticated users */}
        {isAuthenticated && user && (
          <div className="user-menu">
            <Dropdown
              options={menuOptions}
              value=""
              onChange={handleMenuSelect}
              className="w-48"
              ariaLabel="User menu"
            />
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.firstName} ${user.lastName}'s avatar`}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;