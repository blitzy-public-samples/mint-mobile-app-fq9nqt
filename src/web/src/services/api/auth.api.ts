// @version axios ^1.4.0
import { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse, 
  PasswordResetCredentials 
} from '../../types/auth.types';
import { createApiRequest, handleApiError } from '../../utils/api.utils';
// import { API_CONFIG } from '../../config/api.config';

/**
 * Human Tasks:
 * 1. Configure environment variables for API endpoints
 * 2. Set up error tracking service integration
 * 3. Configure token storage encryption settings
 * 4. Set up SSL certificates and CORS configuration
 * 5. Configure rate limiting and security headers
 */

// Authentication endpoints
const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  RESET_PASSWORD: '/auth/reset-password',
  FORGOT_PASSWORD: '/auth/forgot-password'
} as const;

/**
 * Implements Technical Specification/9.1.1 Authentication Methods
 * Authenticates user with email and password, returns user data and tokens
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const api = createApiRequest({ 
      includeAuth: false,
      retryOnError: false 
    });

    const response = await api.post<AuthResponse>(
      AUTH_ENDPOINTS.LOGIN,
      credentials
    );

    // Store tokens securely
    if (response.data.accessToken) {
      localStorage.setItem('auth_token', response.data.accessToken);
      localStorage.setItem('refresh_token', response.data.refreshToken);
    }

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Implements Technical Specification/8.4.1 Authentication Flow
 * Registers new user account with provided credentials
 */
export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  try {
    const api = createApiRequest({ 
      includeAuth: false,
      retryOnError: false 
    });

    const response = await api.post<AuthResponse>(
      AUTH_ENDPOINTS.REGISTER,
      credentials
    );

    // Store tokens securely after successful registration
    if (response.data.accessToken) {
      localStorage.setItem('auth_token', response.data.accessToken);
      localStorage.setItem('refresh_token', response.data.refreshToken);
    }

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Implements Technical Specification/9.1.3 Session Management
 * Refreshes access token using refresh token
 */
export async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  try {
    const api = createApiRequest({ 
      includeAuth: false,
      retryOnError: false 
    });

    const response = await api.post<AuthResponse>(
      AUTH_ENDPOINTS.REFRESH_TOKEN,
      { refreshToken }
    );

    // Update stored tokens
    if (response.data.accessToken) {
      localStorage.setItem('auth_token', response.data.accessToken);
      localStorage.setItem('refresh_token', response.data.refreshToken);
    }

    return response.data;
  } catch (error) {
    // Clear tokens on refresh failure
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    throw handleApiError(error);
  }
}

/**
 * Implements Technical Specification/8.4.1 Authentication Flow
 * Logs out user and invalidates tokens
 */
export async function logout(): Promise<void> {
  try {
    const api = createApiRequest({ 
      includeAuth: true,
      retryOnError: false 
    });

    // Send logout request to invalidate tokens on server
    await api.post(AUTH_ENDPOINTS.LOGOUT);

    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  } catch (error) {
    // Clear tokens even if request fails
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    throw handleApiError(error);
  }
}

/**
 * Implements Technical Specification/9.1.1 Authentication Methods
 * Resets user password using reset token
 */
export async function resetPassword(credentials: PasswordResetCredentials): Promise<void> {
  try {
    const api = createApiRequest({ 
      includeAuth: false,
      retryOnError: false 
    });

    await api.post(
      AUTH_ENDPOINTS.RESET_PASSWORD,
      credentials
    );
  } catch (error) {
    throw handleApiError(error);
  }
}

/**
 * Implements Technical Specification/9.1.1 Authentication Methods
 * Requests password reset email for user
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    const api = createApiRequest({ 
      includeAuth: false,
      retryOnError: true,
      maxRetries: 0
    });

    await api.post(
      AUTH_ENDPOINTS.FORGOT_PASSWORD,
      { email }
    );
  } catch (error) {
    throw handleApiError(error);
  }
}