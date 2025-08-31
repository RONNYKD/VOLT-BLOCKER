/**
 * Core type definitions for VOLT app
 */

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  strictMode: boolean;
}

export interface BlockedApp {
  packageName: string;
  appName: string;
  isBlocked: boolean;
}

export interface BlockedWebsite {
  url: string;
  domain: string;
  isBlocked: boolean;
}

export interface FocusSession {
  id: string;
  duration: number; // in minutes
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'cancelled';
}