// @version react ^18.0.0
import React, { createContext, useContext, useCallback, useEffect, useReducer } from 'react';
import {
  Notification,
  NotificationSettings,
  getNotifications,
  markNotificationAsRead,
  getNotificationSettings,
  updateNotificationSettings
} from '../services/api/notifications.api';

/**
 * Human Tasks:
 * 1. Configure notification service monitoring in your observability platform
 * 2. Set up proper error tracking for notification context
 * 3. Configure WebSocket connection for real-time notifications
 * 4. Set up notification sound preferences in the environment
 * 5. Configure notification permission handling for the browser
 */

// Initial state for the notification context
const initialState: NotificationContextState = {
  notifications: [],
  loading: false,
  error: null,
  settings: {
    emailEnabled: false,
    pushEnabled: false,
    budgetAlerts: false,
    goalAlerts: false,
    transactionAlerts: false,
    investmentAlerts: false,
    excludedCategories: [],
    schedulePreferences: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      quietHours: false
    }
  },
  unreadCount: 0,
  hasMore: true,
  currentPage: 1
};

// Action types for the reducer
type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; changes: Partial<Notification> } }
  | { type: 'SET_SETTINGS'; payload: NotificationSettings }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'SET_HAS_MORE'; payload: boolean }
  | { type: 'SET_PAGE'; payload: number };

/**
 * Implements Technical Specification/1.1 System Overview
 * Interface defining the notification context state with comprehensive type safety
 */
export interface NotificationContextState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  settings: NotificationSettings;
  unreadCount: number;
  hasMore: boolean;
  currentPage: number;
}

/**
 * Implements Technical Specification/1.1 System Overview
 * Interface defining the notification context value with action handlers
 */
export interface NotificationContextValue {
  state: NotificationContextState;
  markAsRead: (notification: Notification) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  updateSettings: (settings: NotificationSettings) => Promise<void>;
  loadMore: () => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Reducer function for managing notification state
function notificationReducer(state: NotificationContextState, action: NotificationAction): NotificationContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.isRead).length
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + (action.payload.isRead ? 0 : 1)
      };
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.id ? { ...n, ...action.payload.changes } : n
        ),
        unreadCount: action.payload.changes.isRead
          ? state.unreadCount - 1
          : state.unreadCount
      };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    case 'SET_HAS_MORE':
      return { ...state, hasMore: action.payload };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    default:
      return state;
  }
}

/**
 * Implements Technical Specification/1.1 System Overview
 * Custom hook for managing notification state with proper error handling
 */
function useNotificationState(): NotificationContextState {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  useEffect(() => {
    // Load initial notification settings
    const loadSettings = async () => {
      try {
        const response = await getNotificationSettings();
        dispatch({ type: 'SET_SETTINGS', payload: response.data });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load notification settings' });
      }
    };

    loadSettings();
  }, []);

  return state;
}

/**
 * Implements Technical Specification/1.1 System Overview
 * Custom hook for notification actions with optimistic updates
 */
function useNotificationActions(
  dispatch: React.Dispatch<NotificationAction>
): Pick<NotificationContextValue, 'markAsRead' | 'fetchNotifications' | 'updateSettings' | 'loadMore'> {
  const markAsRead = useCallback(async (notification: Notification) => {
    try {
      // Optimistic update
      dispatch({
        type: 'UPDATE_NOTIFICATION',
        payload: { id: notification.id, changes: { isRead: true } }
      });

      await markNotificationAsRead(notification.id);
    } catch (error) {
      // Revert optimistic update on error
      dispatch({
        type: 'UPDATE_NOTIFICATION',
        payload: { id: notification.id, changes: { isRead: false } }
      });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to mark notification as read' });
    }
  }, [dispatch]);

  const fetchNotifications = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await getNotifications({
        page: 1,
        limit: 20
      });
      dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data });
      dispatch({ type: 'SET_HAS_MORE', payload: response.hasMore });
      dispatch({ type: 'SET_PAGE', payload: 1 });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch notifications' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const updateSettings = useCallback(async (settings: NotificationSettings) => {
    try {
      const response = await updateNotificationSettings(settings);
      dispatch({ type: 'SET_SETTINGS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update notification settings' });
      throw error;
    }
  }, [dispatch]);

  const loadMore = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await getNotifications({
        page: state.currentPage + 1,
        limit: 20
      });
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: [...state.notifications, ...response.data]
      });
      dispatch({ type: 'SET_HAS_MORE', payload: response.hasMore });
      dispatch({ type: 'SET_PAGE', payload: state.currentPage + 1 });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load more notifications' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch, state.currentPage, state.notifications]);

  return { markAsRead, fetchNotifications, updateSettings, loadMore };
}

/**
 * Implements Technical Specification/8.1 User Interface Design
 * Context provider component for notifications with error boundary
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const state = useNotificationState();
  const [, dispatch] = useReducer(notificationReducer, initialState);
  const actions = useNotificationActions(dispatch);

  useEffect(() => {
    // Initial fetch of notifications
    actions.fetchNotifications();

    // Set up WebSocket connection for real-time notifications
    // Note: Implementation depends on your WebSocket service
    const setupWebSocket = () => {
      try {
        const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:8080');
        
        ws.onmessage = (event) => {
          const notification: Notification = JSON.parse(event.data);
          dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
        };

        ws.onerror = () => {
          dispatch({ type: 'SET_ERROR', payload: 'WebSocket connection error' });
        };

        return () => {
          ws.close();
        };
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to establish WebSocket connection' });
      }
    };

    const cleanup = setupWebSocket();
    return () => {
      if (cleanup) cleanup();
    };
  }, [actions]);

  const value: NotificationContextValue = {
    state,
    ...actions
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Implements Technical Specification/8.1 User Interface Design
 * Custom hook for accessing notification context with type safety
 */
export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}