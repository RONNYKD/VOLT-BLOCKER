/**
 * Notification Service
 * Manages all app notifications including focus sessions and permanent blocking countdown
 */
import { AppState, AppStateStatus } from 'react-native';
import { appBlockingService } from '../native';

export interface FocusSessionNotificationData {
  sessionId: string;
  duration: number; // in minutes
  startTime: number; // timestamp
  blockedAppsCount: number;
  blockedWebsitesCount: number;
}

export interface CountdownNotificationData {
  requestTime: number; // timestamp when disable was requested
  endTime: number; // timestamp when blocking can be disabled
  remainingMinutes: number;
}

class NotificationService {
  private focusSessionTimer: NodeJS.Timeout | null = null;
  private countdownTimer: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;
  private currentFocusSession: FocusSessionNotificationData | null = null;
  private currentCountdown: CountdownNotificationData | null = null;

  constructor() {
    this.setupAppStateListener();
  }

  // ============ FOCUS SESSION NOTIFICATIONS ============

  /**
   * Start focus session notification with live updates
   */
  async startFocusSessionNotification(
    sessionId: string,
    duration: number,
    blockedAppsCount: number = 0,
    blockedWebsitesCount: number = 0
  ): Promise<void> {
    try {
      const sessionData: FocusSessionNotificationData = {
        sessionId,
        duration,
        startTime: Date.now(),
        blockedAppsCount,
        blockedWebsitesCount,
      };

      this.currentFocusSession = sessionData;

      // Show initial notification
      await this.updateFocusSessionNotification();

      // Start timer to update notification every 30 seconds
      this.focusSessionTimer = setInterval(() => {
        this.updateFocusSessionNotification();
      }, 30000); // Update every 30 seconds for better responsiveness

      console.log('Focus session notification started for session:', sessionId);
    } catch (error) {
      console.error('Failed to start focus session notification:', error);
    }
  }

  /**
   * Update focus session notification with current progress
   */
  private async updateFocusSessionNotification(): Promise<void> {
    if (!this.currentFocusSession) return;

    try {
      // Get the current timer state from focus store for accurate time
      const { useFocusStore } = await import('../../store/focus-store');
      const focusStore = useFocusStore.getState();
      
      if (!focusStore.currentSession || !focusStore.timer.isRunning) {
        await this.stopFocusSessionNotification();
        return;
      }

      const remainingSeconds = focusStore.timer.remainingTime;
      const remainingMinutes = Math.ceil(remainingSeconds / 60);

      // If session is complete, stop the notification
      if (remainingSeconds <= 0) {
        await this.stopFocusSessionNotification();
        return;
      }

      // Update native notification with accurate remaining time
      // Use the uninstall protection module for notifications since it has the methods
      const { NativeModules } = await import('react-native');
      const { VoltUninstallProtection } = NativeModules;
      
      if (VoltUninstallProtection) {
        await VoltUninstallProtection.showFocusSessionNotification(
          this.currentFocusSession.duration,
          remainingSeconds
        );
      }

      console.log(`Focus session notification updated: ${remainingMinutes} minutes (${remainingSeconds}s) remaining`);
    } catch (error) {
      console.error('Failed to update focus session notification:', error);
    }
  }

  /**
   * Stop focus session notification
   */
  async stopFocusSessionNotification(): Promise<void> {
    try {
      if (this.focusSessionTimer) {
        clearInterval(this.focusSessionTimer);
        this.focusSessionTimer = null;
      }

      this.currentFocusSession = null;

      // Hide native notification
      // Use the uninstall protection module for notifications since it has the methods
      const { NativeModules } = await import('react-native');
      const { VoltUninstallProtection } = NativeModules;
      
      if (VoltUninstallProtection) {
        await VoltUninstallProtection.hideFocusSessionNotification();
      }

      console.log('Focus session notification stopped');
    } catch (error) {
      console.error('Failed to stop focus session notification:', error);
    }
  }

  /**
   * Check if focus session notification is active
   */
  isFocusSessionNotificationActive(): boolean {
    return this.currentFocusSession !== null;
  }

  // ============ COUNTDOWN NOTIFICATIONS ============

