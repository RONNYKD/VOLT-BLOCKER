/**
 * Storage initialization utilities
 * Handles app startup storage setup and migrations
 */
import { migrations, errorHandler, ErrorSeverity, StorageUtils, StorageKeys } from './index';

// Initialization result interface
export interface InitResult {
  success: boolean;
  migrationsRun: boolean;
  currentVersion: number;
  errors: string[];
  warnings: string[];
}

// Storage initialization class
export class StorageInitializer {
  private static isInitialized = false;
  private static initPromise: Promise<InitResult> | null = null;

  /**
   * Initialize storage system
   * This should be called when the app starts
   */
  static async initialize(): Promise<InitResult> {
    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInitialization();
    return this.initPromise;
  }

  /**
   * Check if storage is initialized
   */
  static isStorageInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Force re-initialization (for testing or recovery)
   */
  static async reinitialize(): Promise<InitResult> {
    this.isInitialized = false;
    this.initPromise = null;
    return this.initialize();
  }

  /**
   * Perform the actual initialization
   */
  private static async performInitialization(): Promise<InitResult> {
    const result: InitResult = {
      success: false,
      migrationsRun: false,
      currentVersion: 0,
      errors: [],
      warnings: [],
    };

    try {
      console.log('Initializing storage system...');

      // Step 1: Check current version
      try {
        result.currentVersion = await migrations.getCurrentVersion();
        console.log(`Current data version: ${result.currentVersion}`);
      } catch (error) {
        result.warnings.push('Failed to get current version, defaulting to 0');
        result.currentVersion = 0;
      }

      // Step 2: Check if migrations are needed
      const needsMigration = await migrations.check();
      if (needsMigration) {
        console.log('Running data migrations...');
        try {
          await migrations.run();
          result.migrationsRun = true;
          result.currentVersion = migrations.getLatestVersion();
          console.log(`Migrations completed. New version: ${result.currentVersion}`);
        } catch (error) {
          const errorMsg = `Migration failed: ${error}`;
          result.errors.push(errorMsg);
          await errorHandler.handle(
            error as Error,
            { context: 'storage_initialization' },
            ErrorSeverity.HIGH
          );
        }
      } else {
        console.log('No migrations needed');
      }

      // Step 3: Verify storage accessibility
      try {
        await this.verifyStorageAccess();
        console.log('Storage access verified');
      } catch (error) {
        const errorMsg = `Storage access verification failed: ${error}`;
        result.errors.push(errorMsg);
        await errorHandler.handle(
          error as Error,
          { context: 'storage_verification' },
          ErrorSeverity.HIGH
        );
      }

      // Step 4: Initialize default data if needed
      try {
        await this.initializeDefaultData();
        console.log('Default data initialization completed');
      } catch (error) {
        const errorMsg = `Default data initialization failed: ${error}`;
        result.warnings.push(errorMsg);
        await errorHandler.handle(
          error as Error,
          { context: 'default_data_init' },
          ErrorSeverity.MEDIUM
        );
      }

      // Step 5: Set up periodic maintenance
      this.setupPeriodicMaintenance();

      result.success = result.errors.length === 0;
      this.isInitialized = result.success;

      if (result.success) {
        console.log('✅ Storage system initialized successfully');
      } else {
        console.warn('⚠️ Storage system initialized with errors:', result.errors);
      }

      return result;
    } catch (error) {
      const errorMsg = `Storage initialization failed: ${error}`;
      result.errors.push(errorMsg);
      result.success = false;

      await errorHandler.handle(
        error as Error,
        { context: 'storage_initialization' },
        ErrorSeverity.CRITICAL
      );

      console.error('❌ Storage system initialization failed:', error);
      return result;
    }
  }

  /**
   * Verify that storage is accessible
   */
  private static async verifyStorageAccess(): Promise<void> {
    const testKey = StorageKeys.DATA_VERSION;
    const testValue = Date.now();

    // Test write
    await StorageUtils.setItem(testKey, testValue);

    // Test read
    const retrieved = await StorageUtils.getItem<number>(testKey);
    if (retrieved !== testValue) {
      throw new Error('Storage read/write verification failed');
    }

    // Test storage info
    const info = await StorageUtils.getStorageInfo();
    if (typeof info.totalKeys !== 'number') {
      throw new Error('Storage info retrieval failed');
    }
  }

  /**
   * Initialize default data if needed
   */
  private static async initializeDefaultData(): Promise<void> {
    // Check if this is a fresh installation
    const existingData = await StorageUtils.getItem(StorageKeys.APP_SETTINGS);
    
    if (!existingData) {
      console.log('Fresh installation detected, initializing default data...');
      
      // Initialize default app settings
      const defaultSettings = {
        theme: 'system',
        notifications: true,
        strictMode: false,
        defaultSessionDuration: 25,
        initialized: true,
        installedAt: new Date().toISOString(),
      };
      
      await StorageUtils.setItem(StorageKeys.APP_SETTINGS, defaultSettings);
      
      // Initialize empty arrays for user data
      await StorageUtils.setItem(StorageKeys.BLOCKED_APPS, []);
      await StorageUtils.setItem(StorageKeys.BLOCKED_WEBSITES, []);
      await StorageUtils.setItem(StorageKeys.FOCUS_SESSIONS, []);
      
      console.log('Default data initialized');
    }
  }

  /**
   * Set up periodic maintenance tasks
   */
  private static setupPeriodicMaintenance(): void {
    // Clean up old error reports every hour
    setInterval(() => {
      try {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        errorHandler.clear(oneWeekAgo);
      } catch (error) {
        console.warn('Periodic maintenance error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Create backup every 24 hours
    setInterval(async () => {
      try {
        await StorageUtils.backupData();
        console.log('Periodic backup created');
      } catch (error) {
        console.warn('Periodic backup failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Get initialization status
   */
  static async getInitializationStatus(): Promise<{
    isInitialized: boolean;
    currentVersion: number;
    storageInfo: any;
    errorCount: number;
  }> {
    try {
      const currentVersion = await migrations.getCurrentVersion();
      const storageInfo = await StorageUtils.getStorageInfo();
      const errorStats = errorHandler.stats();

      return {
        isInitialized: this.isInitialized,
        currentVersion,
        storageInfo,
        errorCount: errorStats.unresolved,
      };
    } catch (error) {
      return {
        isInitialized: false,
        currentVersion: 0,
        storageInfo: null,
        errorCount: -1,
      };
    }
  }

  /**
   * Emergency reset (for recovery scenarios)
   */
  static async emergencyReset(): Promise<void> {
    console.warn('Performing emergency storage reset...');
    
    try {
      // Clear all data
      await StorageUtils.clearAppData();
      
      // Reset migration version
      await migrations.reset();
      
      // Clear error reports
      errorHandler.clear();
      
      // Mark as uninitialized
      this.isInitialized = false;
      this.initPromise = null;
      
      console.log('Emergency reset completed');
    } catch (error) {
      console.error('Emergency reset failed:', error);
      throw error;
    }
  }
}

// Convenience functions
export const initializeStorage = () => StorageInitializer.initialize();
export const isStorageReady = () => StorageInitializer.isStorageInitialized();
export const getStorageStatus = () => StorageInitializer.getInitializationStatus();
export const resetStorage = () => StorageInitializer.emergencyReset();