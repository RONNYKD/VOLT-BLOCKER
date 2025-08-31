/**
 * Notification Permission Service
 * Handles requesting and checking notification permissions for Android 13+
 */
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export interface NotificationPermissionStatus {
  granted: boolean;
  canRequest: boolean;
  shouldShowRationale: boolean;
}

class NotificationPermissionService {
  private static instance: NotificationPermissionService;

  public static getInstance(): NotificationPermissionService {
    if (!NotificationPermissionService.instance) {
      NotificationPermissionService.instance = new NotificationPermissionService();
    }
    return NotificationPermissionService.instance;
  }

  /**
   * Check if notification permission is granted
   */
  async checkNotificationPermission(): Promise<NotificationPermissionStatus> {
    if (Platform.OS !== 'android') {
      return { granted: true, canRequest: false, shouldShowRationale: false };
    }

    try {
      // For Android 13+ (API 33+), we need to check POST_NOTIFICATIONS permission
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        return {
          granted: result,
          canRequest: !result,
          shouldShowRationale: false, // We'll handle rationale ourselves
        };
      } else {
        // For older Android versions, notifications are granted by default
        return { granted: true, canRequest: false, shouldShowRationale: false };
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return { granted: false, canRequest: true, shouldShowRationale: false };
    }
  }

  /**
   * Request notification permission with user-friendly explanation
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      // Check current status first
      const status = await this.checkNotificationPermission();
      if (status.granted) {
        return true;
      }

      // For Android 13+ (API 33+), request POST_NOTIFICATIONS permission
      if (Platform.Version >= 33) {
        // Show explanation dialog first
        const shouldRequest = await this.showPermissionExplanation();
        if (!shouldRequest) {
          return false;
        }

        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'VOLT Notification Permission',
            message: 'VOLT needs notification permission to show focus session progress and permanent blocking countdown.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const granted = result === PermissionsAndroid.RESULTS.GRANTED;
        
        if (granted) {
          console.log('✅ Notification permission granted');
        } else {
          console.log('❌ Notification permission denied');
          await this.showPermissionDeniedDialog();
        }

        return granted;
      } else {
        // For older Android versions, notifications are granted by default
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show explanation dialog before requesting permission
   */
  private showPermissionExplanation(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '📱 Notification Permission Needed',
        'VOLT needs notification permission to:\n\n' +
        '• Show focus session progress and countdown\n' +
        '• Display permanent blocking countdown timer\n' +
        '• Keep you informed about your digital wellness journey\n\n' +
        'These notifications help you stay on track with your goals.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Grant Permission',
            onPress: () => resolve(true),
          },
        ]
      );
    });
  }

  /**
   * Show dialog when permission is denied
   */
  private showPermissionDeniedDialog(): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        '⚠️ Notifications Disabled',
        'Without notification permission, you won\'t see:\n\n' +
        '• Focus session progress updates\n' +
        '• Permanent blocking countdown\n' +
        '• Important blocking status alerts\n\n' +
        'You can enable notifications later in your device settings.',
        [
          {
            text: 'OK',
            onPress: () => resolve(),
          },
        ]
      );
    });
  }

  /**
   * Request permission with automatic retry logic
   */
  async ensureNotificationPermission(): Promise<boolean> {
    const status = await this.checkNotificationPermission();
    
    if (status.granted) {
      return true;
    }

    if (status.canRequest) {
      return await this.requestNotificationPermission();
    }

    // Permission was denied permanently, show settings dialog
    await this.showSettingsDialog();
    return false;
  }

  /**
   * Show dialog to open app settings when permission is permanently denied
   */
  private showSettingsDialog(): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        '🔧 Enable Notifications in Settings',
        'To receive VOLT notifications, please:\n\n' +
        '1. Go to your device Settings\n' +
        '2. Find VOLT in your app list\n' +
        '3. Enable Notifications\n\n' +
        'This will allow you to see focus session progress and blocking countdowns.',
        [
          {
            text: 'OK',
            onPress: () => resolve(),
          },
        ]
      );
    });
  }

  /**
   * Check if we should show notification permission prompt
   */
  async shouldPromptForPermission(): Promise<boolean> {
    if (Platform.OS !== 'android' || Platform.Version < 33) {
      return false;
    }

    const status = await this.checkNotificationPermission();
    return !status.granted && status.canRequest;
  }

  /**
   * Get user-friendly permission status message
   */
  async getPermissionStatusMessage(): Promise<string> {
    const status = await this.checkNotificationPermission();
    
    if (status.granted) {
      return '✅ Notifications enabled - You\'ll receive focus session and blocking updates';
    } else if (status.canRequest) {
      return '⚠️ Notifications disabled - Tap to enable for better experience';
    } else {
      return '❌ Notifications blocked - Enable in device settings for full functionality';
    }
  }
}

export const notificationPermissionService = NotificationPermissionService.getInstance();
export default notificationPermissionService;