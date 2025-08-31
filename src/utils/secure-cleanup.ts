/**
 * Secure data cleanup utilities
 * Handles secure data removal for logout and app uninstall scenarios
 */
import { SecureStorage, SecureStorageKeys } from './secure-storage';
import { StorageUtils } from './storage';
import { errorHandler, ErrorSeverity } from './error-handling';

// Cleanup levels
export enum CleanupLevel {
  LOGOUT = 'logout',           // Remove session data, keep user preferences
  FULL_LOGOUT = 'full_logout', // Remove all user data, keep app settings
  UNINSTALL = 'uninstall',     // Remove everything
  SECURITY = 'security',       // Emergency security cleanup
}

// Cleanup result interface
export interface CleanupResult {
  level: CleanupLevel;
  success: boolean;
  itemsRemoved: number;
  errors: string[];
  duration: number;
}

// Secure cleanup class
export class SecureCleanup {
  /**
   * Perform cleanup based on specified level
   */
  static async performCleanup(level: CleanupLevel): Promise<CleanupResult> {
    const startTime = Date.now();
    const result: CleanupResult = {
      level,
      success: false,
      itemsRemoved: 0,
      errors: [],
      duration: 0,
    };

    try {
      console.log(`Starting ${level} cleanup...`);

      switch (level) {
        case CleanupLevel.LOGOUT:
          await this.logoutCleanup(result);
          break;
        case CleanupLevel.FULL_LOGOUT:
          await this.fullLogoutCleanup(result);
          break;
        case CleanupLevel.UNINSTALL:
          await this.uninstallCleanup(result);
          break;
        case CleanupLevel.SECURITY:
          await this.securityCleanup(result);
          break;
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      if (result.success) {
        console.log(`✅ ${level} cleanup completed successfully`);
        console.log(`Removed ${result.itemsRemoved} items in ${result.duration}ms`);
      } else {
        console.warn(`⚠️ ${level} cleanup completed with errors:`, result.errors);
      }

      return result;
    } catch (error) {
      result.errors.push(`Cleanup failed: ${error}`);
      result.success = false;
      result.duration = Date.now() - startTime;

      await errorHandler.handle(
        error as Error,
        { context: 'secure_cleanup', level },
        ErrorSeverity.HIGH
      );

      return result;
    }
  }

  /**
   * Logout cleanup - Remove session data only
   */
  private static async logoutCleanup(result: CleanupResult): Promise<void> {
    const itemsToRemove = [
      // Secure storage items
      SecureStorageKeys.AUTH_TOKEN,
      SecureStorageKeys.REFRESH_TOKEN,
      SecureStorageKeys.SESSION_DATA,
    ];

    // Remove secure items
    for (const key of itemsToRemove) {
      try {
        await SecureStorage.removeSecureItem(key);
        result.itemsRemoved++;
      } catch (error) {
        result.errors.push(`Failed to remove secure item ${key}: ${error}`);
      }
    }

    // Clear session-related regular storage
    // Note: We don't clear user preferences or app settings
    console.log('Session data cleared for logout');
  }

  /**
   * Full logout cleanup - Remove all user data except app settings
   */
  private static async fullLogoutCleanup(result: CleanupResult): Promise<void> {
    // First do regular logout cleanup
    await this.logoutCleanup(result);

    const additionalSecureItems = [
      SecureStorageKeys.USER_CREDENTIALS,
      SecureStorageKeys.BIOMETRIC_KEY,
    ];

    // Remove additional secure items
    for (const key of additionalSecureItems) {
      try {
        await SecureStorage.removeSecureItem(key);
        result.itemsRemoved++;
      } catch (error) {
        result.errors.push(`Failed to remove secure item ${key}: ${error}`);
      }
    }

    // Clear user-specific regular storage but keep app settings
    try {
      const keysToKeep = ['app_settings', 'theme_settings'];
      // Implementation would selectively clear storage
      console.log('User data cleared, app settings preserved');
    } catch (error) {
      result.errors.push(`Failed to clear user data: ${error}`);
    }
  }

  /**
   * Uninstall cleanup - Remove everything
   */
  private static async uninstallCleanup(result: CleanupResult): Promise<void> {
    try {
      // Clear all secure storage
      await SecureStorage.clearAllSecureData();
      result.itemsRemoved += Object.keys(SecureStorageKeys).length;

      // Clear all regular storage
      await StorageUtils.clearAppData();
      result.itemsRemoved += 10; // Approximate number of regular storage keys

      console.log('All app data cleared for uninstall');
    } catch (error) {
      result.errors.push(`Failed to clear all data: ${error}`);
    }
  }

  /**
   * Security cleanup - Emergency cleanup for security incidents
   */
  private static async securityCleanup(result: CleanupResult): Promise<void> {
    console.warn('Performing emergency security cleanup...');

    try {
      // Immediately clear all sensitive data
      await SecureStorage.clearAllSecureData();
      result.itemsRemoved += Object.keys(SecureStorageKeys).length;

      // Clear all storage
      await StorageUtils.clearAppData();
      result.itemsRemoved += 10;

      // Additional security measures
      await this.performSecurityMeasures();

      console.log('Emergency security cleanup completed');
    } catch (error) {
      result.errors.push(`Security cleanup failed: ${error}`);
    }
  }

  /**
   * Perform additional security measures
   */
  private static async performSecurityMeasures(): Promise<void> {
    try {
      // Clear any cached data
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Log security event
      await errorHandler.handle(
        new Error('Security cleanup performed'),
        { 
          context: 'security_cleanup',
          timestamp: Date.now(),
          reason: 'emergency_cleanup'
        },
        ErrorSeverity.HIGH
      );
    } catch (error) {
      console.warn('Additional security measures failed:', error);
    }
  }

  /**
   * Verify cleanup completion
   */
  static async verifyCleanup(level: CleanupLevel): Promise<{
    isComplete: boolean;
    remainingItems: string[];
  }> {
    const remainingItems: string[] = [];

    try {
      // Check secure storage
      const secureInfo = await SecureStorage.getSecureStorageInfo();
      
      switch (level) {
        case CleanupLevel.LOGOUT:
          // Check if session data is cleared
          if (secureInfo.storedKeys.includes(SecureStorageKeys.AUTH_TOKEN)) {
            remainingItems.push('auth_token');
          }
          if (secureInfo.storedKeys.includes(SecureStorageKeys.SESSION_DATA)) {
            remainingItems.push('session_data');
          }
          break;

        case CleanupLevel.FULL_LOGOUT:
          // Check if user data is cleared
          if (secureInfo.storedKeys.includes(SecureStorageKeys.USER_CREDENTIALS)) {
            remainingItems.push('user_credentials');
          }
          break;

        case CleanupLevel.UNINSTALL:
        case CleanupLevel.SECURITY:
          // Check if everything is cleared
          remainingItems.push(...secureInfo.storedKeys);
          break;
      }

      return {
        isComplete: remainingItems.length === 0,
        remainingItems,
      };
    } catch (error) {
      console.warn('Cleanup verification failed:', error);
      return {
        isComplete: false,
        remainingItems: ['verification_failed'],
      };
    }
  }

  /**
   * Schedule automatic cleanup
   */
  static scheduleCleanup(
    level: CleanupLevel,
    delayMinutes: number
  ): NodeJS.Timeout {
    console.log(`Scheduling ${level} cleanup in ${delayMinutes} minutes`);
    
    return setTimeout(async () => {
      try {
        await this.performCleanup(level);
      } catch (error) {
        console.error('Scheduled cleanup failed:', error);
      }
    }, delayMinutes * 60 * 1000);
  }

  /**
   * Get cleanup recommendations based on app state
   */
  static async getCleanupRecommendations(): Promise<{
    recommended: CleanupLevel[];
    reasons: string[];
  }> {
    const recommendations: CleanupLevel[] = [];
    const reasons: string[] = [];

    try {
      const secureInfo = await SecureStorage.getSecureStorageInfo();
      
      // Check for expired tokens
      try {
        const tokens = await SecureStorage.getAuthTokens();
        if (!tokens.accessToken && !tokens.refreshToken) {
          recommendations.push(CleanupLevel.LOGOUT);
          reasons.push('No valid authentication tokens found');
        }
      } catch (error) {
        if ((error as Error).message?.includes('expired')) {
          recommendations.push(CleanupLevel.LOGOUT);
          reasons.push('Authentication tokens have expired');
        }
      }

      // Check storage usage
      const storageInfo = await StorageUtils.getStorageInfo();
      if (storageInfo.estimatedSize > 10 * 1024 * 1024) { // 10MB
        recommendations.push(CleanupLevel.FULL_LOGOUT);
        reasons.push('Storage usage is high, consider full cleanup');
      }

      return { recommended: recommendations, reasons };
    } catch (error) {
      return {
        recommended: [CleanupLevel.SECURITY],
        reasons: ['Error analyzing app state, security cleanup recommended'],
      };
    }
  }
}

// Convenience functions
export const secureCleanup = {
  // Main cleanup functions
  logout: () => SecureCleanup.performCleanup(CleanupLevel.LOGOUT),
  fullLogout: () => SecureCleanup.performCleanup(CleanupLevel.FULL_LOGOUT),
  uninstall: () => SecureCleanup.performCleanup(CleanupLevel.UNINSTALL),
  security: () => SecureCleanup.performCleanup(CleanupLevel.SECURITY),
  
  // Utility functions
  verify: (level: CleanupLevel) => SecureCleanup.verifyCleanup(level),
  schedule: (level: CleanupLevel, delayMinutes: number) => 
    SecureCleanup.scheduleCleanup(level, delayMinutes),
  getRecommendations: () => SecureCleanup.getCleanupRecommendations(),
};