  /**
   * Start countdown notification for permanent blocking disable delay
   */
  async startCountdownNotification(endTimeMs: number): Promise<void> {
    try {
      const countdownData: CountdownNotificationData = {
        requestTime: Date.now(),
        endTime: endTimeMs,
        remainingMinutes: Math.ceil((endTimeMs - Date.now()) / 1000 / 60),
      };

      this.currentCountdown = countdownData;

      // Start native countdown service
      await appBlockingService.startCountdownService(endTimeMs);

      // Start local timer for updates (backup to native service)
      this.countdownTimer = setInterval(() => {
        this.updateCountdownData();
      }, 60000); // Update every minute

      console.log('Countdown notification started until:', new Date(endTimeMs));
    } catch (error) {
      console.error('Failed to start countdown notification:', error);
    }
  }

  /**
   * Update countdown data (for local tracking)
   */
  private updateCountdownData(): void {
    if (!this.currentCountdown) return;

    const now = Date.now();
    const remainingMs = Math.max(0, this.currentCountdown.endTime - now);
    const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);

    this.currentCountdown.remainingMinutes = remainingMinutes;

    // If countdown is complete, stop it
    if (remainingMinutes <= 0) {
      this.stopCountdownNotification();
    }

    console.log(`Countdown updated: ${remainingMinutes} minutes remaining`);
  }

  /**
   * Stop countdown notification
   */
  async stopCountdownNotification(): Promise<void> {
    try {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }

      this.currentCountdown = null;

      // Stop native countdown service
      await appBlockingService.stopCountdownService();

      console.log('Countdown notification stopped');
    } catch (error) {
      console.error('Failed to stop countdown notification:', error);
    }
  }

  /**
   * Check if countdown notification is active
   */
  isCountdownNotificationActive(): boolean {
    return this.currentCountdown !== null;
  }

  /**
   * Get current countdown data
   */
  getCurrentCountdownData(): CountdownNotificationData | null {
    return this.currentCountdown;
  }

  // ============ APP STATE MANAGEMENT ============

  /**
   * Setup app state listener to handle background/foreground transitions
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    console.log('App state changed to:', nextAppState);

    if (nextAppState === 'background') {
      // App is going to background - ensure notifications are active
      this.ensureNotificationsActive();
    } else if (nextAppState === 'active') {
      // App is coming to foreground - sync with native services
      this.syncWithNativeServices();
    }
  }

  /**
   * Ensure notifications are active when app goes to background
   */
  private async ensureNotificationsActive(): Promise<void> {
    try {
      // Ensure focus session notification is active
      if (this.currentFocusSession) {
        await this.updateFocusSessionNotification();
      }

      // Ensure countdown service is running
      if (this.currentCountdown) {
        const isRunning = await appBlockingService.isCountdownServiceRunning();
        if (!isRunning) {
          await appBlockingService.startCountdownService(this.currentCountdown.endTime);
        }
      }
    } catch (error) {
      console.error('Failed to ensure notifications active:', error);
    }
  }

  /**
   * Sync with native services when app comes to foreground
   */
  private async syncWithNativeServices(): Promise<void> {
    try {
      // Check if countdown service is still running
      if (this.currentCountdown) {
        const isRunning = await appBlockingService.isCountdownServiceRunning();
        if (!isRunning) {
          // Countdown may have completed while app was in background
          this.currentCountdown = null;
          if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync with native services:', error);
    }
  }

  // ============ CLEANUP ============

  /**
   * Cleanup all timers and listeners
   */
  cleanup(): void {
    if (this.focusSessionTimer) {
      clearInterval(this.focusSessionTimer);
      this.focusSessionTimer = null;
    }

    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.currentFocusSession = null;
    this.currentCountdown = null;

    console.log('Notification service cleaned up');
  }

  // ============ UTILITY METHODS ============

  /**
   * Format remaining time for display
   */
  formatRemainingTime(minutes: number): string {
    if (minutes <= 0) return '00:00';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  }

  /**
   * Get notification status summary
   */
  getNotificationStatus(): {
    focusSession: boolean;
    countdown: boolean;
    focusSessionData: FocusSessionNotificationData | null;
    countdownData: CountdownNotificationData | null;
  } {
    return {
      focusSession: this.isFocusSessionNotificationActive(),
      countdown: this.isCountdownNotificationActive(),
      focusSessionData: this.currentFocusSession,
      countdownData: this.currentCountdown,
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;