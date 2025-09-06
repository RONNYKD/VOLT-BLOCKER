/**
 * User Recovery Profile Repository
 * Handles CRUD operations for user recovery profiles
 */
import { BaseRepository } from './BaseRepository';
import { UserRecoveryProfile, RecoveryStage, TriggerType } from '../types';

export interface UserRecoveryProfileInsert {
  user_id: string;
  recovery_start_date: string;
  current_stage?: RecoveryStage;
  days_since_last_setback?: number;
  total_recovery_days?: number;
  personal_triggers?: TriggerType[];
  coping_strategies?: string[];
  support_contacts?: string[];
  recovery_goals?: string[];
  privacy_settings?: any;
  ai_coaching_enabled?: boolean;
  crisis_intervention_enabled?: boolean;
  milestone_notifications_enabled?: boolean;
}

export interface UserRecoveryProfileUpdate {
  current_stage?: RecoveryStage;
  days_since_last_setback?: number;
  total_recovery_days?: number;
  personal_triggers?: TriggerType[];
  coping_strategies?: string[];
  support_contacts?: string[];
  recovery_goals?: string[];
  privacy_settings?: any;
  ai_coaching_enabled?: boolean;
  crisis_intervention_enabled?: boolean;
  milestone_notifications_enabled?: boolean;
}

class UserRecoveryProfileRepository extends BaseRepository<
  UserRecoveryProfile,
  UserRecoveryProfileInsert,
  UserRecoveryProfileUpdate
