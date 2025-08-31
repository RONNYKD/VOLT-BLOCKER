/**
 * App State Manager
 * Handles app lifecycle events safely to prevent crashes
 */
import { AppState, AppStateStatus } from 'react-native';
import { logger } from './logger';

class AppStateManager {
  private currentState: AppStateStatus = AppState.currentState;
  private listeners: Array<(state: AppStateStatus) => void> = [];
  private subscription: any = null;

  /**
   * Initialize the app state manager
   */
  initialize() {
    try {
      this.subscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
      logger.info('App state manager initialized');
    } catch (error) {
      logger.error('Failed to initialize app state manager:', error);
    }
  }

  /**
   * Handle app state changes safely
   */
  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    try {
      const previousState = this.currentState;
      this.currentState = nextAppState;

      logger.info(`App state changed: ${previousState} -> ${nextAppState}`);

      // Notify all listeners safely
      for (const listener of this.listeners) {
        try {
          listener(nextAppState);
        } catch (error) {
          logger.warn('App state listener failed:', error);
        }
      }

      // Handle specific state transitions
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        await this.handleAppForeground();
      } else if (nextAppState.match(/inactive|background/)) {
        await this.handleAppBackground();
      }
    } catch (error) {
      logger.error('App state change handler failed:', error);
    }
  };

  /**
   * Handle app coming to foreground
   */
  private async handleAppForeground() {
    try {
      logger.info('Handling app foreground...');

      // Resume focus timer safely
      try {
        const { useFocusStore } = await import('../store/focus-store');
        const focusStore = useFocusStore.getState();
        if (focusStore?.resumeTimerForForeground) {
          focusStore.resumeTimerForForeground();
        }
      } catch (error) {
        logger.warn('Failed to resume focus timer:', error);
      }

      // Refresh auth session safely
      try {
        const { useAuthStore } = await import('../store/auth-store');
        const authStore = useAuthStore.getState();
        if (authStore?.isAuthenticated && authStore?.session) {
          authStore.refreshSession?.().catch((error: any) => {
            logger.warn('Failed to refresh session:', error);
          });
        }
      } catch (error) {
        logger.warn('Failed to access auth store:', error);
      }

      // Sync focus data safely
      try {
        const { focusSyncService } = await import('../services/focus-sync');
        focusSyncService.onAppForeground?.().catch((error: any) => {
          logger.warn('Failed to sync on foreground:', error);
        });
      } catch (error) {
        logger.warn('Failed to access focus sync service:', error);
      }

      logger.info('App foreground handling completed');
    } catch (error) {
      logger.error('App foreground handling failed:', error);
    }
  }

  /**
   * Handle app going to background
   */
  private async handleAppBackground() {
    try {
      logger.info('Handling app background...');

      // Pause focus timer safely
      try {
        const { useFocusStore } = await import('../store/focus-store');
        const focusStore = useFocusStore.getState();
        if (focusStore?.pauseTimerForBackground) {
          focusStore.pauseTimerForBackground();
        }
      } catch (error) {
        logger.warn('Failed to pause focus timer:', error);
      }

      logger.info('App background handling completed');
    } catch (error) {
      logger.error('App background handling failed:', error);
    }
  }

  /**
   * Add a listener for app state changes
   */
  addListener(listener: (state: AppStateStatus) => void) {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: (state: AppStateStatus) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get current app state
   */
  getCurrentState(): AppStateStatus {
    return this.currentState;
  }

  /**
   * Cleanup
   */
  cleanup() {
    try {
      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
      }
      this.listeners = [];
      logger.info('App state manager cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup app state manager:', error);
    }
  }
}

export const appStateManager = new AppStateManager();