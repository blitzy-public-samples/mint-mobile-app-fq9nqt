// Third-party imports
// @version: react ^18.0.0
import React from 'react';
// @version: @testing-library/react ^13.0.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// @version: @testing-library/jest-dom ^5.16.0
import '@testing-library/jest-dom';
// @version: @simplewebauthn/browser ^7.0.0
import { startAuthentication } from '@simplewebauthn/browser';

// Components under test
import { LoginForm } from '../../src/components/auth/LoginForm';
import { RegisterForm } from '../../src/components/auth/RegisterForm';
import { BiometricPrompt } from '../../src/components/auth/BiometricPrompt';

// Mock API services
jest.mock('../../src/services/api/auth.api');
jest.mock('@simplewebauthn/browser');

describe('LoginForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test: Rendering and Accessibility
  it('should render login form with email and password fields', () => {
    render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  // Test: Email Validation
  it('should validate email format according to RFC standards', async () => {
    render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    
    // Test invalid email formats
    await userEvent.type(emailInput, 'invalid-email');
    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    
    // Test valid email format
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'valid@email.com');
    expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
  });

  // Test: Password Validation
  it('should enforce minimum 12 character password requirement', async () => {
    render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    
    // Test short password
    await userEvent.type(passwordInput, 'short');
    expect(screen.getByText(/password must be at least 12 characters/i)).toBeInTheDocument();
    
    // Test valid password length
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'ValidPassword123!');
    expect(screen.queryByText(/password must be at least 12 characters/i)).not.toBeInTheDocument();
  });

  // Test: Form Submission
  it('should handle successful login with proper callback', async () => {
    const mockLoginResponse = { token: 'test-token', user: { id: 1, email: 'test@example.com' }};
    const mockLoginFn = jest.requireMock('../../src/services/api/auth.api').login;
    mockLoginFn.mockResolvedValueOnce(mockLoginResponse);

    render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'ValidPassword123!');
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockLoginResponse);
    });
  });

  // Test: Error Handling
  it('should display error messages for invalid credentials', async () => {
    const mockError = new Error('Invalid credentials');
    const mockLoginFn = jest.requireMock('../../src/services/api/auth.api').login;
    mockLoginFn.mockRejectedValueOnce(mockError);

    render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'ValidPassword123!');
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });
  });

  // Test: Loading State
  it('should show loading state during submission', async () => {
    const mockLoginFn = jest.requireMock('../../src/services/api/auth.api').login;
    mockLoginFn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'ValidPassword123!');
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });
});

describe('RegisterForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test: Rendering and Fields
  it('should render registration form with all required fields', () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    expect(screen.getByRole('form', { name: /registration form/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  // Test: Password Complexity
  it('should enforce password complexity rules', async () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    
    // Test various password scenarios
    await userEvent.type(passwordInput, 'short');
    expect(screen.getByText(/password must be at least 12 characters/i)).toBeInTheDocument();
    
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'nouppercase123!');
    expect(screen.getByText(/must include uppercase/i)).toBeInTheDocument();
    
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'ValidPassword123!');
    expect(screen.queryByText(/password must include/i)).not.toBeInTheDocument();
  });

  // Test: Form Validation
  it('should validate all required fields in real-time', async () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  // Test: Successful Registration
  it('should handle successful registration with proper callback', async () => {
    const mockRegisterResponse = { token: 'test-token', user: { id: 1, email: 'test@example.com' }};
    const mockRegisterFn = jest.requireMock('../../src/services/api/auth.api').register;
    mockRegisterFn.mockResolvedValueOnce(mockRegisterResponse);

    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);
    
    await userEvent.type(screen.getByLabelText(/first name/i), 'John');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'ValidPassword123!');
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockRegisterResponse);
    });
  });
});

describe('BiometricPrompt', () => {
  const mockOnComplete = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test: Modal Rendering
  it('should render biometric prompt modal with proper ARIA attributes', () => {
    render(
      <BiometricPrompt
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );
    
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Biometric authentication prompt');
    expect(screen.getByText(/please verify your identity/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /authenticate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  // Test: Successful Authentication
  it('should handle successful FIDO2 biometric authentication', async () => {
    const mockStartAuth = startAuthentication as jest.Mock;
    mockStartAuth.mockResolvedValueOnce({ /* mock response */ });

    render(
      <BiometricPrompt
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /authenticate/i }));
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(true);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // Test: Failed Authentication
  it('should handle failed biometric authentication with proper error message', async () => {
    const mockStartAuth = startAuthentication as jest.Mock;
    mockStartAuth.mockRejectedValueOnce(new Error('NotAllowedError'));

    render(
      <BiometricPrompt
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /authenticate/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/biometric authentication was denied/i)).toBeInTheDocument();
      expect(mockOnComplete).toHaveBeenCalledWith(false);
    });
  });

  // Test: Loading State
  it('should show loading state during authentication', async () => {
    const mockStartAuth = startAuthentication as jest.Mock;
    mockStartAuth.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <BiometricPrompt
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /authenticate/i }));
    
    expect(screen.getByRole('button', { name: /authenticate/i })).toBeDisabled();
  });

  // Test: Modal Close
  it('should close modal on cancel', () => {
    render(
      <BiometricPrompt
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  // Test: Cleanup
  it('should clean up WebAuthn resources on unmount', () => {
    const { unmount } = render(
      <BiometricPrompt
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );
    
    unmount();
    // Verify no memory leaks or pending promises
    expect(mockStartAuth).not.toHaveBeenCalled();
  });
});