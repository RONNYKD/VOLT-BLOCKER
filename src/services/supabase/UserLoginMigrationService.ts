/**
 * User Login Migration Service
 * Automatically migrates legacy data when users log in
 */
import { legacyDataMigrationService, MigrationResult } from './LegacyDataMigrationService';
import { userRecoveryProfileRepository } from '../ai/repositories/UserRecoveryProfileRepository';
import { milestoneRepository } from '../ai/repositories/MilestoneRepository';

export interface LoginMigrationResult {
  migrationPerformed: boolean;
  migrationResult?: MigrationResult;
  userHasData: boolean;
  summary: {
    legacyAchievements: number;
    newMilestones: number;
    profileExists: boolean;
  };
  message: string;
}

class UserLoginMigrationService {
  /**
   * Handle user login and perform migration if needed
   */
  async handleUserLogin(userId: string): Promise<LoginMigrationResult> {
    console.log(`🔐 Handling login for user: ${userId}`);

    try {
      // Get migration summary
      const summary = await legacyDataMigrationService.getMigrationSummary(userId);
      
      const result: LoginMigrationResult = {
        migrationPerformed: false,
        userHasData: summary.hasNewData || summary.hasLegacyData,
        summary: {
          legacyAchievements: summary.legacyAchievements,
          newMilestones: summary.newMilestones,
          profileExists: summary.hasNewData
        },
        message: 'Login processed successfully'
      };

      // If user needs migration, perform it
      if (summary.needsMigration) {
        console.log(`📦 User ${userId} needs migration - performing now...`);
        
        const migrationResult = await legacyDataMigrationService.migrateUserData(userId);
        result.migrationPerformed = true;
        result.migrationResult = migrationResult;

        if (migrationResult.success) {
          result.message = `Welcome back! We've restored ${migrationResult.achievementsMigrated} of your previous achievements.`;
          result.summary.newMilestones = migrationResult.achievementsMigrated;
          result.summary.profileExists = migrationResult.profileMigrated;
          
          console.log(`✅ Migration successful for user ${userId}:`, {
            achievements: migrationResult.achievementsMigrated,
            profile: migrationResult.profileMigrated
          });
        } else {
          result.message = 'Welcome back! We encountered some issues restoring your previous data, but you can continue using the app.';
          console.log(`⚠️ Migration had issues for user ${userId}:`, migrationResult.errors);
        }
      } else if (summary.hasNewData) {
        result.message = `Welcome back! You have ${summary.newMilestones} achievements in your recovery journey.`;
        console.log(`👋 User ${userId} already has new system data`);
      } else if (summary.hasLegacyData) {
        result.message = 'Welcome back! Your previous achievements are being prepared for the new system.';
        console.log(`📋 User ${userId} has legacy data but migration not needed yet`);
      } else {
        result.message = 'Welcome! Ready to start your recovery journey with AI-powered support.';
        console.log(`🆕 New user ${userId} - no existing data found`);
      }

      return result;

    } catch (error) {
      console.error(`❌ Error handling login for user ${userId}:`, error);
      
      return {
        migrationPerformed: false,
        userHasData: false,
        summary: {
          legacyAchievements: 0,
          newMilestones: 0,
          profileExists: false
        },
        message: 'Welcome! Ready to start your recovery journey.'
      };
    }
  }

  /**
   * Force migration for a user (manual trigger)
   */
  async forceMigration(userId: string): Promise<MigrationResult> {
    console.log(`🔄 Force migrating data for user: ${userId}`);
    return await legacyDataMigrationService.migrateUserData(userId);
  }

  /**
   * Check if user needs migration without performing it
   */
  async checkMigrationStatus(userId: string): Promise<{
    needsMigration: boolean;
    hasLegacyData: boolean;
    hasNewData: boolean;
    summary: any;
  }> {
    try {
      const summary = await legacyDataMigrationService.getMigrationSummary(userId);
      
      return {
        needsMigration: summary.needsMigration,
        hasLegacyData: summary.hasLegacyData,
        hasNewData: summary.hasNewData,
        summary: {
          legacyAchievements: summary.legacyAchievements,
          newMilestones: summary.newMilestones,
          profileExists: summary.hasNewData
        }
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return {
        needsMigration: false,
        hasLegacyData: false,
        hasNewData: false,
        summary: {
          legacyAchievements: 0,
          newMilestones: 0,
          profileExists: false
        }
      };
    }
  }

  /**
   * Get user's current data summary
   */
  async getUserDataSummary(userId: string): Promise<{
    profile: any;
    recentMilestones: any[];
    totalMilestones: number;
    migrationStatus: any;
  }> {
    try {
      // Get current data
      const profile = await userRecoveryProfileRepository.findByUserId(userId);
      const recentMilestones = await milestoneRepository.getRecentMilestones(userId, 10);
      const milestoneStats = await milestoneRepository.getMilestoneStats(userId);
      const migrationStatus = await this.checkMigrationStatus(userId);

      return {
        profile,
        recentMilestones,
        totalMilestones: milestoneStats.total,
        migrationStatus
      };
    } catch (error) {
      console.error('Error getting user data summary:', error);
      return {
        profile: null,
        recentMilestones: [],
        totalMilestones: 0,
        migrationStatus: {
          needsMigration: false,
          hasLegacyData: false,
          hasNewData: false,
          summary: {}
        }
      };
    }
  }

  /**
   * Create initial profile for new users
   */
  async createInitialProfile(userId: string, recoveryStartDate?: string): Promise<any> {
    try {
      // Check if profile already exists
      const existingProfile = await userRecoveryProfileRepository.findByUserId(userId);
      if (existingProfile) {
        console.log(`Profile already exists for user ${userId}`);
        return existingProfile;
      }

      // Create new profile
      const profileData = {
        user_id: userId,
        recovery_start_date: recoveryStartDate || new Date().toISOString().split('T')[0],
        current_stage: 'early' as const,
        days_since_last_setback: 0,
        total_recovery_days: 0,
        personal_triggers: [],
        coping_strategies: [],
        support_contacts: [],
        recovery_goals: [],
        privacy_settings: {
          share_progress_anonymously: false,
          allow_ai_analysis: true,
          data_retention_days: 365,
          emergency_contact_access: true
        },
        ai_coaching_enabled: true,
        crisis_intervention_enabled: true,
        milestone_notifications_enabled: true
      };

      const profile = await userRecoveryProfileRepository.create(profileData);
      console.log(`✅ Created initial profile for user ${userId}`);
      
      return profile;
    } catch (error) {
      console.error(`Error creating initial profile for user ${userId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const userLoginMigrationService = new UserLoginMigrationService();