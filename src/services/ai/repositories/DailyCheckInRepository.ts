/**
 * Daily Check-in Repository
 * Handles CRUD operations for daily check-in data
 */
import { BaseRepository } from './BaseRepository';
import { DailyCheckIn, TriggerEvent } from '../types';

export interface DailyCheckInInsert {
  user_id: string;
  date: string;
  mood_rating: number;
  energy_level: number;
  stress_level: number;
  sleep_quality: number;
  trigger_events?: TriggerEvent[];
  coping_strategies_used?: string[];
  focus_sessions_completed?: number;
  productive_hours?: number;
  notes?: string;
  ai_coach_interactions?: number;
  reflection_completed?: boolean;
  gratitude_entries?: string[];
}

export interface DailyCheckInUpdate {
  mood_rating?: number;
  energy_level?: number;
  stress_level?: number;
  sleep_quality?: number;
  trigger_events?: TriggerEvent[];
  coping_strategies_used?: string[];
  focus_sessions_completed?: number;
  productive_hours?: number;
  notes?: string;
  ai_coach_interactions?: number;
  reflection_completed?: boolean;
  gratitude_entries?: string[];
}

class DailyCheckInRepository extends BaseRepository<
  DailyCheckIn,
  DailyCheckInInsert,
  DailyCheckInUpdate
