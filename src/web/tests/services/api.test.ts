// @version jest ^29.0.0
// @version axios-mock-adapter ^1.21.0

import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { 
  login, 
  register, 
  refreshToken,
  logout 
} from '../../src/services/api/auth.api';
import { 
  getAccounts, 
  linkAccount, 
  syncAccount 
} from '../../src/services/api/accounts.api';
import { 
  createApiRequest, 
  handleApiError 
} from '../../src/utils/api.utils';
import { API_CONFIG } from '../../src/config/api.config';

/**
 * Human Tasks:
 * 1. Configure test environment variables in .env.test
 * 2. Set up test database with mock data
 * 3. Configure test SSL certificates
 * 4. Set up test monitoring and logging
 * 5. Review and adjust test timeouts for CI/CD pipeline
 */

describe('AuthAPI', () => {
  let mockAxios: MockAdapter;

  const mockAuthResponse = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com'
    },
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  };

  beforeAll(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.reset();
    localStorage.clear();
  });

  afterAll(() => {
    mockAxios.restore();
  });

  /**
   * Tests Technical Specification/9.1 Authentication and Authorization
   * Validates login functionality with proper credentials
   */
  describe('login()', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'Test123!'
    };

    it('should successfully authenticate user with valid credentials', async () => {
      mockAxios.onPost('/auth/login').reply(200, mockAuthResponse);

      const response = await login(loginCredentials);

      expect(response).toEqual(mockAuthResponse);
      expect(localStorage.getItem('auth_token')).toBe(mockAuthResponse.accessToken);
      expect(localStorage.getItem('refresh_token')).toBe(mockAuthResponse.refreshToken);
    });

    it('should handle invalid credentials error', async () => {
      mockAxios.onPost('/auth/login').reply(401, {
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
        details: ['Authentication failed']
      });

      await expect(login(loginCredentials)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials'
      });
    });

    it('should handle network errors during login', async () => {
      mockAxios.onPost('/auth/login').networkError();

      await expect(login(loginCredentials)).rejects.toMatchObject({
        code: 'NETWORK_ERROR'
      });
    });
  });

  /**
   * Tests Technical Specification/9.1 Authentication and Authorization
   * Validates registration process with proper data validation
   */
  describe('register()', () => {
    const registerCredentials = {
      email: 'newuser@example.com',
      password: 'NewUser123!',
      firstName: 'Test',
      lastName: 'User'
    };

    it('should successfully register new user with valid data', async () => {
      mockAxios.onPost('/auth/register').reply(201, mockAuthResponse);

      const response = await register(registerCredentials);

      expect(response).toEqual(mockAuthResponse);
      expect(localStorage.getItem('auth_token')).toBe(mockAuthResponse.accessToken);
    });

    it('should handle duplicate email registration', async () => {
      mockAxios.onPost('/auth/register').reply(409, {
        code: 'VALIDATION_ERROR',
        message: 'Email already exists',
        details: ['User with this email already exists']
      });

      await expect(register(registerCredentials)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Email already exists'
      });
    });
  });

  /**
   * Tests Technical Specification/9.1 Authentication and Authorization
   * Validates token refresh mechanism with proper expiry handling
   */
  describe('refreshToken()', () => {
    it('should successfully refresh access token', async () => {
      const newTokens = {
        ...mockAuthResponse,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      mockAxios.onPost('/auth/refresh').reply(200, newTokens);

      const response = await refreshToken('old-refresh-token');

      expect(response).toEqual(newTokens);
      expect(localStorage.getItem('auth_token')).toBe(newTokens.accessToken);
      expect(localStorage.getItem('refresh_token')).toBe(newTokens.refreshToken);
    });

    it('should handle invalid refresh token', async () => {
      mockAxios.onPost('/auth/refresh').reply(401, {
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
        details: ['Token has expired or is invalid']
      });

      await expect(refreshToken('invalid-token')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token'
      });
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });
});

