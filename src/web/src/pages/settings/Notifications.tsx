/**
 * Settings page component for managing notification preferences and viewing notification history.
 * Implements real-time updates, accessibility features, and responsive design.
 * 
 * Requirements addressed:
 * - Real-time notification system (Technical Specification/1.1 System Overview)
 * - Alert Management (Technical Specification/6.1.1 Core Application Components)
 * - User Interface Design (Technical Specification/8.1 User Interface Design)
 */

// @version: react ^18.2.0
import React, { useState, useCallback } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import type { NotificationPreference } from '../../types/models.types';

// Human tasks:
// 1. Configure notification permission handling in the browser
// 2. Set up proper error tracking for notification-related errors
// 3. Verify accessibility compliance with screen readers
// 4. Test notification sound preferences in different environments
// 5. Validate color contrast ratios for notification status indicators

const NotificationsPage: React.FC = () => {
  // Local state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Initialize notifications hook
  const {
    notifications,
    settings,
    isLoading,
    updateSettings,
  } = useNotifications({
    page: currentPage,
    limit: PAGE_SIZE,
  });

  /**
   * Handles changes to notification preferences with optimistic updates
   * Implements Technical Specification/6.1.1 Core Application Components - Alert Management
   */
  const handlePreferenceChange = useCallback(async (
    preferenceKey: keyof NotificationPreference,
    value: boolean
  ) => {
    try {
      await updateSettings({
        ...settings,
        [preferenceKey]: value,
      });
    } catch (error) {
      // Error handling is managed by the hook
      console.error('Failed to update notification preference:', error);
    }
  }, [settings, updateSettings]);

  // Table columns configuration
  const columns = [
    {
      key: 'timestamp',
      header: 'Date',
      width: '20%',
      render: (notification: any) => new Date(notification.timestamp).toLocaleDateString(),
    },
    {
      key: 'type',
      header: 'Type',
      width: '15%',
      render: (notification: any) => (
        <span className="notification-type" data-type={notification.type}>
          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
        </span>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      width: '45%',
    },
    {
      key: 'status',
      header: 'Status',
      width: '20%',
      render: (notification: any) => (
        <span 
          className={`notification-status ${notification.isRead ? 'read' : 'unread'}`}
          aria-label={notification.isRead ? 'Read' : 'Unread'}
        >
          {notification.isRead ? 'Read' : 'Unread'}
        </span>
      ),
    },
  ];

  return (
    <div className="notifications-page">
      <Card
        title="Notification Preferences"
        loading={isLoading}
        testId="notification-preferences"
      >
        <div className="preferences-grid">
          <div className="preference-item">
            <label className="preference-label">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(e) => handlePreferenceChange('emailEnabled', e.target.checked)}
                aria-label="Enable email notifications"
              />
              Email Notifications
            </label>
            <p className="preference-description">
              Receive notifications via email
            </p>
          </div>

          <div className="preference-item">
            <label className="preference-label">
              <input
                type="checkbox"
                checked={settings.pushEnabled}
                onChange={(e) => handlePreferenceChange('pushEnabled', e.target.checked)}
                aria-label="Enable push notifications"
              />
              Push Notifications
            </label>
            <p className="preference-description">
              Receive notifications in your browser
            </p>
          </div>

          <div className="preference-item">
            <label className="preference-label">
              <input
                type="checkbox"
                checked={settings.budgetAlerts}
                onChange={(e) => handlePreferenceChange('budgetAlerts', e.target.checked)}
                aria-label="Enable budget alerts"
              />
              Budget Alerts
            </label>
            <p className="preference-description">
              Get notified about budget thresholds
            </p>
          </div>

          <div className="preference-item">
            <label className="preference-label">
              <input
                type="checkbox"
                checked={settings.goalAlerts}
                onChange={(e) => handlePreferenceChange('goalAlerts', e.target.checked)}
                aria-label="Enable goal alerts"
              />
              Goal Alerts
            </label>
            <p className="preference-description">
              Get notified about goal progress
            </p>
          </div>

          <div className="preference-item">
            <label className="preference-label">
              <input
                type="checkbox"
                checked={settings.transactionAlerts}
                onChange={(e) => handlePreferenceChange('transactionAlerts', e.target.checked)}
                aria-label="Enable transaction alerts"
              />
              Transaction Alerts
            </label>
            <p className="preference-description">
              Get notified about new transactions
            </p>
          </div>

          <div className="preference-item">
            <label className="preference-label">
              <input
                type="checkbox"
                checked={settings.investmentAlerts}
                onChange={(e) => handlePreferenceChange('investmentAlerts', e.target.checked)}
                aria-label="Enable investment alerts"
              />
              Investment Alerts
            </label>
            <p className="preference-description">
              Get notified about investment updates
            </p>
          </div>
        </div>
      </Card>

      <Card
        title="Notification History"
        loading={isLoading}
        testId="notification-history"
        className="notification-history"
      >
        <Table
          data={notifications}
          columns={columns}
          loading={isLoading}
          pageSize={PAGE_SIZE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          ariaLabel="Notification history table"
          hoverable
          striped
        />
      </Card>

      <style jsx>{`
        .notifications-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .preferences-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          padding: 1rem 0;
        }

        .preference-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .preference-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 500;
          font-size: 1rem;
          color: var(--color-text-primary);
          cursor: pointer;
        }

        .preference-label input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .preference-description {
          margin: 0;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }

        .notification-type {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .notification-type[data-type="budget"] {
          background-color: var(--color-budget);
          color: var(--color-budget-text);
        }

        .notification-type[data-type="goal"] {
          background-color: var(--color-goal);
          color: var(--color-goal-text);
        }

        .notification-type[data-type="transaction"] {
          background-color: var(--color-transaction);
          color: var(--color-transaction-text);
        }

        .notification-type[data-type="investment"] {
          background-color: var(--color-investment);
          color: var(--color-investment-text);
        }

        .notification-status {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .notification-status::before {
          content: '';
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .notification-status.read::before {
          background-color: var(--color-success);
        }

        .notification-status.unread::before {
          background-color: var(--color-warning);
        }

        .notification-history {
          margin-top: 2rem;
        }

        @media (max-width: 768px) {
          .preferences-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .preference-item {
            padding: 0.5rem 0;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;