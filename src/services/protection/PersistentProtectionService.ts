import { NativeModules, AppState, AppStateStatus } from 'react-native';
import { logger } from '../../utils/logger';

const { VoltUninstallProtectionModule } = NativeModules;

/**
 * Service to manage persistent protection and prevent bypass
 */
class PersistentProtectionService {
  private isInitialized = false;
  private appStateSubscription: any = null;
  private protectionCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize persistent protection monitoring
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Monitor app state changes
      this.appStateSubscription = AppState.addEventListener(
        'change',
        this.handleAppStateChange.bind(this)
      );

      // Start periodic protection checks
      this.startProtectionMonitoring();

      this.isInitialized = true;
      logger.info('PersistentProtectionService initialized');
    } catch (error) {
      logger.error('Failed to initialize PersistentProtectionService:', error);
      throw error;
    }
  }

  /**
   * Handle app state changes to maintain protection
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    logger.info(`App state changed to: ${nextAppState}`);
    
    if (nextAppState === 'background') {
      // App going to background - ensure protection remains active
      this.ensureProtectionActive();
    } else if (nextAppState === 'active') {
      // App coming to foreground - verify protection status
      this.verifyProtectionStatus();
    }
  }

  /**
   * Start periodic monitoring of protection status
   */
  private startProtectionMonitoring(): void {
    // Check protection status every 30 seconds
    this.protectionCheckInterval = setInterval(() => {
      this.verifyProtectionStatus();
    }, 30000);
  }

  /**
   * Ensure protection remains active when app goes to background
   */
  private async ensureProtectionActive(): Promise<void> {
    try {
      const status = await this.getProtectionStatus();
      if (status.isActive) {
        logger.info('Protection active - maintaining background services');
        // The native persistent service should handle this automatically
      } else {
        logger.warn('Protection not active when going to background');
      }
    } catch (error) {
      logger.error('Error ensuring protection active:', error);
    }
  }

  /**
   * Verify protection status and restart services if needed
   */
  private async verifyProtectionStatus(): Promise<void> {
    try {
      const status = await this.getProtectionStatus();
      if (status.isActive && !status.servicesRunning) {
        logger.warn('Protection active but services not running - attempting restart');
        await this.restartProtectionServices();
      }
    } catch (error) {
      logger.error('Error verifying protection status:', error);
    }
  }

  /**
   * Get current protection status
   */
  async getProtectionStatus(): Promise<{
    isActive: boolean;
    servicesRunning: boolean;
    timeRemaining?: number;
  }> {
    try {
      if (!VoltUninstallProtectionModule) {
        throw new Error('VoltUninstallProtectionModule not available');
      }

      const result = await VoltUninstallProtectionModule.getProtectionStatus();
      return {
        isActive: result.isActive || false,
        servicesRunning: result.servicesRunning || false,
        timeRemaining: result.timeRemaining,
      };
    } catch (error) {
      logger.error('Error getting protection status:', error);
      return {
        isActive: false,
        servicesRunning: false,
      };
    }
  }

  /**
   * Restart protection services
   */
  private async restartProtectionServices(): Promise<void> {
    try {
      if (!VoltUninstallProtectionModule) {
        throw new Error('VoltUninstallProtectionModule not available');
      }

      await VoltUninstallProtectionModule.restartProtectionServices();
      logger.info('Protection services restarted successfully');
    } catch (error) {
      logger.error('Error restarting protection services:', error);
    }
  }

  /**
   * Enable protection with password
   */
  async enableProtection(password: string): Promise<{
    success: boolean;
    message: string;
    errors?: string[];
  }> {
    try {
      if (!VoltUninstallProtectionModule) {
        throw new Error('VoltUninstallProtectionModule not available');
      }

      // First set the password if not already set
      try {
        await VoltUninstallProtectionModule.setupProtectionPassword(password);
      } catch (error) {
        // Password might already be set, continue
        logger.info('Password setup result:', error);
      }

      // Enable protection
      const result = await VoltUninstallProtectionModule.enableProtection();
      if (result.success) {
        logger.info('Protection enabled successfully');
      }

      return result;
    } catch (error) {
      logger.error('Error enabling protection:', error);
      return {
        success: false,
        message: `Failed to enable protection: ${error}`,
        errors: [String(error)],
      };
    }
  }

  /**
   * Disable protection with password
   */
  async disableProtection(password: string): Promise<{
    success: boolean;
    message: string;
    remainingTimeMs?: number;
    canOverride?: boolean;
  }> {
    try {
      if (!VoltUninstallProtectionModule) {
        throw new Error('VoltUninstallProtectionModule not available');
      }

      const result = await VoltUninstallProtectionModule.disableProtection(password);
      if (result.success) {
        logger.info('Protection disabled successfully');
      } else if (result.canOverride) {
        logger.warn('Protection disable blocked - override available');
      }

      return result;
    } catch (error) {
      logger.error('Error disabling protection:', error);
      return {
        success: false,
        message: `Failed to disable protection: ${error}`,
      };
    }
  }

  /**
   * Request override disable (5-hour bypass)
   */
  async requestOverrideDisable(password: string): Promise<{
    success: boolean;
    message: string;
    wasOverride?: boolean;
  }> {
    try {
      if (!VoltUninstallProtectionModule) {
        throw new Error('VoltUninstallProtectionModule not available');
      }

      const result = await VoltUninstallProtectionModule.requestOverrideDisable(password);
      if (result.success) {
        logger.warn('Protection disabled via override - this action has been logged');
      }

      return result;
    } catch (error) {
      logger.error('Error requesting override disable:', error);
      return {
        success: false,
        message: `Failed to override disable: ${error}`,
      };
    }
  }

  /**
   * Verify protection password
   */
  async verifyPassword(password: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!VoltUninstallProtectionModule) {
        throw new Error('VoltUninstallProtectionModule not available');
      }

      const result = await VoltUninstallProtectionModule.verifyProtectionPassword(password);
      return result;
    } catch (error) {
      logger.error('Error verifying password:', error);
      return {
        success: false,
        message: `Failed to verify password: ${error}`,
      };
    }
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (this.protectionCheckInterval) {
      clearInterval(this.protectionCheckInterval);
      this.protectionCheckInterval = null;
    }

    this.isInitialized = false;
    logger.info('PersistentProtectionService cleaned up');
  }
}

export const persistentProtectionService = new PersistentProtectionService();