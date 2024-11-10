/**
 * HUMAN TASKS:
 * 1. Verify WCAG 2.1 compliance for tab navigation
 * 2. Test keyboard navigation flow with screen readers
 * 3. Validate color contrast ratios in all themes
 * 4. Test responsive layout on various screen sizes
 * 5. Verify proper focus management during tab switches
 */

// Third-party imports
// @version: react ^18.2.0
import React, { useState, useEffect } from 'react';

// Internal imports
import DashboardLayout from '../../layouts/DashboardLayout';
import { Tabs, TabOrientation } from '../../components/common/Tabs';
import Profile from './Profile';
import Security from './Security';
import Notifications from './Notifications';

/**
 * Main settings page component with tabbed interface
 * Implements:
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 * - Authentication and Authorization (Technical Specification/9.1 Authentication and Authorization)
 * - Mobile Responsive Considerations (Technical Specification/8.1.7)
 * - Accessibility Features (Technical Specification/8.1.8)
 */
const SettingsPage: React.FC = () => {
  // State for active tab and orientation
  const [activeTabId, setActiveTabId] = useState<string>('profile');
  const [tabOrientation, setTabOrientation] = useState<TabOrientation>('horizontal');

  // Settings tabs configuration with ARIA support
  const settingsTabs = [
    {
      id: 'profile',
      label: 'Profile',
      content: <Profile />,
      ariaLabel: 'Profile settings tab'
    },
    {
      id: 'security',
      label: 'Security',
      content: <Security />,
      ariaLabel: 'Security settings tab'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      content: <Notifications />,
      ariaLabel: 'Notification settings tab'
    }
  ];

  /**
   * Handle responsive tab orientation
   * Implements Technical Specification/8.1.7 Mobile Responsive Considerations
   */
  useEffect(() => {
    const handleResize = () => {
      setTabOrientation(window.innerWidth < 768 ? 'vertical' : 'horizontal');
    };

    // Initial check
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /**
   * Handle tab change with URL updates and focus management
   * Implements Technical Specification/8.1.8 Accessibility Features
   */
  const handleTabChange = (tabId: string) => {
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url.toString());

    // Update active tab
    setActiveTabId(tabId);

    // Announce tab change to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `${settingsTabs.find(tab => tab.id === tabId)?.label} tab selected`;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);

    // Focus management
    const tabPanel = document.getElementById(`tabpanel-${tabId}`);
    if (tabPanel) {
      tabPanel.focus();
    }
  };

  /**
   * Initialize active tab from URL
   * Implements Technical Specification/8.1 User Interface Design
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && settingsTabs.some(tab => tab.id === tabParam)) {
      setActiveTabId(tabParam);
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="settings-container" role="main">
        <header className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-description">
            Manage your account settings and preferences
          </p>
        </header>

        <div className="settings-content">
          {/* Tabs navigation */}
          <Tabs
            tabs={settingsTabs}
            activeTabId={activeTabId}
            onTabChange={handleTabChange}
            orientation={tabOrientation}
            ariaLabel="Settings navigation"
            className="settings-tabs"
          />

          {/* Tab panels */}
          <div className="settings-tab-content">
            {settingsTabs.map(tab => (
              <div
                key={tab.id}
                id={`tabpanel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                hidden={activeTabId !== tab.id}
                tabIndex={0}
                className="settings-tab-panel"
              >
                {tab.content}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-container {
          max-width: ${styles.container.maxWidth};
          margin: ${styles.container.margin};
          padding: ${styles.container.padding};
        }

        .settings-header {
          margin-bottom: ${styles.header.marginBottom};
        }

        .settings-title {
          font-size: ${styles.title.fontSize};
          font-weight: ${styles.title.fontWeight};
          color: ${styles.title.color};
        }

        .settings-content {
          background-color: ${styles.tabContent.backgroundColor};
          border-radius: ${styles.tabContent.borderRadius};
          margin-top: ${styles.tabContent.marginTop};
          min-height: ${styles.tabContent.minHeight};
        }

        .settings-tab-panel {
          padding: ${styles.tabContent.padding};
        }

        .settings-tabs {
          border-bottom: 1px solid var(--color-border);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }

        @media (max-width: 768px) {
          .settings-container {
            padding: ${styles['@media (max-width: 768px)'].container.padding};
          }

          .settings-tab-panel {
            padding: ${styles['@media (max-width: 768px)'].tabContent.padding};
          }

          .settings-title {
            font-size: ${styles['@media (max-width: 768px)'].title.fontSize};
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default SettingsPage;