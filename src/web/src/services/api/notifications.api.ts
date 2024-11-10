// @version axios ^1.4.0
import axios from 'axios';
import { ApiResponse, PaginatedResponse } from '../../types/api.types';
import { API_ENDPOINTS } from '../../constants/api.constants';
import { createApiConfig } from '../../config/api.config';

/**
 * Human Tasks:
 * 1. Configure notification service monitoring in your observability platform
 * 2. Set up proper logging for notification delivery tracking
 * 3. Configure notification preferences in the environment settings
 * 4. Set up notification delivery retry queue system
 * 5. Configure rate limiting for notification endpoints
 */

/**
 * Implements Technical Specification/1.1 System Overview
 * Interface for notification data structure with comprehensive type safety
 */
export interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  data: Record<string, any>;
  userId: string;
  category: string;
  priority: string;
  correlationId: string;
}

/**
 * Implements Technical Specification/1.1 System Overview
 * Interface for notification preferences with granular control
 */
export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  budgetAlerts: boolean;
  goalAlerts: boolean;
  transactionAlerts: boolean;
  investmentAlerts: boolean;
  excludedCategories: string[];
  schedulePreferences: {
    startTime?: string;
    endTime?: string;
    timezone: string;
    quietHours: boolean;
  };
}

/**
 * Implements Technical Specification/8.3 API Design/8.3.1 REST API Endpoints
 * Interface for notification query parameters
 */
interface NotificationQueryParams {
  page: number;
  limit: number;
  type?: string;
  isRead?: boolean;
  category?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Implements Technical Specification/1.1 System Overview
 * Fetches paginated list of notifications for the current user with filtering options
 */
export async function getNotifications(params: NotificationQueryParams): Promise<PaginatedResponse<Notification>> {
  try {
    const config = createApiConfig({
      includeAuth: true,
      timeout: 10000,
      retryOnError: true,
      maxRetries: 3
    });

    // Validate and sanitize query parameters
    const validatedParams = {
      page: Math.max(1, params.page),
      limit: Math.min(100, Math.max(1, params.limit)),
      type: params.type?.trim(),
      isRead: params.isRead,
      category: params.category?.trim(),
      startDate: params.startDate,
      endDate: params.endDate
    };

    const response = await axios.get(
      API_ENDPOINTS.NOTIFICATIONS.BASE,
      {
        ...config,
        params: validatedParams
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Implements Technical Specification/1.1 System Overview
 * Marks a specific notification as read with optimistic update
 */
export async function markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
  try {
    // Validate notification ID
    if (!notificationId || typeof notificationId !== 'string') {
      throw new Error('Invalid notification ID');
    }

    const config = createApiConfig({
      includeAuth: true,
      timeout: 5000
    });

    const endpoint = API_ENDPOINTS.NOTIFICATIONS.MARK_READ.replace(':id', notificationId);
    const response = await axios.put(endpoint, {}, config);

    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Implements Technical Specification/1.1 System Overview
 * Retrieves user's notification preferences with caching
 */
export async function getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
  try {
    const config = createApiConfig({
      includeAuth: true,
      timeout: 8000
    });

    // Check cache first
    const cachedSettings = localStorage.getItem('notification_settings');
    const cacheTimestamp = localStorage.getItem('notification_settings_timestamp');
    
    if (cachedSettings && cacheTimestamp) {
      const cacheAge = Date.now() - Number(cacheTimestamp);
      // Use cache if it's less than 5 minutes old
      if (cacheAge < 5 * 60 * 1000) {
        return JSON.parse(cachedSettings);
      }
    }

    const response = await axios.get(
      API_ENDPOINTS.NOTIFICATIONS.SETTINGS,
      config
    );

    // Cache the new settings
    localStorage.setItem('notification_settings', JSON.stringify(response.data));
    localStorage.setItem('notification_settings_timestamp', Date.now().toString());

    return response.data;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    throw error;
  }
}

/**
 * Implements Technical Specification/1.1 System Overview
 * Updates user's notification preferences with validation
 */
export async function updateNotificationSettings(settings: NotificationSettings): Promise<ApiResponse<NotificationSettings>> {
  try {
    // Validate settings object
    if (!settings || typeof settings !== 'object') {
      throw new Error('Invalid settings object');
    }

    // Validate required fields
    const requiredFields = ['emailEnabled', 'pushEnabled', 'budgetAlerts', 'goalAlerts', 
      'transactionAlerts', 'investmentAlerts', 'excludedCategories'];
    
    for (const field of requiredFields) {
      if (!(field in settings)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate schedule preferences if provided
    if (settings.schedulePreferences) {
      if (settings.schedulePreferences.quietHours) {
        if (!settings.schedulePreferences.startTime || !settings.schedulePreferences.endTime) {
          throw new Error('Start time and end time are required for quiet hours');
        }
      }
      if (!settings.schedulePreferences.timezone) {
        throw new Error('Timezone is required in schedule preferences');
      }
    }

    const config = createApiConfig({
      includeAuth: true,
      timeout: 10000
    });

    const response = await axios.put(
      API_ENDPOINTS.NOTIFICATIONS.SETTINGS,
      settings,
      config
    );

    // Update cache with new settings
    localStorage.setItem('notification_settings', JSON.stringify(response.data));
    localStorage.setItem('notification_settings_timestamp', Date.now().toString());

    return response.data;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw error;
  }
}