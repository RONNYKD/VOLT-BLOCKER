/**
 * Services index file
 * Exports all service modules
 */

// Supabase service
export * from './supabase';
export { supabase } from './supabase';

// App initialization service
export * from './app-initialization';
export { 
  initializeApp, 
  isAppReady, 
  getAppStatus, 
  handleAppStateChange, 
  emergencyRecovery 
} from './app-initialization';

// Notification service
export { notificationService } from './notifications/NotificationService';

// Protection services
export * from './protection';
export { uninstallProtectionService } from './protection/UninstallProtectionService';
export { useUninstallProtectionStore } from './protection/store';