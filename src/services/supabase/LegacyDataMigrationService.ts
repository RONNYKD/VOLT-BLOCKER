/**
 * Legacy Data Migration Service
 * Migrates user achievements from old Supabase tables to new AI rehabilitation system
 */
import { supabase } from '../supabase';
import { milestoneRepository } from '../ai/repositories/MilestoneRepository';
import { userRecoveryProfileRepository } from '../ai/repositories/UserRecoveryProfileRepository';
import { MilestoneType, MilestoneSignificance, RecoveryStage } from '../ai/types';

export interface LegacyAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  description: string;
  earned_date: string;
  milestone_value?: number;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface LegacyUserProfile {
  id: string;
  user_id: string;
  recovery_start_date: string;
  total_recovery_days: number;
  days_since_last_setback: number;
  current_stage: string;
  achievements_count: number;
  milestones_reached: number;
  created_at: string;
  updated_at: string;
}

export interface MigrationResult {
  success: boolean;
  achievementsMigrated: number;
  profileMigrated: boolean;
  errors: string[];
  warnings: string[];
}

class LegacyDataMigrationService {
  /**
   * Discover existing tables in the database
   */
  async discoverLegacyTables(): Promise<string[]> {
    try {
      console.log('🔍 Discovering existing tables in Supabase...');
      
      const { data, error } = await supabase.getClient()
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .neq('table_name', 'user_recovery_profiles')
        .neq('table_name', 'milestone_records')
        .neq('table_name', 'daily_check_ins')
        .neq('table_name', 'ai_interaction_logs');

      if (error) {
        console.log('Could not query information_schema, trying alternative approach...');
        // Try common table names that might exist
        return await this.checkCommonTableNames();
      }

      const tableNames = data?.map(row => row.table_name) || [];
      console.log('📋 Found existing tables:', tableNames);
      return tableNames;
    } catch (error) {
      console.log('Error discovering tables, using common names:', error);
      return await this.checkCommonTableNames();
    }
  }

  /**
   * Check for common table names that might contain legacy data
   */
  private async checkCommonTableNames(): Promise<string[]> {
    const commonNames = [
      'achievements',
      'user_achievements', 
      'milestones',
      'user_milestones',
      'profiles',
      'user_profiles',
      'recovery_data',
      'progress',
      'user_progress',
      'streaks',
      'recovery_streaks'
    ];

    const existingTables: string[] = [];

    for (const tableName of commonNames) {
      try {
        const { data, error } = await supabase.getClient()
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error) {
          existingTables.push(tableName);
          console.log(`✅ Found table: ${tableName}`);
        }
      } catch (error) {
        // Table doesn't exist, continue
      }
    }

