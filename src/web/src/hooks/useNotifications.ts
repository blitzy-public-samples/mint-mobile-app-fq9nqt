// @version react ^18.2.0

import { useState, useCallback, useEffect } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import {
  getNotifications,
  markNotificationAsRead,
  Notification,
  NotificationSettings
} from '../services/api/notifications.api';

/**
 * Human Tasks:
 * 1. Configure notification service monitoring in your observability platform
 * 2. Set up proper error tracking for notification-related errors
 * 3. Configure WebSocket connection for real-time notifications
 * 4. Set up notification sound preferences in the environment
 * 5. Configure notification permission handling for the browser
 */

/**
 * Interface for the return value of useNotifications hook with comprehensive type safety
 */
interface UseNotificationsResult {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  settings: NotificationSettings;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  updateSettings: (settings: NotificationSettings) => Promise<void>;
}

/**
 * Custom hook for managing notifications and notification preferences
 * Implements Technical Specification/1.1 System Overview - Real-time notification system
 * Implements Technical Specification/6.1.1 Core Application Components - Alert Management
 */
export function useNotifications({
  page,
  limit,
  type
}: {
  page: number;
  limit: number;
  type?: string;
}): UseNotificationsResult {
  // Local state for loading and error handling
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get notification context state and actions
  const { state, actions } = useNotificationContext();
  const { notifications, settings } = state;

  /**
   * Fetches notifications with pagination and filtering
   * Implements Technical Specification/1.1 System Overview - Real-time notification system
   */
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getNotifications({
        page,
        limit,
        type,
      });

      actions.setNotifications(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, type, actions]);

  /**
   * Marks a notification as read with optimistic updates
   * Implements Technical Specification/6.1.1 Core Application Components - Alert Management
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistic update
      const notificationIndex = notifications.findIndex(n => n.id === notificationId);
      if (notificationIndex === -1) {
        throw new Error('Notification not found');
      }

      const updatedNotifications = [...notifications];
      updatedNotifications[notificationIndex] = {
        ...updatedNotifications[notificationIndex],
        isRead: true
      };

      actions.setNotifications(updatedNotifications);

      // Make API call
      await markNotificationAsRead(notificationId);
    } catch (err) {
      // Revert optimistic update on error
      actions.setNotifications(notifications);
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(errorMessage);
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, [notifications, actions]);

  /**
   * Updates notification preferences with validation
   * Implements Technical Specification/6.1.1 Core Application Components - Alert Management
   */
  const updateSettings = useCallback(async (newSettings: NotificationSettings) => {
    try {
      // Validate required fields
      const requiredFields = [
        'emailEnabled',
        'pushEnabled',
        'budgetAlerts',
        'goalAlerts'
      ];

      for (const field of requiredFields) {
        if (!(field in newSettings)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Optimistic update
      actions.setSettings(newSettings);

      // Make API call
      await actions.updateSettings(newSettings);
    } catch (err) {
      // Revert optimistic update on error
      actions.setSettings(settings);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notification settings';
      setError(errorMessage);
      console.error('Error updating notification settings:', err);
      throw err;
    }
  }, [settings, actions]);

  // Fetch notifications on mount and when dependencies change
  useEffect(() => {
    fetchNotifications();

    // Set up WebSocket connection for real-time notifications
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const newNotification: Notification = JSON.parse(event.data);
        actions.setNotifications([newNotification, ...notifications]);
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('Real-time notification connection failed');
    };

    return () => {
      ws.close();
    };
  }, [page, limit, type, fetchNotifications, notifications, actions]);

  return {
    notifications,
    isLoading,
    error,
    settings,
    fetchNotifications,
    markAsRead,
    updateSettings
  };
}