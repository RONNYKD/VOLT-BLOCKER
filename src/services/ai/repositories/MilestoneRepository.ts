/**
 * Milestone Repository
 * Handles CRUD operations for milestone records
 */
import { BaseRepository } from './BaseRepository';
import { MilestoneRecord, MilestoneType, MilestoneSignificance } from '../types';

export interface MilestoneInsert {
  user_id: string;
  milestone_type: MilestoneType;
  title: string;
  description: string;
  achievement_date: string;
  days_to_achieve: number;
  significance: MilestoneSignificance;
  celebration_content?: string;
  personal_reflection?: string;
  next_goal_set?: string;
  significance_rating?: number;
  shared_anonymously?: boolean;
}

export interface MilestoneUpdate {
  celebration_viewed?: boolean;
  celebration_content?: string;
  personal_reflection?: string;
  next_goal_set?: string;
  significance_rating?: number;
  shared_anonymously?: boolean;
}

class MilestoneRepository extends BaseRepository<
  MilestoneRecord,
  MilestoneInsert,
  MilestoneUpdate
> {
  protected tableName = 'milestone_records';

  /**
   * Create milestone with validation
   */
  async create(data: MilestoneInsert): Promise<MilestoneRecord> {
    try {
      // Validate required fields
      this.validateRequired(data, [
        'user_id',
        'milestone_type',
        'title',
        'description',
        'achievement_date',
        'days_to_achieve',
        'significance',
      ]);

      // Validate data types
      this.validateTypes(data, {
        user_id: 'string',
        milestone_type: 'string',
        title: 'string',
        description: 'string',
        achievement_date: 'string',
        days_to_achieve: 'number',
        significance: 'string',
        significance_rating: 'number',
        shared_anonymously: 'boolean',
      });

      // Validate significance rating if provided
      if (data.significance_rating && (data.significance_rating < 1 || data.significance_rating > 10)) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'Significance rating must be between 1 and 10',
          details: { field: 'significance_rating', value: data.significance_rating },
        };
      }

      // Validate days to achieve
      if (data.days_to_achieve < 0) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'Days to achieve cannot be negative',
          details: { field: 'days_to_achieve', value: data.days_to_achieve },
        };
      }

      // Sanitize and set defaults
      const sanitizedData = this.sanitizeData({
        ...data,
        celebration_viewed: false,
        shared_anonymously: data.shared_anonymously || false,
      });

      return await super.create(sanitizedData);
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  }

  /**
   * Get milestones by type for user
   */
  async getMilestonesByType(userId: string, type: MilestoneType): Promise<MilestoneRecord[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('milestone_type', type)
        .order('achievement_date', { ascending: false });

      if (error) {
        throw this.createRepositoryError(error);
      }

      return (data as MilestoneRecord[]) || [];
    } catch (error) {
      console.error('Error getting milestones by type:', error);
      throw error;
    }
  }

  /**
   * Get recent milestones for user
   */
  async getRecentMilestones(userId: string, limit: number = 10): Promise<MilestoneRecord[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('achievement_date', { ascending: false })
        .limit(limit);

      if (error) {
        throw this.createRepositoryError(error);
      }

      return (data as MilestoneRecord[]) || [];
    } catch (error) {
      console.error('Error getting recent milestones:', error);
      throw error;
    }
  }

  /**
   * Get unviewed celebrations for user
   */
  async getUnviewedCelebrations(userId: string): Promise<MilestoneRecord[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('celebration_viewed', false)
        .order('achievement_date', { ascending: false });

      if (error) {
        throw this.createRepositoryError(error);
      }

      return (data as MilestoneRecord[]) || [];
    } catch (error) {
      console.error('Error getting unviewed celebrations:', error);
      throw error;
    }
  }

  /**
   * Mark celebration as viewed
   */
  async markCelebrationViewed(milestoneId: string): Promise<MilestoneRecord | null> {
    try {
      return await this.update(milestoneId, { celebration_viewed: true });
    } catch (error) {
      console.error('Error marking celebration as viewed:', error);
      throw error;
    }
  }

  /**
   * Add personal reflection to milestone
   */
  async addReflection(milestoneId: string, reflection: string): Promise<MilestoneRecord | null> {
    try {
      return await this.update(milestoneId, { personal_reflection: reflection });
    } catch (error) {
      console.error('Error adding reflection:', error);
      throw error;
    }
  }

  /**
   * Set next goal for milestone
   */
  async setNextGoal(milestoneId: string, nextGoal: string): Promise<MilestoneRecord | null> {
    try {
      return await this.update(milestoneId, { next_goal_set: nextGoal });
    } catch (error) {
      console.error('Error setting next goal:', error);
      throw error;
    }
  }

  /**
   * Rate milestone significance
   */
  async rateMilestone(milestoneId: string, rating: number): Promise<MilestoneRecord | null> {
    try {
      if (rating < 1 || rating > 10) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'Rating must be between 1 and 10',
          details: { rating },
        };
      }

      return await this.update(milestoneId, { significance_rating: rating });
    } catch (error) {
      console.error('Error rating milestone:', error);
      throw error;
    }
  }

  /**
   * Get milestone statistics for user
   */
  async getMilestoneStats(userId: string): Promise<{
    total: number;
    byType: Record<MilestoneType, number>;
    bySignificance: Record<MilestoneSignificance, number>;
    averageRating: number;
    recentCount: number;
  }> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('milestone_type, significance, significance_rating, achievement_date')
        .eq('user_id', userId);

      if (error) {
        throw this.createRepositoryError(error);
      }

      if (!data || data.length === 0) {
        return {
          total: 0,
          byType: { recovery: 0, behavioral: 0, personal_growth: 0, community: 0 },
          bySignificance: { minor: 0, major: 0, major_breakthrough: 0 },
          averageRating: 0,
          recentCount: 0,
        };
      }

      const byType: Record<MilestoneType, number> = {
        recovery: 0,
        behavioral: 0,
        personal_growth: 0,
        community: 0,
      };

      const bySignificance: Record<MilestoneSignificance, number> = {
        minor: 0,
        major: 0,
        major_breakthrough: 0,
      };

      let totalRating = 0;
      let ratedCount = 0;
      let recentCount = 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      data.forEach(milestone => {
        byType[milestone.milestone_type]++;
        bySignificance[milestone.significance]++;

        if (milestone.significance_rating) {
          totalRating += milestone.significance_rating;
          ratedCount++;
        }

        if (new Date(milestone.achievement_date) >= thirtyDaysAgo) {
          recentCount++;
        }
      });

      return {
        total: data.length,
        byType,
        bySignificance,
        averageRating: ratedCount > 0 ? Math.round((totalRating / ratedCount) * 10) / 10 : 0,
        recentCount,
      };
    } catch (error) {
      console.error('Error getting milestone stats:', error);
      throw error;
    }
  }

  /**
   * Check if milestone already exists for user
   */
  async milestoneExists(
    userId: string,
    type: MilestoneType,
    title: string,
    achievementDate: string
  ): Promise<boolean> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('milestone_type', type)
        .eq('title', title)
        .eq('achievement_date', achievementDate);

      if (error) {
        throw this.createRepositoryError(error);
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking if milestone exists:', error);
      throw error;
    }
  }

  /**
   * Get next recovery milestone for user
   */
  async getNextRecoveryMilestone(currentDays: number): Promise<{
    days: number;
    title: string;
    description: string;
  } | null> {
    const recoveryMilestones = [
      { days: 1, title: 'First Day', description: 'Your recovery journey begins with this important first step.' },
      { days: 3, title: '3 Days Strong', description: 'Three days of commitment shows your dedication to change.' },
      { days: 7, title: 'One Week', description: 'A full week of recovery - you\'re building momentum!' },
      { days: 14, title: 'Two Weeks', description: 'Two weeks of progress - your new habits are taking root.' },
      { days: 30, title: 'One Month', description: 'A full month of recovery - a significant achievement!' },
      { days: 60, title: 'Two Months', description: 'Two months of sustained progress - you\'re transforming your life.' },
      { days: 90, title: '90 Days', description: 'Three months of recovery - a major milestone in your journey.' },
      { days: 180, title: 'Six Months', description: 'Half a year of recovery - your commitment is truly inspiring.' },
      { days: 365, title: 'One Year', description: 'A full year of recovery - you\'ve achieved something remarkable!' },
    ];

    const nextMilestone = recoveryMilestones.find(milestone => milestone.days > currentDays);
    return nextMilestone || null;
  }

  /**
   * Create recovery milestone if it doesn't exist
   */
  async createRecoveryMilestone(
    userId: string,
    days: number,
    celebrationContent?: string
  ): Promise<MilestoneRecord | null> {
    try {
      const milestoneInfo = await this.getNextRecoveryMilestone(days - 1);
      if (!milestoneInfo || milestoneInfo.days !== days) {
        return null; // Not a standard recovery milestone
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Check if milestone already exists
      const exists = await this.milestoneExists(userId, 'recovery', milestoneInfo.title, today);
      if (exists) {
        return null;
      }

      // Determine significance based on days
      let significance: MilestoneSignificance = 'minor';
      if (days >= 365) {
        significance = 'major_breakthrough';
      } else if (days >= 30) {
        significance = 'major';
      }

      const milestoneData: MilestoneInsert = {
        user_id: userId,
        milestone_type: 'recovery',
        title: milestoneInfo.title,
        description: milestoneInfo.description,
        achievement_date: today,
        days_to_achieve: days,
        significance,
        celebration_content,
      };

      return await this.create(milestoneData);
    } catch (error) {
      console.error('Error creating recovery milestone:', error);
      throw error;
    }
  }

  /**
   * Get milestones for date range
   */
  async getMilestonesInDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<MilestoneRecord[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .gte('achievement_date', startDate)
        .lte('achievement_date', endDate)
        .order('achievement_date', { ascending: true });

      if (error) {
        throw this.createRepositoryError(error);
      }

      return (data as MilestoneRecord[]) || [];
    } catch (error) {
      console.error('Error getting milestones in date range:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const milestoneRepository = new MilestoneRepository();