// @jest/globals ^29.0.0
// @testing-library/react-hooks ^8.0.0
// @testing-library/jest-dom ^5.16.0

import { renderHook, act } from '@testing-library/react-hooks';
import { jest } from '@jest/globals';
import useAuth from '../../src/hooks/useAuth';
import * as auth from '../../src/services/api/auth.api';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '../../src/types/auth.types';

/**
 * Human Tasks:
 * 1. Configure test environment variables for API endpoints
 * 2. Set up test database with mock user data
 * 3. Configure test token encryption keys
 * 4. Set up test SSL certificates
 */

// Mock the auth service
jest.mock('../../src/services/api/auth.api');

describe('useAuth hook', () => {
  // Mock test data based on JSON specification
  const mockLoginCredentials: LoginCredentials = {
    email: 'test@example.com',
    password: 'Test123!'
  };

  const mockRegisterCredentials: RegisterCredentials = {
    email: 'test@example.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User'
  };

  const mockAuthResponse: AuthResponse = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  /**
   * Tests login functionality
   * Requirements addressed:
   * - Technical Specification/9.1.1 Authentication Methods
   * - Technical Specification/8.4.1 Authentication Flow
   */
  describe('login', () => {
    it('should successfully authenticate user with valid credentials', async () => {
      // Mock successful login
      (auth.login as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login(mockLoginCredentials);
      });

      // Verify auth state updated correctly
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockAuthResponse.user);
      expect(localStorage.getItem('auth_token')).toBe(mockAuthResponse.accessToken);
      expect(localStorage.getItem('refresh_token')).toBe(mockAuthResponse.refreshToken);
      expect(auth.login).toHaveBeenCalledWith(mockLoginCredentials);
    });

    it('should handle login failure correctly', async () => {
      const errorMessage = 'Invalid credentials';
      (auth.login as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.login(mockLoginCredentials);
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      // Verify auth state remains unauthenticated
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  /**
   * Tests registration functionality
   * Requirements addressed:
   * - Technical Specification/9.1.1 Authentication Methods
   * - Technical Specification/8.4.1 Authentication Flow
   */
  describe('register', () => {
    it('should successfully register new user with valid credentials', async () => {
      (auth.register as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register(mockRegisterCredentials);
      });

      // Verify registration and auth state
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockAuthResponse.user);
      expect(localStorage.getItem('auth_token')).toBe(mockAuthResponse.accessToken);
      expect(localStorage.getItem('refresh_token')).toBe(mockAuthResponse.refreshToken);
      expect(auth.register).toHaveBeenCalledWith(mockRegisterCredentials);
    });

    it('should handle registration failure correctly', async () => {
      const errorMessage = 'Email already exists';
      (auth.register as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.register(mockRegisterCredentials);
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  /**
   * Tests token refresh functionality
   * Requirements addressed:
   * - Technical Specification/9.1.3 Session Management
   */
  describe('token refresh', () => {
    it('should successfully refresh tokens', async () => {
      const newAuthResponse = {
        ...mockAuthResponse,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      (auth.refreshToken as jest.Mock).mockResolvedValueOnce(newAuthResponse);

      const { result } = renderHook(() => useAuth());

      // Set initial auth state
      localStorage.setItem('auth_token', mockAuthResponse.accessToken);
      localStorage.setItem('refresh_token', mockAuthResponse.refreshToken);

      await act(async () => {
        await result.current.refreshTokens();
      });

      // Verify tokens were refreshed
      expect(localStorage.getItem('auth_token')).toBe(newAuthResponse.accessToken);
      expect(localStorage.getItem('refresh_token')).toBe(newAuthResponse.refreshToken);
      expect(auth.refreshToken).toHaveBeenCalledWith(mockAuthResponse.refreshToken);
    });

    it('should handle token refresh failure', async () => {
      (auth.refreshToken as jest.Mock).mockRejectedValueOnce(new Error('Token expired'));

      const { result } = renderHook(() => useAuth());

      localStorage.setItem('auth_token', mockAuthResponse.accessToken);
      localStorage.setItem('refresh_token', mockAuthResponse.refreshToken);

      await act(async () => {
        try {
          await result.current.refreshTokens();
        } catch (error) {
          expect(error.message).toBe('Token expired');
        }
      });

      // Verify tokens were cleared on failure
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  /**
   * Tests logout functionality
   * Requirements addressed:
   * - Technical Specification/8.4.1 Authentication Flow
   * - Technical Specification/9.1.3 Session Management
   */
  describe('logout', () => {
    it('should successfully logout and clear auth state', async () => {
      (auth.logout as jest.Mock).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth());

      // Set initial authenticated state
      localStorage.setItem('auth_token', mockAuthResponse.accessToken);
      localStorage.setItem('refresh_token', mockAuthResponse.refreshToken);
      
      await act(async () => {
        await result.current.logout();
      });

      // Verify auth state cleared
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(auth.logout).toHaveBeenCalled();
    });

    it('should clear local auth state even if logout request fails', async () => {
      (auth.logout as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      localStorage.setItem('auth_token', mockAuthResponse.accessToken);
      localStorage.setItem('refresh_token', mockAuthResponse.refreshToken);

      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          expect(error.message).toBe('Network error');
        }
      });

      // Verify auth state still cleared despite API error
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  /**
   * Tests session validation
   * Requirements addressed:
   * - Technical Specification/9.1.3 Session Management
   */
  describe('session validation', () => {
    it('should validate existing session on mount', async () => {
      (auth.refreshToken as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      localStorage.setItem('auth_token', 'expired-token');
      localStorage.setItem('refresh_token', mockAuthResponse.refreshToken);

      const { result } = renderHook(() => useAuth());

      // Wait for initial session validation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockAuthResponse.user);
      expect(localStorage.getItem('auth_token')).toBe(mockAuthResponse.accessToken);
      expect(auth.refreshToken).toHaveBeenCalled();
    });

    it('should handle invalid session on mount', async () => {
      (auth.refreshToken as jest.Mock).mockRejectedValueOnce(new Error('Invalid session'));

      localStorage.setItem('auth_token', 'invalid-token');
      localStorage.setItem('refresh_token', 'invalid-refresh-token');

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });
});