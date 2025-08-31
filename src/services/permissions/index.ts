/**
 * Permissions service index
 * Exports all permission-related services
 */

export { notificationPermissionService } from './NotificationPermissionService';
export type { NotificationPermissionStatus } from './NotificationPermissionService';

// Convenience function to request all necessary permissions for notifications
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { notificationPermissionService } = await import('./NotificationPermissionService');
  return await notificationPermissionService.ensureNotificationPermission();
};

// Check if we should prompt for notification permissions
export const shouldPromptForNotifications = async (): Promise<boolean> => {
  const { notificationPermissionService } = await import('./NotificationPermissionService');
  return await notificationPermissionService.shouldPromptForPermission();
};

// Get notification permission status message
export const getNotificationStatusMessage = async (): Promise<string> => {
  const { notificationPermissionService } = await import('./NotificationPermissionService');
  return await notificationPermissionService.getPermissionStatusMessage();
};