/**
 * Application constants
 */

// App information
export const APP_NAME = 'VOLT';
export const APP_VERSION = '0.1.0';
export const APP_BUILD = 1;

// API endpoints
export const API = {
  BASE_URL: 'https://api.example.com',
  TIMEOUT: 30000, // 30 seconds
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
    },
    USER: {
      PROFILE: '/user/profile',
      SETTINGS: '/user/settings',
    },
    BLOCKING: {
      APPS: '/blocking/apps',
      WEBSITES: '/blocking/websites',
      SESSIONS: '/blocking/sessions',
    },
  },
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'volt_auth_token',
  USER_PROFILE: 'volt_user_profile',
  APP_SETTINGS: 'volt_app_settings',
  BLOCKED_APPS: 'volt_blocked_apps',
  BLOCKED_WEBSITES: 'volt_blocked_websites',
  FOCUS_SESSIONS: 'volt_focus_sessions',
};

// Navigation routes
export const ROUTES = {
  AUTH: {
    LOGIN: 'Login',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword',
  },
  MAIN: {
    FOCUS: 'Focus',
    BLOCKS: 'Blocks',
    PROFILE: 'Profile',
  },
};

// Default values
export const DEFAULTS = {
  FOCUS_SESSION_DURATION: 25 * 60 * 1000, // 25 minutes in milliseconds
  SHORT_BREAK_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
  LONG_BREAK_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  SESSIONS_BEFORE_LONG_BREAK: 4,
};

// Error messages
export const ERRORS = {
  NETWORK: 'Network error. Please check your connection and try again.',
  SERVER: 'Server error. Please try again later.',
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    EMAIL_IN_USE: 'This email is already in use.',
    WEAK_PASSWORD: 'Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.',
    INVALID_EMAIL: 'Please enter a valid email address.',
  },
  PERMISSIONS: {
    DEVICE_ADMIN: 'Device admin permission is required for app blocking.',
    USAGE_STATS: 'Usage stats permission is required for app monitoring.',
    ACCESSIBILITY: 'Accessibility service permission is required for app blocking.',
  },
};