> {
  protected tableName = 'user_recovery_profiles';

  /**
   * Find recovery profile by user ID
   */
  async findByUserId(userId: string): Promise<UserRecoveryProfile | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No profile found
        }
        throw this.createRepositoryError(error);
      }

      return data as UserRecoveryProfile;
    } catch (error) {
      console.error('Error finding recovery profile by user ID:', error);
      throw error;
    }
  }

  /**
   * Create recovery profile with validation
   */
  async create(data: UserRecoveryProfileInsert): Promise<UserRecoveryProfile> {
    try {
      // Validate required fields
      this.validateRequired(data, ['user_id', 'recovery_start_date']);

      // Validate data types
      this.validateTypes(data, {
        user_id: 'string',
        recovery_start_date: 'string',
        days_since_last_setback: 'number',
        total_recovery_days: 'number',
        ai_coaching_enabled: 'boolean',
        crisis_intervention_enabled: 'boolean',
        milestone_notifications_enabled: 'boolean',
      });

      // Sanitize and set defaults
      const sanitizedData = this.sanitizeData({
        ...data,
        current_stage: data.current_stage || 'early',
        days_since_last_setback: data.days_since_last_setback || 0,
        total_recovery_days: data.total_recovery_days || 0,
        personal_triggers: data.personal_triggers || [],
        coping_strategies: data.coping_strategies || [],
        support_contacts: data.support_contacts || [],
        recovery_goals: data.recovery_goals || [],
        privacy_settings: data.privacy_settings || {
          share_progress_anonymously: false,
          allow_ai_analysis: true,
          data_retention_days: 365,
          emergency_contact_access: true,
        },
        ai_coaching_enabled: data.ai_coaching_enabled !== false,
        crisis_intervention_enabled: data.crisis_intervention_enabled !== false,
        milestone_notifications_enabled: data.milestone_notifications_enabled !== false,
      });

      return await super.create(sanitizedData);
    } catch (error) {
      console.error('Error creating recovery profile:', error);
      throw error;
    }
  }

  /**
   * Update recovery progress (days since setback, total days, stage)
   */
  async updateProgress(
    userId: string,
    daysSinceSetback: number,
    totalDays: number,
    stage?: RecoveryStage
  ): Promise<UserRecoveryProfile | null> {
    try {
      const updateData: UserRecoveryProfileUpdate = {
        days_since_last_setback: daysSinceSetback,
        total_recovery_days: totalDays,
      };

      if (stage) {
        updateData.current_stage = stage;
      }

      const profile = await this.findByUserId(userId);
      if (!profile) {
        throw new Error('Recovery profile not found');
      }

      return await this.update(profile.id, updateData);
    } catch (error) {
      console.error('Error updating recovery progress:', error);
      throw error;
    }
  }

  /**
   * Add trigger to personal triggers list
   */
  async addPersonalTrigger(userId: string, trigger: TriggerType): Promise<UserRecoveryProfile | null> {
    try {
      const profile = await this.findByUserId(userId);
      if (!profile) {
        throw new Error('Recovery profile not found');
      }

      const currentTriggers = profile.personal_triggers || [];
      if (!currentTriggers.includes(trigger)) {
        const updatedTriggers = [...currentTriggers, trigger];
        return await this.update(profile.id, { personal_triggers: updatedTriggers });
      }

      return profile;
    } catch (error) {
      console.error('Error adding personal trigger:', error);
      throw error;
    }
  }

  /**
   * Remove trigger from personal triggers list
   */
  async removePersonalTrigger(userId: string, trigger: TriggerType): Promise<UserRecoveryProfile | null> {
    try {
      const profile = await this.findByUserId(userId);
      if (!profile) {
        throw new Error('Recovery profile not found');
      }

      const currentTriggers = profile.personal_triggers || [];
      const updatedTriggers = currentTriggers.filter(t => t !== trigger);
      
      return await this.update(profile.id, { personal_triggers: updatedTriggers });
    } catch (error) {
      console.error('Error removing personal trigger:', error);
      throw error;
    }
  }

  /**
   * Update coping strategies
   */
  async updateCopingStrategies(userId: string, strategies: string[]): Promise<UserRecoveryProfile | null> {
    try {
      const profile = await this.findByUserId(userId);
      if (!profile) {
        throw new Error('Recovery profile not found');
      }

      return await this.update(profile.id, { coping_strategies: strategies });
    } catch (error) {
      console.error('Error updating coping strategies:', error);
      throw error;
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(userId: string, privacySettings: any): Promise<UserRecoveryProfile | null> {
    try {
      const profile = await this.findByUserId(userId);
      if (!profile) {
        throw new Error('Recovery profile not found');
      }

      const currentSettings = profile.privacy_settings || {};
      const updatedSettings = { ...currentSettings, ...privacySettings };

      return await this.update(profile.id, { privacy_settings: updatedSettings });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  /**
   * Toggle AI features
   */
  async toggleAIFeature(
    userId: string,
    feature: 'ai_coaching_enabled' | 'crisis_intervention_enabled' | 'milestone_notifications_enabled',
    enabled: boolean
  ): Promise<UserRecoveryProfile | null> {
    try {
      const profile = await this.findByUserId(userId);
      if (!profile) {
        throw new Error('Recovery profile not found');
      }

      return await this.update(profile.id, { [feature]: enabled });
    } catch (error) {
      console.error('Error toggling AI feature:', error);
      throw error;
    }
  }

  /**
   * Get recovery statistics for user
   */
  async getRecoveryStats(userId: string): Promise<any> {
    try {
      const { data, error } = await this.client
        .from('recovery_statistics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No stats found
        }
        throw this.createRepositoryError(error);
      }

      return data;
    } catch (error) {
      console.error('Error getting recovery stats:', error);
      throw error;
    }
  }

  /**
   * Check if user has recovery profile
   */
  async hasProfile(userId: string): Promise<boolean> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        throw this.createRepositoryError(error);
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking if user has profile:', error);
      throw error;
    }
  }

  /**
   * Get users by recovery stage (for analytics, anonymized)
   */
  async getUsersByStage(stage: RecoveryStage): Promise<number> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('current_stage', stage);

      if (error) {
        throw this.createRepositoryError(error);
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting users by stage:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userRecoveryProfileRepository = new UserRecoveryProfileRepository();