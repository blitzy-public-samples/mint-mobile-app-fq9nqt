/**
 * HUMAN TASKS:
 * 1. Verify color contrast ratios meet WCAG 2.1 Level AA standards (minimum 4.5:1)
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate touch target sizes on mobile devices (minimum 44x44px)
 * 4. Test responsive layout on various screen sizes (320px to 2048px)
 * 5. Verify focus management during navigation
 */

// Third-party imports
// @version: react ^18.0.0
import React, { useState, useEffect, useCallback } from 'react';
// @version: react-router-dom ^6.8.0
import { useLocation } from 'react-router-dom';
// @version: classnames ^2.3.2
import classNames from 'classnames';

// Internal imports
import { Header } from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { Sidebar } from '../components/layout/Sidebar';
import { useThemeContext } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';

// Styles
import styles from './MainLayout.module.css';

/**
 * Interface for MainLayout component props
 */
interface MainLayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

/**
 * Custom hook for managing responsive layout behavior
 * Addresses requirement: Mobile Responsive Considerations (Technical Specification/8.1.7)
 */
const useResponsiveLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  return {
    isSidebarOpen,
    isMobile,
    toggleSidebar,
    closeSidebar
  };
};

/**
 * MainLayout component that provides the core layout structure
 * 
 * Requirements addressed:
 * - Mobile-First Design (Technical Specification/1.1 System Overview)
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 * - Mobile Responsive Considerations (Technical Specification/8.1.7)
 * - Accessibility Features (Technical Specification/8.1.8)
 */
export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  isAuthenticated
}) => {
  const location = useLocation();
  const { theme } = useThemeContext();
  const { state: notificationState } = useNotifications();
  const { isSidebarOpen, isMobile, toggleSidebar, closeSidebar } = useResponsiveLayout();

  // Handle route changes
  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  // Apply theme classes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme.mode === 'dark');
  }, [theme.mode]);

  return (
    <div 
      className={styles.layout}
      data-theme={theme.mode}
      role="application"
      aria-label="Main application layout"
    >
      {/* Header with accessibility support */}
      <Header
        className="fixed top-0 left-0 right-0 z-50"
        isAuthenticated={isAuthenticated}
      />

      {/* Main content area with responsive sidebar */}
      <main 
        className={classNames(
          styles.main,
          { [styles['with-sidebar']]: isSidebarOpen && !isMobile }
        )}
        role="main"
      >
        {/* Sidebar with mobile responsiveness */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          isMobile={isMobile}
        />

        {/* Content area with proper spacing */}
        <div 
          className={styles.content}
          role="region"
          aria-label="Main content"
        >
          {/* Screen reader announcements for notifications */}
          {notificationState.unreadCount > 0 && (
            <div 
              role="status" 
              aria-live="polite" 
              className="sr-only"
            >
              {`You have ${notificationState.unreadCount} unread notifications`}
            </div>
          )}

          {/* Main content */}
          {children}
        </div>
      </main>

      {/* Footer with consistent layout */}
      <Footer />

      {/* Skip to main content link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50"
        role="navigation"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
    </div>
  );
};

// CSS Module styles
const cssModule = {
  '.layout': {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh'
  },
  '.main': {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 'var(--header-height)',
    position: 'relative'
  },
  '.content': {
    flex: '1',
    padding: 'var(--spacing-4)',
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    width: '100%'
  },
  '.with-sidebar': {
    marginLeft: 'var(--sidebar-width)'
  },
  '@media (max-width: 768px)': {
    '.with-sidebar': {
      marginLeft: '0'
    }
  }
};

export default MainLayout;