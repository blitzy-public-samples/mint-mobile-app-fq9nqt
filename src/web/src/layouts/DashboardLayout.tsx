/**
 * HUMAN TASKS:
 * 1. Verify color contrast ratios meet WCAG 2.1 Level AA standards
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate touch target sizes on mobile devices (minimum 44x44px)
 * 4. Test focus management during sidebar transitions
 * 5. Verify proper ARIA live region announcements
 */

// Third-party imports
// @version: react ^18.2.0
import React, { useState, useEffect, useCallback } from 'react';
// @version: react-router-dom ^6.8.0
import { Outlet } from 'react-router-dom';

// Internal imports
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';

// Props interface
interface DashboardLayoutProps {
  children?: React.ReactNode;
}

/**
 * Main dashboard layout component that provides the structural composition for authenticated views
 * Addresses requirements:
 * - Mobile-First Design (Technical Specification/1.1 System Overview)
 * - User Interface Design (Technical Specification/8.1 User Interface Design/8.1.2 Main Dashboard)
 * - Mobile Responsive Considerations (Technical Specification/8.1.7)
 * - Accessibility Features (Technical Specification/8.1.8)
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = () => {
  // Authentication state
  const { authState: { isAuthenticated, user } } = useAuth();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /**
   * Handle sidebar toggle with accessibility considerations
   * Addresses requirement: Accessibility Features
   */
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => {
      const newState = !prev;
      // Announce state change to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = `Navigation menu ${newState ? 'opened' : 'closed'}`;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
      return newState;
    });
  }, []);

  /**
   * Handle responsive behavior
   * Addresses requirement: Mobile Responsive Considerations
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleResize = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (!e.matches && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    // Initial check
    handleResize(mediaQuery);

    // Add listener for changes
    mediaQuery.addEventListener('change', handleResize);

    return () => mediaQuery.removeEventListener('change', handleResize);
  }, [isSidebarOpen]);

  /**
   * Handle keyboard navigation
   * Addresses requirement: Accessibility Features
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  return (
    <div 
      className="dashboard-layout"
      role="main"
    >
      {/* Header component */}
      <Header
        isAuthenticated={isAuthenticated}
        user={user}
      />

      {/* Main content area with sidebar */}
      <div className="dashboard-content">
        {/* Sidebar navigation */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isMobile={isMobile}
        />

        {/* Main content with proper ARIA landmarks */}
        <main 
          className="main-content"
          role="region"
          aria-label="Dashboard content"
        >
          {/* Render child routes */}
          <Outlet />
        </main>

        {/* Mobile overlay */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>
    </div>
  );
};

// CSS Modules
const styles = {
  '.dashboard-layout': {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--color-background)'
  },
  '.dashboard-content': {
    display: 'flex',
    flex: '1',
    marginTop: '64px'
  },
  '.main-content': {
    flex: '1',
    padding: 'var(--spacing-6)',
    overflowY: 'auto'
  },
  '@media (max-width: 768px)': {
    '.main-content': {
      padding: 'var(--spacing-4)'
    }
  }
};

export default DashboardLayout;