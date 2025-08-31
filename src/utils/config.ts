/**
 * Configuration settings for VOLT app
 */

interface AppConfig {
  // App version information
  version: string;
  buildNumber: number;
  
  // API and services configuration
  apiTimeout: number;
  
  // Feature flags
  features: {
    strictMode: boolean;
    debugLogging: boolean;
    crashReporting: boolean;
  };
  
  // Development settings
  development: {
    mockServices: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  version: '0.1.0',
  buildNumber: 1,
  
  apiTimeout: 30000, // 30 seconds
  
  features: {
    strictMode: true,
    debugLogging: __DEV__,
    crashReporting: !__DEV__,
  },
  
  development: {
    mockServices: __DEV__,
    logLevel: __DEV__ ? 'debug' : 'info',
  },
};

// Export the configuration
export const AppConfig: AppConfig = {
  ...defaultConfig,
};

// Helper function to determine if we're running in development mode
export const isDevelopment = (): boolean => {
  return __DEV__;
};

// Helper function to determine if we're running in production mode
export const isProduction = (): boolean => {
  return !__DEV__;
};