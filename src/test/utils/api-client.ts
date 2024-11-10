// Third-party imports with versions
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'; // ^1.3.0

// Internal imports
import { TestLogger } from './test-logger';
import { generateTestToken } from './auth-helper';

/**
 * Human Tasks Required:
 * 1. Configure TEST_API_BASE_URL in environment if different from default 'http://localhost:3000'
 * 2. Ensure proper network access to API endpoints
 * 3. Configure test timeouts if default 30000ms is not suitable
 * 4. Set up test authentication credentials
 * 5. Configure rate limiting parameters if needed
 */

// Global configuration
const API_BASE_URL = process.env.TEST_API_BASE_URL || 'http://localhost:3000';
const DEFAULT_TIMEOUT = 30000;

/**
 * Main API client class for testing with built-in authentication, logging, and error handling
 * 
 * Requirements addressed:
 * - API Testing (Technical Specification/9.3.1 API Security)
 * - Testing Standards (Technical Specification/A.4 Development Standards Reference/Testing Standards)
 * - Security Monitoring (Technical Specification/9.3.2 Security Monitoring)
 */
export class TestApiClient {
    private axiosInstance: AxiosInstance;
    private logger: TestLogger;
    private baseURL: string;
    private authToken: string | null;

    constructor(config: AxiosRequestConfig = {}) {
        this.baseURL = config.baseURL || API_BASE_URL;
        this.logger = new TestLogger();
        this.authToken = null;

        // Initialize axios instance with configuration
        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            timeout: config.timeout || DEFAULT_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                ...config.headers
            },
            validateStatus: (status) => status < 500 // Allow 4xx responses for testing
        });

        // Configure request interceptor for auth and logging
        this.axiosInstance.interceptors.request.use(
            (config) => {
                // Add auth token if available
                if (this.authToken) {
                    config.headers.Authorization = `Bearer ${this.authToken}`;
                }

                // Log request details
                this.logger.logAssertion('API Request', {
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    headers: config.headers,
                    data: config.data
                });

                return config;
            },
            (error) => {
                this.logger.logError(error, 'Request Interceptor Error');
                return Promise.reject(error);
            }
        );

        // Configure response interceptor for logging and error handling
        this.axiosInstance.interceptors.response.use(
            (response) => {
                // Log successful response
                this.logger.logAssertion('API Response', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    data: response.data
                });

                return response;
            },
            (error) => {
                return this.handleError(error);
            }
        );
    }

    /**
     * Sets the JWT authentication token for subsequent requests
     * @param token JWT token string
     */
    public setAuthToken(token: string): void {
        this.authToken = token;
        this.logger.logAssertion('Auth Token Updated', { tokenSet: !!token });
    }

    /**
     * Makes a GET request to the API
     * @param url Request URL
     * @param config Optional axios config
     * @returns Promise with response data
     */
    public async get<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
        try {
            const response = await this.axiosInstance.get<T>(url, config);
            return response.data;
        } catch (error) {
            throw await this.handleError(error);
        }
    }

    /**
     * Makes a POST request to the API
     * @param url Request URL
     * @param data Request payload
     * @param config Optional axios config
     * @returns Promise with response data
     */
    public async post<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
        try {
            const response = await this.axiosInstance.post<T>(url, data, config);
            return response.data;
        } catch (error) {
            throw await this.handleError(error);
        }
    }

    /**
     * Makes a PUT request to the API
     * @param url Request URL
     * @param data Request payload
     * @param config Optional axios config
     * @returns Promise with response data
     */
    public async put<T = any>(url: string, data?: any, config: AxiosRequestConfig = {}): Promise<T> {
        try {
            const response = await this.axiosInstance.put<T>(url, data, config);
            return response.data;
        } catch (error) {
            throw await this.handleError(error);
        }
    }

    /**
     * Makes a DELETE request to the API
     * @param url Request URL
     * @param config Optional axios config
     * @returns Promise with response data
     */
    public async delete<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
        try {
            const response = await this.axiosInstance.delete<T>(url, config);
            return response.data;
        } catch (error) {
            throw await this.handleError(error);
        }
    }

    /**
     * Handles and logs API request errors
     * @param error Error object
     * @returns Formatted error object
     */
    private async handleError(error: Error | AxiosError): Promise<never> {
        if (axios.isAxiosError(error)) {
            const errorResponse = error.response;
            const errorDetails = {
                status: errorResponse?.status,
                statusText: errorResponse?.statusText,
                data: errorResponse?.data,
                headers: errorResponse?.headers,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers,
                    data: error.config?.data
                }
            };

            this.logger.logError(error, 'API Request Failed');
            throw new Error(JSON.stringify(errorDetails));
        }

        this.logger.logError(error, 'Non-HTTP Error');
        throw error;
    }
}

/**
 * Factory function to create a new TestApiClient instance
 * @param config Optional axios configuration
 * @returns Configured TestApiClient instance
 */
export function createApiClient(config: AxiosRequestConfig = {}): TestApiClient {
    return new TestApiClient(config);
}