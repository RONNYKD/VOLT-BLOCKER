/**
 * Recovery Data Sync Service
 * Syncs user recovery data between local storage and Supabase
 * Ensures users see their previous achievements when logging in
 */
import { supabase } from './supabase';
import { UserRecoveryProfileRepository } from './UserRecoveryProfileRepository';
import { MilestoneCelebrationService } from './MilestoneCelebrationService';
import { SecureStorage } from './secure-storage';
import { errorHandler, ErrorSeverity } from '../utils';

export interface RecoveryDataSyncResult {
  success: boolean;
  profileSynced: boolean;
  milestonesSynced: boolean;
  achievementCount: number;
  error?: string;
}

export interface SupabaseMilestone {
  id: string;
  user_id: string;
  milestone_type: 'recovery' | 'behavioral' | 'personal_growth' | 'community';
  title: string;
  description: string;
  achievement_date: string;
  days_to_achieve: number;
  significance: 'minor' | 'major' | 'major_breakthrough';
  celebration_viewed: boolean;
  celebration_content?: string;
  personal_reflection?: string;
  next_goal_set?: string;
  significance_rating?: number;
  shared_anonymously: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseRecoveryProfile {
  id: string;
  user_id: string;
  recovery_start_date: string;
  current_stage: 'early' | 'maintenance' | 'challenge' | 'growth';
  days_since_last_setback: number;
  total_recovery_days: number;
  personal_triggers: string[];
  coping_strategies: string[];
  support_contacts: string[];
  recovery_goals: string[];
  privacy_settings: any;
  ai_coaching_enabled: boolean;
  crisis_intervention_enabled: boolean;
  milestone_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export class RecoveryDataSyncService {
  private static readonly SYNC_STATUS_KEY = 'recovery_data_sync_status';
  private static readonly LAST_SYNC_KEY = 'last_recovery_sync';

  /**
   * Sync all recovery data for a user when they log in
   */
  static async syncUserRecoveryData(userId: string): Promise<RecoveryDataSyncResult> {
    console.log('🔄 Starting recovery data sync for user:', userId.substring(0, 8) + '...');
    
    try {
      // Check if Supabase is available
      if (!supabase.isReady()) {
        console.warn('Supabase not ready, skipping sync');
        return {
          success: false,
          profileSynced: false,
          milestonesSynced: false,
          achievementCount: 0,
          error: 'Supabase not initialized'
        };
      }

      const client = supabase.getClient();
      let profileSynced = false;
      let milestonesSynced = false;
      let achievementCount = 0;

      // 1. Sync Recovery Profile
      try {
        console.log('📊 Syncing recovery profile...');
        const { data: profileData, error: profileError } = await client
          .from('user_recovery_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows found
          throw profileError;
        }

        if (profileData) {
          // Convert Supabase profile to local format and store
          await this.syncRecoveryProfile(userId, profileData);
          profileSynced = true;
          console.log('✅ Recovery profile synced successfully');
        } else {
          console.log('ℹ️ No recovery profile found in Supabase, will create on next update');
        }
      } catch (error) {
        console.error('❌ Error syncing recovery profile:', error);
        await errorHandler.handle(
          error as Error,
          { context: 'sync_recovery_profile', userId },
          ErrorSeverity.MEDIUM
        );
      }

      // 2. Sync Milestones and Achievements
      try {
        console.log('🏆 Syncing milestones and achievements...');
        const { data: milestonesData, error: milestonesError } = await client
          .from('milestone_records')
          .select('*')
          .eq('user_id', userId)
          .order('achievement_date', { ascending: false });

        if (milestonesError) {
          throw milestonesError;
        }

        if (milestonesData && milestonesData.length > 0) {
          // Convert and store milestones locally
          await this.syncMilestones(userId, milestonesData);
          milestonesSynced = true;
          achievementCount = milestonesData.length;
          console.log(`✅ ${achievementCount} milestones synced successfully`);
        } else {
          console.log('ℹ️ No milestones found in Supabase');
        }
      } catch (error) {
        console.error('❌ Error syncing milestones:', error);
        await errorHandler.handle(
          error as Error,
          { context: 'sync_milestones', userId },
          ErrorSeverity.MEDIUM
        );
      }

      // 3. Sync Daily Check-ins (recent ones for context)
      try {
        console.log('📅 Syncing recent check-ins...');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: checkInsData, error: checkInsError } = await client
          .from('daily_check_ins')
          .select('*')
          .eq('user_id', userId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (checkInsError) {
          throw checkInsError;
        }

        if (checkInsData && checkInsData.length > 0) {
          // Store recent check-ins for AI context
          await this.syncRecentCheckIns(userId, checkInsData);
          console.log(`✅ ${checkInsData.length} recent check-ins synced`);
        }
      } catch (error) {
        console.error('❌ Error syncing check-ins:', error);
        // Don't fail the whole sync for check-ins
      }

      // 4. Update sync status
      await this.updateSyncStatus(userId, true);

      const result: RecoveryDataSyncResult = {
        success: true,
        profileSynced,
        milestonesSynced,
        achievementCount,
      };

      console.log('🎉 Recovery data sync completed successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Recovery data sync failed:', error);
      
      await errorHandler.handle(
        error as Error,
        { context: 'sync_user_recovery_data', userId },
        ErrorSeverity.HIGH
      );

      await this.updateSyncStatus(userId, false);

      return {
        success: false,
        profileSynced: false,
        milestonesSynced: false,
        achievementCount: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Sync recovery profile from Supabase to local storage
   */
  private static async syncRecoveryProfile(userId: string, profileData: SupabaseRecoveryProfile): Promise<void> {
    try {
      // Convert Supabase profile to local format
      const localProfile = {
        userId: profileData.user_id,
        recoveryKey: `recovery_${profileData.user_id}`, // Generate a recovery key
        recoveryStartDate: profileData.recovery_start_date,
        currentStage: profileData.current_stage,
        daysSinceLastSetback: profileData.days_since_last_setback,
        totalRecoveryDays: profileData.total_recovery_days,
        personalTriggers: profileData.personal_triggers,
        copingStrategies: profileData.coping_strategies,
        supportContacts: profileData.support_contacts,
        recoveryGoals: profileData.recovery_goals,
        privacySettings: profileData.privacy_settings,
        aiCoachingEnabled: profileData.ai_coaching_enabled,
        crisisInterventionEnabled: profileData.crisis_intervention_enabled,
        milestoneNotificationsEnabled: profileData.milestone_notifications_enabled,
        createdAt: new Date(profileData.created_at).getTime(),
        lastUpdated: new Date(profileData.updated_at).getTime()
      };

      // Store in local repository
      await UserRecoveryProfileRepository.saveRecoveryProfile(userId, localProfile.recoveryKey);
      
      // Store detailed profile data
      await SecureStorage.setItem(
        `recovery_profile_details_${userId}`,
        JSON.stringify(localProfile)
      );

      console.log('✅ Recovery profile synced to local storage');
    } catch (error) {
      console.error('❌ Error syncing recovery profile to local:', error);
      throw error;
    }
  }

  /**
   * Sync milestones from Supabase to local storage
   */
  private static async syncMilestones(userId: string, milestonesData: SupabaseMilestone[]): Promise<void> {
    try {
      // Convert Supabase milestones to local format
      const localMilestones = milestonesData.map(milestone => ({
        id: milestone.id,
        userId: milestone.user_id,
        type: this.mapMilestoneType(milestone.milestone_type),
        target: milestone.days_to_achieve,
        current: milestone.days_to_achieve, // Achieved milestones have current = target
        achieved: true,
        achievedAt: new Date(milestone.achievement_date).getTime(),
        createdAt: new Date(milestone.created_at).getTime(),
        title: milestone.title,
        description: milestone.description,
        significance: milestone.significance,
        celebrationViewed: milestone.celebration_viewed,
        celebrationContent: milestone.celebration_content,
        personalReflection: milestone.personal_reflection,
        nextGoalSet: milestone.next_goal_set,
        significanceRating: milestone.significance_rating,
        sharedAnonymously: milestone.shared_anonymously
      }));

      // Store milestones in local storage
      await SecureStorage.setItem(
        `milestone_${userId}`,
        JSON.stringify(localMilestones)
      );

      // Also update the MilestoneCelebrationService format
      const celebrationMilestones = localMilestones.map(m => ({
        id: m.id,
        userId: m.userId,
        type: m.type,
        target: m.target,
        current: m.current,
        achieved: m.achieved,
        achievedAt: m.achievedAt,
        createdAt: m.createdAt
      }));

      await SecureStorage.setItem(
        `milestone_${userId}`,
        JSON.stringify(celebrationMilestones)
      );

      console.log(`✅ ${localMilestones.length} milestones synced to local storage`);
    } catch (error) {
      console.error('❌ Error syncing milestones to local:', error);
      throw error;
    }
  }

  /**
   * Sync recent check-ins for AI context
   */
  private static async syncRecentCheckIns(userId: string, checkInsData: any[]): Promise<void> {
    try {
      // Store recent check-ins for AI coaching context
      await SecureStorage.setItem(
        `recent_checkins_${userId}`,
        JSON.stringify(checkInsData)
      );

      console.log(`✅ ${checkInsData.length} recent check-ins synced`);
    } catch (error) {
      console.error('❌ Error syncing check-ins to local:', error);
      throw error;
    }
  }

  /**
   * Map Supabase milestone type to local type
   */
  private static mapMilestoneType(supabaseType: string): 'duration' | 'apps_blocked' | 'websites_blocked' | 'sessions_completed' {
    switch (supabaseType) {
      case 'recovery':
        return 'duration';
      case 'behavioral':
        return 'sessions_completed';
      case 'personal_growth':
        return 'apps_blocked';
      case 'community':
        return 'websites_blocked';
      default:
        return 'duration';
    }
  }

  /**
   * Update sync status
   */
  private static async updateSyncStatus(userId: string, success: boolean): Promise<void> {
    try {
      const syncStatus = {
        userId,
        lastSyncAttempt: Date.now(),
        lastSuccessfulSync: success ? Date.now() : null,
        success
      };

      await SecureStorage.setItem(
        `${this.SYNC_STATUS_KEY}_${userId}`,
        JSON.stringify(syncStatus)
      );
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  /**
   * Get sync status for a user
   */
  static async getSyncStatus(userId: string): Promise<{
    lastSyncAttempt?: number;
    lastSuccessfulSync?: number;
    success?: boolean;
  }> {
    try {
      const statusJson = await SecureStorage.getItem(`${this.SYNC_STATUS_KEY}_${userId}`);
      return statusJson ? JSON.parse(statusJson) : {};
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {};
    }
  }

  /**
   * Check if user needs data sync
   */
  static async needsSync(userId: string): Promise<boolean> {
    try {
      const status = await this.getSyncStatus(userId);
      
      // Sync if never synced or last sync was more than 24 hours ago
      if (!status.lastSuccessfulSync) {
        return true;
      }

      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      return status.lastSuccessfulSync < twentyFourHoursAgo;
    } catch (error) {
      console.error('Error checking sync needs:', error);
      return true; // Default to needing sync
    }
  }

  /**
   * Force sync user data (useful for troubleshooting)
   */
  static async forceSyncUserData(userId: string): Promise<RecoveryDataSyncResult> {
    console.log('🔄 Force syncing user recovery data...');
    
    // Clear previous sync status
    try {
      await SecureStorage.removeItem(`${this.SYNC_STATUS_KEY}_${userId}`);
    } catch (error) {
      // Ignore errors when clearing
    }

    return await this.syncUserRecoveryData(userId);
  }

  /**
   * Initialize Supabase connection with environment variables
   */
  static async initializeSupabase(): Promise<boolean> {
    try {
      // Get Supabase configuration from environment
      const supabaseUrl = process.env.SUPABASE_URL || 'https://uikrxtokvqelmndkinuc.supabase.co';
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa3J4dG9rdnFlbG1uZGtpbnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.Qs8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase configuration missing from environment');
        return false;
      }

      // Initialize Supabase
      await supabase.initialize({
        url: supabaseUrl,
        anonKey: supabaseAnonKey
      });

      console.log('✅ Supabase initialized for recovery data sync');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Supabase:', error);
      await errorHandler.handle(
        error as Error,
        { context: 'initialize_supabase_for_sync' },
        ErrorSeverity.HIGH
      );
      return false;
    }
  }
}