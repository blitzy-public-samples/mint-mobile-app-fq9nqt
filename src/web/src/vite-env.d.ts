/// <reference types="vite/client" />

// Human Tasks:
// 1. Ensure Vite version ^4.3.0 is installed in package.json
// 2. Configure environment variables in .env file with proper VITE_ prefix
// 3. Add Firebase configuration JSON in environment variables
// 4. Set up Sentry DSN in environment variables
// 5. Configure Plaid environment and client name in environment variables

// Requirements addressed:
// - Frontend Technologies (Technical Specification/5.3.1 Frontend Technologies)
//   Providing TypeScript declarations for Vite build environment and module types
// - Development Standards (Technical Specification/A.4 Development Standards Reference)
//   Ensuring proper TypeScript type declarations for development environment

// Environment variables interface declaration
interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL: string;

  // Plaid Configuration
  readonly VITE_PLAID_ENV: string;
  readonly VITE_PLAID_CLIENT_NAME: string;

  // Firebase Configuration
  readonly VITE_FIREBASE_CONFIG: string;

  // Sentry Configuration
  readonly VITE_SENTRY_DSN: string;

  // Vite Default Environment Variables
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

// ImportMeta interface augmentation
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Module declarations for various file types
declare module '*.svg' {
  import React from 'react';
  const content: React.FunctionComponent<React.SVGProps<SVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}