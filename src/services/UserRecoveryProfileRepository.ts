import { SecureStorage } from './secure-storage';

interface RecoveryProfile {
  userId: string;
  recoveryKey: string;
  createdAt: number;
  lastUpdated: number;
}

export class UserRecoveryProfileRepository {
  private static readonly STORAGE_KEY_PREFIX = 'recovery_profile_';

  static async saveRecoveryProfile(userId: string, recoveryKey: string): Promise<void> {
    try {
      const profile: RecoveryProfile = {
        userId,
        recoveryKey,
        createdAt: Date.now(),
        lastUpdated: Date.now()
      };
      
      await SecureStorage.setItem(
        this.getStorageKey(userId),
        JSON.stringify(profile)
      );
    } catch (error) {
      console.error('Error saving recovery profile:', error);
      throw error;
    }
  }

  static async getRecoveryProfile(userId: string): Promise<RecoveryProfile | null> {
    try {
      const profileJson = await SecureStorage.getItem(this.getStorageKey(userId));
      if (!profileJson) return null;
      
      return JSON.parse(profileJson) as RecoveryProfile;
    } catch (error) {
      console.error('Error finding recovery profile by user ID:', error);
      return null;
    }
  }

  static async updateRecoveryProfile(userId: string, updates: Partial<RecoveryProfile>): Promise<void> {
    try {
      const existing = await this.getRecoveryProfile(userId);
      if (!existing) throw new Error('Profile not found');
      
      const updated: RecoveryProfile = {
        ...existing,
        ...updates,
        lastUpdated: Date.now()
      };
      
      await SecureStorage.setItem(
        this.getStorageKey(userId),
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Error updating recovery profile:', error);
      throw error;
    }
  }

  static async deleteRecoveryProfile(userId: string): Promise<void> {
    try {
      await SecureStorage.removeItem(this.getStorageKey(userId));
    } catch (error) {
      console.error('Error deleting recovery profile:', error);
      throw error;
    }
  }

  private static getStorageKey(userId: string): string {
    return `${this.STORAGE_KEY_PREFIX}${userId}`;
  }
}