describe('AccountsAPI', () => {
  let mockAxios: MockAdapter;

  const mockAccountsResponse = {
    data: [{
      id: 'test-account-id',
      institutionId: 'test-institution',
      accountType: 'CHECKING',
      balance: 1000.0,
      lastSynced: '2023-01-01T00:00:00Z'
    }],
    success: true
  };

  beforeAll(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  afterAll(() => {
    mockAxios.restore();
  });

  /**
   * Tests Technical Specification/1.2 Scope/Core Features
   * Validates account retrieval functionality
   */
  describe('getAccounts()', () => {
    it('should successfully retrieve user accounts', async () => {
      mockAxios.onGet('/accounts').reply(200, mockAccountsResponse);

      const response = await getAccounts();

      expect(response).toEqual(mockAccountsResponse);
      expect(response.data[0].accountType).toBe('CHECKING');
    });

    it('should handle unauthorized access', async () => {
      mockAxios.onGet('/accounts').reply(401, {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
        details: ['Authentication required']
      });

      await expect(getAccounts()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      });
    });
  });

  /**
   * Tests Technical Specification/1.2 Scope/Core Features
   * Validates Plaid integration for account linking
   */
  describe('linkAccount()', () => {
    const linkData = {
      publicToken: 'test-public-token',
      institutionId: 'test-institution',
      accountType: 'CHECKING' as const,
      metadata: {
        name: 'Test Bank'
      }
    };

    it('should successfully link new account', async () => {
      mockAxios.onPost('/accounts/link').reply(201, {
        data: {
          id: 'new-account-id',
          ...linkData,
          balance: 0,
          lastSynced: expect.any(String)
        },
        success: true
      });

      const response = await linkAccount(linkData);

      expect(response.data.institutionId).toBe(linkData.institutionId);
      expect(response.data.accountType).toBe(linkData.accountType);
    });

    it('should handle invalid Plaid token', async () => {
      mockAxios.onPost('/accounts/link').reply(422, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid Plaid token',
        details: ['The provided public token is invalid or expired']
      });

      await expect(linkAccount(linkData)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid Plaid token'
      });
    });
  });

  /**
   * Tests Technical Specification/1.2 Scope/Core Features
   * Validates account synchronization functionality
   */
  describe('syncAccount()', () => {
    const accountId = 'test-account-id';

    it('should successfully sync account data', async () => {
      mockAxios.onPost(`/accounts/${accountId}/sync`).reply(200, {
        data: {
          id: accountId,
          balance: 1500.0,
          lastSynced: expect.any(String)
        },
        success: true
      });

      const response = await syncAccount(accountId);

      expect(response.data.id).toBe(accountId);
      expect(response.data.balance).toBe(1500.0);
    });

    it('should handle sync timeout', async () => {
      mockAxios.onPost(`/accounts/${accountId}/sync`).timeout();

      await expect(syncAccount(accountId)).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: expect.stringContaining('timeout')
      });
    });
  });
});

describe('ApiUtils', () => {
  let mockAxios: MockAdapter;

  beforeAll(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.reset();
    localStorage.clear();
  });

  afterAll(() => {
    mockAxios.restore();
  });

  /**
   * Tests Technical Specification/9.3.1 API Security
   * Validates API request creation with security headers
   */
  describe('createApiRequest()', () => {
    it('should create API instance with security headers', () => {
      const api = createApiRequest({ includeAuth: true });
      
      expect(api.defaults.baseURL).toBe(API_CONFIG.BASE_URL);
      expect(api.defaults.timeout).toBe(API_CONFIG.TIMEOUT);
      expect(api.defaults.withCredentials).toBe(true);
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should handle request interceptor authentication', async () => {
      const api = createApiRequest({ includeAuth: true });
      localStorage.setItem('auth_token', 'test-token');

      mockAxios.onGet('/test').reply(config => {
        expect(config.headers?.Authorization).toBe('Bearer test-token');
        return [200, { data: 'success' }];
      });

      await api.get('/test');
    });
  });

  /**
   * Tests Technical Specification/9.3.1 API Security
   * Validates API error handling and standardization
   */
  describe('handleApiError()', () => {
    const mockApiError = {
      code: 'UNAUTHORIZED',
      message: 'Invalid credentials',
      details: ['Authentication failed']
    };

    it('should transform axios error to standardized format', () => {
      const axiosError = new AxiosError(
        'Request failed with status code 401',
        'UNAUTHORIZED',
        undefined,
        {},
        {
          status: 401,
          data: mockApiError
        } as any
      );

      const transformedError = handleApiError(axiosError);

      expect(transformedError.code).toBe('UNAUTHORIZED');
      expect(transformedError.message).toBe('Invalid credentials');
      expect(transformedError.details).toContain('Authentication failed');
      expect(transformedError.timestamp).toBeDefined();
      expect(transformedError.correlationId).toBeDefined();
    });

    it('should handle network errors', () => {
      const networkError = new AxiosError(
        'Network Error',
        'ECONNABORTED'
      );

      const transformedError = handleApiError(networkError);

      expect(transformedError.code).toBe('NETWORK_ERROR');
      expect(transformedError.message).toBe('Network or service error occurred');
      expect(transformedError.timestamp).toBeDefined();
    });
  });
});