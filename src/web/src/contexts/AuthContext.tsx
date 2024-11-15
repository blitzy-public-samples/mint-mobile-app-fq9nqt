/**
 * Human Tasks:
 * 1. Configure JWT token secret in environment variables
 * 2. Set up token expiration times in environment settings
 * 3. Configure secure storage encryption key
 * 4. Set up error tracking service integration
 * 5. Configure rate limiting and security headers
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'; // @version ^18.2.0
import { 
  AuthState, 
  LoginCredentials, 
  RegisterCredentials, 
  User 
} from '../types/auth.types';
import { 
  login as loginApi, 
  register as registerApi, 
  logout as logoutApi,
  refreshToken as refreshTokenApi 
} from '../services/api/auth.api';
import { SecureStorageService } from '../services/storage/secureStorage.service';
import { mockUser } from '@/mocks/mockData';

// Initial authentication state
const INITIAL_AUTH_STATE: AuthState = {
  isAuthenticated: true,
  user: mockUser as unknown as User,
  accessToken: null,
  refreshToken: null,
};

// Token refresh interval (14 minutes = 840000ms)
const TOKEN_REFRESH_INTERVAL = 840000;

// Context interface definition
interface AuthContextType {
  authState: AuthState;
  handleLogin: (credentials: LoginCredentials) => Promise<void>;
  handleRegister: (credentials: RegisterCredentials) => Promise<void>;
  handleLogout: () => Promise<void>;
}

/**
 * Authentication Context
 * Implements Technical Specification/9.1.1 Authentication Methods
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * Implements:
 * - Technical Specification/9.1.1 Authentication Methods
 * - Technical Specification/9.1.3 Session Management
 * - Technical Specification/8.4.1 Authentication Flow
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(INITIAL_AUTH_STATE);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout>();
  const secureStorage = new SecureStorageService();

  /**
   * Initialize authentication state from secure storage
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAccessToken = await secureStorage.getSecureItem<string>('access_token');
        const storedRefreshToken = await secureStorage.getSecureItem<string>('refresh_token');
        const storedUser = await secureStorage.getSecureItem<User>('user');

        if (storedAccessToken && storedRefreshToken && storedUser) {
          setAuthState({
            isAuthenticated: true,
            user: storedUser,
            accessToken: storedAccessToken,
            refreshToken: storedRefreshToken,
          });
          startTokenRefresh();
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        await handleLogout();
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Start token refresh interval
   * Implements Technical Specification/9.1.3 Session Management
   */
  const startTokenRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    const interval = setInterval(async () => {
      try {
        const currentRefreshToken = await secureStorage.getSecureItem<string>('refresh_token');
        if (currentRefreshToken) {
          const response = await refreshTokenApi(currentRefreshToken);
          await secureStorage.setSecureItem('access_token', response.accessToken);
          await secureStorage.setSecureItem('refresh_token', response.refreshToken);
          await secureStorage.setSecureItem('user', response.user);

          setAuthState({
            isAuthenticated: true,
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          });
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        await handleLogout();
      }
    }, TOKEN_REFRESH_INTERVAL);

    setRefreshInterval(interval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  /**
   * Handle user login
   * Implements Technical Specification/8.4.1 Authentication Flow
   */
  const handleLogin = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const response = await loginApi(credentials);

      // Store authentication data securely
      await secureStorage.setSecureItem('access_token', response.accessToken);
      await secureStorage.setSecureItem('refresh_token', response.refreshToken);
      await secureStorage.setSecureItem('user', response.user);

      setAuthState({
        isAuthenticated: true,
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      startTokenRefresh();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  /**
   * Handle user registration
   * Implements Technical Specification/8.4.1 Authentication Flow
   */
  const handleRegister = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      const response = await registerApi(credentials);

      // Store authentication data securely
      await secureStorage.setSecureItem('access_token', response.accessToken);
      await secureStorage.setSecureItem('refresh_token', response.refreshToken);
      await secureStorage.setSecureItem('user', response.user);

      setAuthState({
        isAuthenticated: true,
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });

      startTokenRefresh();
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  /**
   * Handle user logout
   * Implements Technical Specification/8.4.1 Authentication Flow
   */
  const handleLogout = async (): Promise<void> => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear secure storage and reset state regardless of API call success
      await secureStorage.clearSecureStorage();
      setAuthState(INITIAL_AUTH_STATE);
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        handleLogin,
        handleRegister,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook for accessing authentication context
 * Implements Technical Specification/8.4.1 Authentication Flow
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};