    return existingTables;
  }

  /**
   * Migrate user data from legacy tables
   */
  async migrateUserData(userId: string): Promise<MigrationResult> {
    console.log(`🔄 Starting migration for user: ${userId}`);
    
    const result: MigrationResult = {
      success: false,
      achievementsMigrated: 0,
      profileMigrated: false,
      errors: [],
      warnings: []
    };

    try {
      // First, check if user already has new system data
      const existingProfile = await userRecoveryProfileRepository.findByUserId(userId);
      if (existingProfile) {
        result.warnings.push('User already has a recovery profile in the new system');
        console.log(`⚠️ User ${userId} already has new system data`);
      }

      // Discover available tables
      const availableTables = await this.discoverLegacyTables();
      
      // Try to migrate achievements from various possible table names
      const achievementTables = availableTables.filter(name => 
        name.includes('achievement') || name.includes('milestone')
      );

      for (const tableName of achievementTables) {
        try {
          const migrated = await this.migrateAchievementsFromTable(userId, tableName);
          result.achievementsMigrated += migrated;
        } catch (error) {
          result.errors.push(`Error migrating from ${tableName}: ${error}`);
        }
      }

      // Try to migrate profile from various possible table names
      const profileTables = availableTables.filter(name => 
        name.includes('profile') || name.includes('progress') || name.includes('user')
      );

      for (const tableName of profileTables) {
        try {
          const migrated = await this.migrateProfileFromTable(userId, tableName);
          if (migrated) {
            result.profileMigrated = true;
            break; // Only need one profile
          }
        } catch (error) {
          result.errors.push(`Error migrating profile from ${tableName}: ${error}`);
        }
      }

      result.success = result.achievementsMigrated > 0 || result.profileMigrated;
      
      if (result.success) {
        console.log(`✅ Migration completed for user ${userId}:`, {
          achievements: result.achievementsMigrated,
          profile: result.profileMigrated
        });
      } else {
        console.log(`⚠️ No data found to migrate for user ${userId}`);
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Migrate achievements from a specific table
   */
  private async migrateAchievementsFromTable(userId: string, tableName: string): Promise<number> {
    try {
      console.log(`📦 Checking table ${tableName} for achievements...`);
      
      // Try different possible column structures
      const possibleQueries = [
        // Standard structure
        { 
          select: 'id, user_id, achievement_type, achievement_name, description, earned_date, milestone_value, category, created_at',
          userColumn: 'user_id'
        },
        // Alternative structure 1
        { 
          select: 'id, user_id, type, name, description, date, value, category, created_at',
          userColumn: 'user_id'
        },
        // Alternative structure 2
        { 
          select: 'id, userId, achievement_type, title, description, achievedDate, value, created_at',
          userColumn: 'userId'
        },
        // Minimal structure
        { 
          select: '*',
          userColumn: 'user_id'
        }
      ];

      let achievements: any[] = [];
      let successfulQuery = null;

      for (const query of possibleQueries) {
        try {
          const { data, error } = await supabase.getClient()
            .from(tableName)
            .select(query.select)
            .eq(query.userColumn, userId);

          if (!error && data && data.length > 0) {
            achievements = data;
            successfulQuery = query;
            break;
          }
        } catch (error) {
          // Try next query structure
          continue;
        }
      }

      if (achievements.length === 0) {
        console.log(`📭 No achievements found in ${tableName} for user ${userId}`);
        return 0;
      }

      console.log(`📋 Found ${achievements.length} achievements in ${tableName}`);

      // Convert and migrate achievements
      let migratedCount = 0;
      for (const achievement of achievements) {
        try {
          const milestoneData = this.convertLegacyAchievementToMilestone(achievement);
          
          // Check if milestone already exists
          const exists = await milestoneRepository.milestoneExists(
            userId,
            milestoneData.milestone_type,
            milestoneData.title,
            milestoneData.achievement_date
          );

          if (!exists) {
            await milestoneRepository.create(milestoneData);
            migratedCount++;
          }
        } catch (error) {
          console.error(`Error migrating achievement ${achievement.id}:`, error);
        }
      }

      console.log(`✅ Migrated ${migratedCount} achievements from ${tableName}`);
      return migratedCount;

    } catch (error) {
      console.error(`❌ Error migrating from table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Migrate profile from a specific table
   */
  private async migrateProfileFromTable(userId: string, tableName: string): Promise<boolean> {
    try {
      console.log(`👤 Checking table ${tableName} for user profile...`);
      
      const possibleQueries = [
        { 
          select: 'user_id, recovery_start_date, total_recovery_days, days_since_last_setback, current_stage',
          userColumn: 'user_id'
        },
        { 
          select: 'userId, startDate, totalDays, currentStreak, stage',
          userColumn: 'userId'
        },
        { 
          select: '*',
          userColumn: 'user_id'
        }
      ];

      let profile: any = null;

      for (const query of possibleQueries) {
        try {
          const { data, error } = await supabase.getClient()
            .from(tableName)
            .select(query.select)
            .eq(query.userColumn, userId)
            .single();

          if (!error && data) {
            profile = data;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!profile) {
        console.log(`📭 No profile found in ${tableName} for user ${userId}`);
        return false;
      }

      // Convert and create profile
      const profileData = this.convertLegacyProfileToNew(userId, profile);
      await userRecoveryProfileRepository.create(profileData);
      
      console.log(`✅ Migrated profile from ${tableName}`);
      return true;

    } catch (error) {
      console.error(`❌ Error migrating profile from table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Convert legacy achievement to new milestone format
   */
  private convertLegacyAchievementToMilestone(achievement: any): any {
    // Map achievement type to milestone type
    const typeMapping: Record<string, MilestoneType> = {
      'days_sober': 'recovery',
      'sobriety': 'recovery',
      'recovery': 'recovery',
      'streak': 'recovery',
      'behavioral': 'behavioral',
      'behavior': 'behavioral',
      'habit': 'behavioral',
      'personal': 'personal_growth',
      'growth': 'personal_growth',
      'community': 'community',
      'social': 'community'
    };

    // Determine milestone type
    const achievementType = achievement.achievement_type || achievement.type || 'behavioral';
    const milestoneType = typeMapping[achievementType.toLowerCase()] || 'behavioral';

    // Determine significance
    const value = achievement.milestone_value || achievement.value || 1;
    let significance: MilestoneSignificance = 'minor';
    if (value >= 365) {
      significance = 'major_breakthrough';
    } else if (value >= 30) {
      significance = 'major';
    }

    // Get dates
    const achievementDate = achievement.earned_date || achievement.date || achievement.achievedDate || new Date().toISOString().split('T')[0];
    const daysToAchieve = achievement.milestone_value || achievement.value || 1;

    return {
      user_id: achievement.user_id || achievement.userId,
      milestone_type: milestoneType,
      title: achievement.achievement_name || achievement.name || achievement.title || 'Legacy Achievement',
      description: achievement.description || 'Migrated from previous system',
      achievement_date: achievementDate,
      days_to_achieve: daysToAchieve,
      significance,
      celebration_content: `Congratulations on achieving: ${achievement.achievement_name || achievement.name || 'this milestone'}!`
    };
  }

  /**
   * Convert legacy profile to new format
   */
  private convertLegacyProfileToNew(userId: string, profile: any): any {
    // Map stage names
    const stageMapping: Record<string, RecoveryStage> = {
      'early': 'early',
      'beginning': 'early',
      'maintenance': 'maintenance',
      'stable': 'maintenance',
      'challenge': 'challenge',
      'difficult': 'challenge',
      'growth': 'growth',
      'advanced': 'growth'
    };

    const stage = profile.current_stage || profile.stage || 'early';
    const recoveryStage = stageMapping[stage.toLowerCase()] || 'early';

    return {
      user_id: userId,
      recovery_start_date: profile.recovery_start_date || profile.startDate || new Date().toISOString().split('T')[0],
      current_stage: recoveryStage,
      days_since_last_setback: profile.days_since_last_setback || profile.currentStreak || 0,
      total_recovery_days: profile.total_recovery_days || profile.totalDays || 0,
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
  }

  /**
   * Get migration summary for user
   */
  async getMigrationSummary(userId: string): Promise<{
    hasLegacyData: boolean;
    hasNewData: boolean;
    legacyAchievements: number;
    newMilestones: number;
    needsMigration: boolean;
  }> {
    try {
      // Check for new system data
      const newProfile = await userRecoveryProfileRepository.findByUserId(userId);
      const newMilestones = await milestoneRepository.getRecentMilestones(userId, 1000);

      // Check for legacy data
      const availableTables = await this.discoverLegacyTables();
      let legacyAchievements = 0;

      for (const tableName of availableTables) {
        if (tableName.includes('achievement') || tableName.includes('milestone')) {
          try {
            const { count } = await supabase.getClient()
              .from(tableName)
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId);
            
            legacyAchievements += count || 0;
          } catch (error) {
            // Table might not have user_id column, try userId
            try {
              const { count } = await supabase.getClient()
                .from(tableName)
                .select('*', { count: 'exact', head: true })
                .eq('userId', userId);
              
              legacyAchievements += count || 0;
            } catch (error) {
              // Skip this table
            }
          }
        }
      }

      return {
        hasLegacyData: legacyAchievements > 0,
        hasNewData: !!newProfile || newMilestones.length > 0,
        legacyAchievements,
        newMilestones: newMilestones.length,
        needsMigration: legacyAchievements > 0 && (!newProfile || newMilestones.length === 0)
      };

    } catch (error) {
      console.error('Error getting migration summary:', error);
      return {
        hasLegacyData: false,
        hasNewData: false,
        legacyAchievements: 0,
        newMilestones: 0,
        needsMigration: false
      };
    }
  }
}

// Export singleton instance
export const legacyDataMigrationService = new LegacyDataMigrationService();