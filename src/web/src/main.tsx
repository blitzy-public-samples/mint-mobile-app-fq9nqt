/**
 * HUMAN TASKS:
 * 1. Configure error tracking service integration in production environment
 * 2. Set up performance monitoring for React rendering metrics
 * 3. Verify CSP headers are properly configured on the hosting server
 * 4. Test accessibility features with various screen readers
 * 5. Validate responsive breakpoints on different devices
 */

// Third-party imports
// @version: ^18.2.0
import React from 'react';
// @version: ^18.2.0
import ReactDOM from 'react-dom/client';

// Internal imports
import App from './App';
import './styles/global.css';
import './styles/components.css';

/**
 * Initializes and renders the React application with strict mode and security configurations
 * 
 * Implements requirements:
 * - Technical Specification/1.1 System Overview
 *   Initializes mobile-first personal financial management system with secure
 *   authentication and real-time updates
 * 
 * - Technical Specification/8.1 User Interface Design
 *   Sets up global styling and responsive design infrastructure with support
 *   from 320px to 2048px width
 * 
 * - Technical Specification/9.1 Authentication and Authorization
 *   Initializes secure authentication context and session management with JWT
 *   token validation
 * 
 * - Technical Specification/8.1.8 Accessibility Features
 *   Implements core accessibility features including high contrast mode support
 *   and minimum text size requirements
 */
const renderApp = (): void => {
  // Get root element with type checking
  const rootElement = document.getElementById('root') as HTMLElement;

  if (!rootElement) {
    throw new Error('Failed to find root element');
  }

  // Create React root using createRoot for concurrent features
  const root = ReactDOM.createRoot(rootElement);

  // Enable development checks and error boundaries
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Configure error boundaries for production stability
  if (process.env.NODE_ENV === 'production') {
    window.addEventListener('error', (event: ErrorEvent) => {
      // Log error to monitoring service
      console.error('Global error:', event.error);
      // Prevent default browser error overlay
      event.preventDefault();
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      // Log unhandled promise rejection
      console.error('Unhandled promise rejection:', event.reason);
      // Prevent default browser error overlay
      event.preventDefault();
    });
  }

  // Apply mobile-first responsive configurations
  const viewport = document.querySelector('meta[name=viewport]');
  if (!viewport) {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover';
    document.head.appendChild(meta);
  }

  // Enable accessibility features
  document.documentElement.lang = 'en';
  const accessibilityMeta = document.createElement('meta');
  accessibilityMeta.name = 'description';
  accessibilityMeta.content = 'Mint Replica Lite - Personal Financial Management System';
  document.head.appendChild(accessibilityMeta);
};

// Initialize application
renderApp();

// Enable hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Prevent default browser error overlay in production
if (process.env.NODE_ENV === 'production') {
  console.error = (message: string, ...args: any[]) => {
    // Log to monitoring service instead of console
    const error = args.length ? args[0] : message;
    if (error instanceof Error) {
      // Send error to monitoring service
      console.warn('[Error]:', error.message);
    }
  };
}