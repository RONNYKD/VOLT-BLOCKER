/**
 * AsyncStorage wrapper utilities for type-safe data operations
 * Provides serialization, validation, and error handling
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys enum for type safety
export enum StorageKeys {
  // User data
  USER_PROFILE = 'user_profile',
  USER_PREFERENCES = 'user_preferences',
  
  // App data
  BLOCKED_APPS = 'blocked_apps',
  BLOCKED_WEBSITES = 'blocked_websites',
  BLOCKING_RULES = 'blocking_rules',
  
  // Focus data
  FOCUS_SESSIONS = 'focus_sessions',
  FOCUS_STATS = 'focus_stats',
  
  // Settings
  APP_SETTINGS = 'app_settings',
  THEME_SETTINGS = 'theme_settings',
  
  // System
  DATA_VERSION = 'data_version',
  LAST_BACKUP = 'last_backup',
}

// Data validation schemas
export interface StorageSchema {
  version: number;
  data: any;
  timestamp: number;
  checksum?: string;
}

// Error types
export class StorageError extends Error {
  constructor(
    message: string,
    public code: 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'STORAGE_ERROR' | 'MIGRATION_ERROR',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// Storage utilities class
export class StorageUtils {
  private static readonly CURRENT_VERSION = 1;
  private static readonly MAX_RETRIES = 3;

  /**
   * Store data with type safety and validation
   */
  static async setItem<T>(key: StorageKeys, data: T): Promise<void> {
    try {
      const schema: StorageSchema = {
        version: this.CURRENT_VERSION,
        data,
        timestamp: Date.now(),
        checksum: this.generateChecksum(data),
      };

      const serialized = JSON.stringify(schema);
      await AsyncStorage.setItem(key, serialized);
    } catch (error) {
      throw new StorageError(
        `Failed to store data for key: ${key}`,
        'STORAGE_ERROR',
        error as Error
      );
    }
  }

  /**
   * Retrieve data with type safety and validation
   */
  static async getItem<T>(key: StorageKeys): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const schema: StorageSchema = JSON.parse(stored);
      
      // Validate schema structure
      if (!this.isValidSchema(schema)) {
        throw new StorageError(
          `Invalid schema for key: ${key}`,
          'VALIDATION_ERROR'
        );
      }

      // Check if migration is needed
      if (schema.version < this.CURRENT_VERSION) {
        const migrated = await this.migrateData(key, schema);
        return migrated as T;
      }

      // Validate checksum if present
      if (schema.checksum && !this.validateChecksum(schema.data, schema.checksum)) {
        console.warn(`Checksum validation failed for key: ${key}`);
      }

      return schema.data as T;
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `Failed to retrieve data for key: ${key}`,
        'PARSE_ERROR',
        error as Error
      );
    }
  }

  /**
   * Remove item from storage
   */
  static async removeItem(key: StorageKeys): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      throw new StorageError(
        `Failed to remove data for key: ${key}`,
        'STORAGE_ERROR',
        error as Error
      );
    }
  }

  /**
   * Clear all app data (useful for logout/reset)
   */
  static async clearAppData(): Promise<void> {
    try {
      const keys = Object.values(StorageKeys);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      throw new StorageError(
        'Failed to clear app data',
        'STORAGE_ERROR',
        error as Error
      );
    }
  }

  /**
   * Get multiple items at once
   */
  static async getMultipleItems<T>(keys: StorageKeys[]): Promise<Record<string, T | null>> {
    try {
      const results: Record<string, T | null> = {};
      
      for (const key of keys) {
        results[key] = await this.getItem<T>(key);
      }
      
      return results;
    } catch (error) {
      throw new StorageError(
        'Failed to retrieve multiple items',
        'STORAGE_ERROR',
        error as Error
      );
    }
  }

  /**
   * Set multiple items at once
   */
  static async setMultipleItems(items: Record<StorageKeys, any>): Promise<void> {
    try {
      const promises = Object.entries(items).map(([key, value]) =>
        this.setItem(key as StorageKeys, value)
      );
      
      await Promise.all(promises);
    } catch (error) {
      throw new StorageError(
        'Failed to store multiple items',
        'STORAGE_ERROR',
        error as Error
      );
    }
  }

  /**
   * Get storage usage information
   */
  static async getStorageInfo(): Promise<{
    totalKeys: number;
    estimatedSize: number;
    keys: string[];
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => 
        Object.values(StorageKeys).includes(key as StorageKeys)
      );
      
      let estimatedSize = 0;
      for (const key of appKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          estimatedSize += value.length;
        }
      }

      return {
        totalKeys: appKeys.length,
        estimatedSize,
        keys: appKeys,
      };
    } catch (error) {
      throw new StorageError(
        'Failed to get storage info',
        'STORAGE_ERROR',
        error as Error
      );
    }
  }

  /**
   * Backup all app data
   */
  static async backupData(): Promise<string> {
    try {
      const keys = Object.values(StorageKeys);
      const backup: Record<string, any> = {};
      
      for (const key of keys) {
        const data = await this.getItem(key);
        if (data !== null) {
          backup[key] = data;
        }
      }

      const backupData = {
        version: this.CURRENT_VERSION,
        timestamp: Date.now(),
        data: backup,
      };

      await this.setItem(StorageKeys.LAST_BACKUP, Date.now());
      return JSON.stringify(backupData);
    } catch (error) {
      throw new StorageError(
        'Failed to backup data',
        'STORAGE_ERROR',
        error as Error
      );
    }
  }

  /**
   * Restore data from backup
   */
  static async restoreData(backupString: string): Promise<void> {
    try {
      const backup = JSON.parse(backupString);
      
      if (!backup.data || !backup.version) {
        throw new StorageError(
          'Invalid backup format',
          'VALIDATION_ERROR'
        );
      }

      // Clear existing data
      await this.clearAppData();

      // Restore data
      for (const [key, value] of Object.entries(backup.data)) {
        await this.setItem(key as StorageKeys, value);
      }
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        'Failed to restore data',
        'STORAGE_ERROR',
        error as Error
      );
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff: 100ms, 200ms, 400ms, etc.
        const delay = Math.pow(2, attempt - 1) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new StorageError(
      `Operation failed after ${maxRetries} attempts`,
      'STORAGE_ERROR',
      lastError!
    );
  }

  // Private helper methods
  private static isValidSchema(schema: any): schema is StorageSchema {
    return (
      typeof schema === 'object' &&
      typeof schema.version === 'number' &&
      schema.data !== undefined &&
      typeof schema.timestamp === 'number'
    );
  }

  private static generateChecksum(data: any): string {
    // Simple checksum using JSON string length and content hash
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${str.length}-${Math.abs(hash)}`;
  }

  private static validateChecksum(data: any, checksum: string): boolean {
    return this.generateChecksum(data) === checksum;
  }

  private static async migrateData<T>(key: StorageKeys, schema: StorageSchema): Promise<T> {
    try {
      // For now, just update the version and re-save
      // In the future, add specific migration logic here
      const migratedData = schema.data;
      await this.setItem(key, migratedData);
      return migratedData as T;
    } catch (error) {
      throw new StorageError(
        `Failed to migrate data for key: ${key}`,
        'MIGRATION_ERROR',
        error as Error
      );
    }
  }
}

// Convenience functions for common operations
export const storage = {
  // User data
  setUserProfile: (profile: any) => StorageUtils.setItem(StorageKeys.USER_PROFILE, profile),
  getUserProfile: () => StorageUtils.getItem(StorageKeys.USER_PROFILE),
  
  // App data
  setBlockedApps: (apps: any[]) => StorageUtils.setItem(StorageKeys.BLOCKED_APPS, apps),
  getBlockedApps: () => StorageUtils.getItem<any[]>(StorageKeys.BLOCKED_APPS),
  
  setBlockedWebsites: (websites: any[]) => StorageUtils.setItem(StorageKeys.BLOCKED_WEBSITES, websites),
  getBlockedWebsites: () => StorageUtils.getItem<any[]>(StorageKeys.BLOCKED_WEBSITES),
  
  // Focus data
  setFocusSessions: (sessions: any[]) => StorageUtils.setItem(StorageKeys.FOCUS_SESSIONS, sessions),
  getFocusSessions: () => StorageUtils.getItem<any[]>(StorageKeys.FOCUS_SESSIONS),
  
  // Settings
  setAppSettings: (settings: any) => StorageUtils.setItem(StorageKeys.APP_SETTINGS, settings),
  getAppSettings: () => StorageUtils.getItem(StorageKeys.APP_SETTINGS),
  
  // Utility functions
  clearAll: () => StorageUtils.clearAppData(),
  backup: () => StorageUtils.backupData(),
  restore: (backup: string) => StorageUtils.restoreData(backup),
  getInfo: () => StorageUtils.getStorageInfo(),
};