> {
  protected tableName = 'daily_check_ins';

  /**
   * Find check-in by user ID and date
   */
  async findByUserIdAndDate(userId: string, date: string): Promise<DailyCheckIn | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No check-in found
        }
        throw this.createRepositoryError(error);
      }

      return data as DailyCheckIn;
    } catch (error) {
      console.error('Error finding check-in by user ID and date:', error);
      throw error;
    }
  }

  /**
   * Get recent check-ins for user
   */
  async getRecentCheckIns(userId: string, days: number = 30): Promise<DailyCheckIn[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) {
        throw this.createRepositoryError(error);
      }

      return (data as DailyCheckIn[]) || [];
    } catch (error) {
      console.error('Error getting recent check-ins:', error);
      throw error;
    }
  }

  /**
   * Create check-in with validation
   */
  async create(data: DailyCheckInInsert): Promise<DailyCheckIn> {
    try {
      // Validate required fields
      this.validateRequired(data, [
        'user_id',
        'date',
        'mood_rating',
        'energy_level',
        'stress_level',
        'sleep_quality',
      ]);

      // Validate rating ranges (1-10)
      const ratings = ['mood_rating', 'energy_level', 'stress_level', 'sleep_quality'];
      ratings.forEach(rating => {
        const value = data[rating as keyof DailyCheckInInsert] as number;
        if (value < 1 || value > 10) {
          throw {
            code: 'VALIDATION_ERROR',
            message: `${rating} must be between 1 and 10`,
            details: { field: rating, value },
          };
        }
      });

      // Validate data types
      this.validateTypes(data, {
        user_id: 'string',
        date: 'string',
        mood_rating: 'number',
        energy_level: 'number',
        stress_level: 'number',
        sleep_quality: 'number',
        focus_sessions_completed: 'number',
        productive_hours: 'number',
        ai_coach_interactions: 'number',
        reflection_completed: 'boolean',
      });

      // Sanitize and set defaults
      const sanitizedData = this.sanitizeData({
        ...data,
        trigger_events: data.trigger_events || [],
        coping_strategies_used: data.coping_strategies_used || [],
        focus_sessions_completed: data.focus_sessions_completed || 0,
        productive_hours: data.productive_hours || 0,
        ai_coach_interactions: data.ai_coach_interactions || 0,
        reflection_completed: data.reflection_completed || false,
        gratitude_entries: data.gratitude_entries || [],
      });

      return await super.create(sanitizedData);
    } catch (error) {
      console.error('Error creating check-in:', error);
      throw error;
    }
  }

  /**
   * Update or create check-in for today
   */
  async upsertTodayCheckIn(userId: string, data: DailyCheckInUpdate): Promise<DailyCheckIn> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingCheckIn = await this.findByUserIdAndDate(userId, today);

      if (existingCheckIn) {
        const updated = await this.update(existingCheckIn.id, data);
        if (!updated) {
          throw new Error('Failed to update check-in');
        }
        return updated;
      } else {
        const checkInData: DailyCheckInInsert = {
          user_id: userId,
          date: today,
          mood_rating: data.mood_rating || 5,
          energy_level: data.energy_level || 5,
          stress_level: data.stress_level || 5,
          sleep_quality: data.sleep_quality || 5,
          ...data,
        };
        return await this.create(checkInData);
      }
    } catch (error) {
      console.error('Error upserting today check-in:', error);
      throw error;
    }
  }

  /**
   * Add trigger event to check-in
   */
  async addTriggerEvent(userId: string, date: string, triggerEvent: TriggerEvent): Promise<DailyCheckIn | null> {
    try {
      const checkIn = await this.findByUserIdAndDate(userId, date);
      if (!checkIn) {
        throw new Error('Check-in not found for date');
      }

      const currentEvents = checkIn.trigger_events || [];
      const updatedEvents = [...currentEvents, triggerEvent];

      return await this.update(checkIn.id, { trigger_events: updatedEvents });
    } catch (error) {
      console.error('Error adding trigger event:', error);
      throw error;
    }
  }

  /**
   * Add coping strategy used
   */
  async addCopingStrategyUsed(userId: string, date: string, strategy: string): Promise<DailyCheckIn | null> {
    try {
      const checkIn = await this.findByUserIdAndDate(userId, date);
      if (!checkIn) {
        throw new Error('Check-in not found for date');
      }

      const currentStrategies = checkIn.coping_strategies_used || [];
      if (!currentStrategies.includes(strategy)) {
        const updatedStrategies = [...currentStrategies, strategy];
        return await this.update(checkIn.id, { coping_strategies_used: updatedStrategies });
      }

      return checkIn;
    } catch (error) {
      console.error('Error adding coping strategy used:', error);
      throw error;
    }
  }

  /**
   * Increment AI coach interactions
   */
  async incrementAIInteractions(userId: string, date: string): Promise<DailyCheckIn | null> {
    try {
      const checkIn = await this.findByUserIdAndDate(userId, date);
      if (!checkIn) {
        // Create a basic check-in if it doesn't exist
        const basicCheckIn: DailyCheckInInsert = {
          user_id: userId,
          date,
          mood_rating: 5,
          energy_level: 5,
          stress_level: 5,
          sleep_quality: 5,
          ai_coach_interactions: 1,
        };
        return await this.create(basicCheckIn);
      }

      const currentCount = checkIn.ai_coach_interactions || 0;
      return await this.update(checkIn.id, { ai_coach_interactions: currentCount + 1 });
    } catch (error) {
      console.error('Error incrementing AI interactions:', error);
      throw error;
    }
  }

  /**
   * Get mood trends for user
   */
  async getMoodTrends(userId: string, days: number = 30): Promise<Array<{ date: string; mood_rating: number }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('date, mood_rating')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        throw this.createRepositoryError(error);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting mood trends:', error);
      throw error;
    }
  }

  /**
   * Get average ratings for user over period
   */
  async getAverageRatings(userId: string, days: number = 30): Promise<{
    mood: number;
    energy: number;
    stress: number;
    sleep: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.client
        .from(this.tableName)
        .select('mood_rating, energy_level, stress_level, sleep_quality')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0]);

      if (error) {
        throw this.createRepositoryError(error);
      }

      if (!data || data.length === 0) {
        return { mood: 0, energy: 0, stress: 0, sleep: 0 };
      }

      const totals = data.reduce(
        (acc, checkIn) => ({
          mood: acc.mood + checkIn.mood_rating,
          energy: acc.energy + checkIn.energy_level,
          stress: acc.stress + checkIn.stress_level,
          sleep: acc.sleep + checkIn.sleep_quality,
        }),
        { mood: 0, energy: 0, stress: 0, sleep: 0 }
      );

      const count = data.length;
      return {
        mood: Math.round((totals.mood / count) * 10) / 10,
        energy: Math.round((totals.energy / count) * 10) / 10,
        stress: Math.round((totals.stress / count) * 10) / 10,
        sleep: Math.round((totals.sleep / count) * 10) / 10,
      };
    } catch (error) {
      console.error('Error getting average ratings:', error);
      throw error;
    }
  }

  /**
   * Get check-in streak (consecutive days with check-ins)
   */
  async getCheckInStreak(userId: string): Promise<number> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(365); // Check last year

      if (error) {
        throw this.createRepositoryError(error);
      }

      if (!data || data.length === 0) {
        return 0;
      }

      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < data.length; i++) {
        const checkInDate = new Date(data[i].date);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        
        // Check if check-in date matches expected consecutive date
        if (checkInDate.toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error getting check-in streak:', error);
      throw error;
    }
  }

  /**
   * Get most common triggers for user
   */
  async getMostCommonTriggers(userId: string, days: number = 30): Promise<Array<{ trigger: string; count: number }>> {
    try {
      const checkIns = await this.getRecentCheckIns(userId, days);
      const triggerCounts: Record<string, number> = {};

      checkIns.forEach(checkIn => {
        if (checkIn.trigger_events) {
          checkIn.trigger_events.forEach(event => {
            triggerCounts[event.type] = (triggerCounts[event.type] || 0) + 1;
          });
        }
      });

      return Object.entries(triggerCounts)
        .map(([trigger, count]) => ({ trigger, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error getting most common triggers:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dailyCheckInRepository = new DailyCheckInRepository();