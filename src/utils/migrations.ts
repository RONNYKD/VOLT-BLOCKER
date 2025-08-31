/**
 * Data migration system for handling schema changes
 * Provides version management and data transformation utilities
 */
import { StorageKeys, StorageUtils, StorageError } from './storage';

// Migration interface
export interface Migration {
  version: number;
  description: string;
  up: (data: any) => Promise<any>;
  down?: (data: any) => Promise<any>;
}

// Migration registry
export class MigrationManager {
  private static migrations: Migration[] = [
    // Example migration from version 0 to 1
    {
      version: 1,
      description: 'Initial schema setup',
      up: async (data: any) => {
        // Transform data to new format if needed
        return data;
      },
    },
    
    // Future migrations will be added here
    // {
    //   version: 2,
    //   description: 'Add new fields to user profile',
    //   up: async (data: any) => {
    //     if (data && typeof data === 'object') {
    //       return {
    //         ...data,
    //         newField: 'defaultValue',
    //       };
    //     }
    //     return data;
    //   },
    // },
  ];

  /**
   * Get current data version
   */
  static async getCurrentVersion(): Promise<number> {
    try {
      const version = await StorageUtils.getItem<number>(StorageKeys.DATA_VERSION);
      return version || 0;
    } catch (error) {
      console.warn('Failed to get current version, defaulting to 0');
      return 0;
    }
  }

  /**
   * Set current data version
   */
  static async setCurrentVersion(version: number): Promise<void> {
    await StorageUtils.setItem(StorageKeys.DATA_VERSION, version);
  }

  /**
   * Get latest migration version
   */
  static getLatestVersion(): number {
    return Math.max(...this.migrations.map(m => m.version), 0);
  }

  /**
   * Check if migration is needed
   */
  static async needsMigration(): Promise<boolean> {
    const currentVersion = await this.getCurrentVersion();
    const latestVersion = this.getLatestVersion();
    return currentVersion < latestVersion;
  }

  /**
   * Run all pending migrations
   */
  static async runMigrations(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const latestVersion = this.getLatestVersion();

    if (currentVersion >= latestVersion) {
      console.log('No migrations needed');
      return;
    }

    console.log(`Running migrations from version ${currentVersion} to ${latestVersion}`);

    // Get migrations to run
    const pendingMigrations = this.migrations
      .filter(m => m.version > currentVersion)
      .sort((a, b) => a.version - b.version);

    // Run each migration
    for (const migration of pendingMigrations) {
      try {
        console.log(`Running migration ${migration.version}: ${migration.description}`);
        await this.runSingleMigration(migration);
        await this.setCurrentVersion(migration.version);
        console.log(`Migration ${migration.version} completed successfully`);
      } catch (error) {
        throw new StorageError(
          `Migration ${migration.version} failed: ${migration.description}`,
          'MIGRATION_ERROR',
          error as Error
        );
      }
    }

    console.log('All migrations completed successfully');
  }

  /**
   * Run a single migration
   */
  private static async runSingleMigration(migration: Migration): Promise<void> {
    // Get all storage keys that might need migration
    const keys = Object.values(StorageKeys).filter(key => key !== StorageKeys.DATA_VERSION);
    
    for (const key of keys) {
      try {
        const data = await StorageUtils.getItem(key);
        if (data !== null) {
          const migratedData = await migration.up(data);
          await StorageUtils.setItem(key, migratedData);
        }
      } catch (error) {
        console.warn(`Failed to migrate data for key ${key}:`, error);
        // Continue with other keys instead of failing completely
      }
    }
  }

  /**
   * Rollback to a specific version (if down migrations are available)
   */
  static async rollbackToVersion(targetVersion: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    
    if (targetVersion >= currentVersion) {
      throw new StorageError(
        `Cannot rollback to version ${targetVersion} from ${currentVersion}`,
        'MIGRATION_ERROR'
      );
    }

    // Get migrations to rollback
    const rollbackMigrations = this.migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .filter(m => m.down) // Only migrations with down function
      .sort((a, b) => b.version - a.version); // Reverse order

    console.log(`Rolling back from version ${currentVersion} to ${targetVersion}`);

    for (const migration of rollbackMigrations) {
      try {
        console.log(`Rolling back migration ${migration.version}: ${migration.description}`);
        await this.runSingleRollback(migration);
        console.log(`Rollback ${migration.version} completed successfully`);
      } catch (error) {
        throw new StorageError(
          `Rollback ${migration.version} failed: ${migration.description}`,
          'MIGRATION_ERROR',
          error as Error
        );
      }
    }

    await this.setCurrentVersion(targetVersion);
    console.log(`Rollback to version ${targetVersion} completed successfully`);
  }

  /**
   * Run a single rollback
   */
  private static async runSingleRollback(migration: Migration): Promise<void> {
    if (!migration.down) {
      throw new StorageError(
        `Migration ${migration.version} does not support rollback`,
        'MIGRATION_ERROR'
      );
    }

    const keys = Object.values(StorageKeys).filter(key => key !== StorageKeys.DATA_VERSION);
    
    for (const key of keys) {
      try {
        const data = await StorageUtils.getItem(key);
        if (data !== null) {
          const rolledBackData = await migration.down!(data);
          await StorageUtils.setItem(key, rolledBackData);
        }
      } catch (error) {
        console.warn(`Failed to rollback data for key ${key}:`, error);
      }
    }
  }

  /**
   * Get migration history
   */
  static getMigrationHistory(): Migration[] {
    return [...this.migrations].sort((a, b) => a.version - b.version);
  }

  /**
   * Add a new migration (for development/testing)
   */
  static addMigration(migration: Migration): void {
    // Check for duplicate versions
    if (this.migrations.some(m => m.version === migration.version)) {
      throw new Error(`Migration version ${migration.version} already exists`);
    }

    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Reset all data and migrations (for development/testing)
   */
  static async resetAll(): Promise<void> {
    console.warn('Resetting all data and migrations');
    await StorageUtils.clearAppData();
    await this.setCurrentVersion(0);
  }
}

// Convenience functions
export const migrations = {
  check: () => MigrationManager.needsMigration(),
  run: () => MigrationManager.runMigrations(),
  getCurrentVersion: () => MigrationManager.getCurrentVersion(),
  getLatestVersion: () => MigrationManager.getLatestVersion(),
  rollback: (version: number) => MigrationManager.rollbackToVersion(version),
  history: () => MigrationManager.getMigrationHistory(),
  reset: () => MigrationManager.resetAll(),
};