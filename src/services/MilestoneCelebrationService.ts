import { SecureStorage } from './secure-storage';

interface Milestone {
  id: string;
  userId: string;
  type: 'duration' | 'apps_blocked' | 'websites_blocked' | 'sessions_completed';
  target: number;
  current: number;
  achieved: boolean;
  achievedAt?: number;
  createdAt: number;
}

export class MilestoneCelebrationService {
  private static readonly STORAGE_KEY_PREFIX = 'milestone_';

  static async createMilestone(userId: string, type: Milestone['type'], target: number): Promise<Milestone> {
    const milestone: Milestone = {
      id: `${type}_${Date.now()}`,
      userId,
      type,
      target,
      current: 0,
      achieved: false,
      createdAt: Date.now()
    };

    await this.saveMilestone(milestone);
    return milestone;
  }

  static async updateProgress(userId: string, type: Milestone['type'], progress: number): Promise<void> {
    try {
      const milestones = await this.getUserMilestones(userId);
      const activeMilestone = milestones.find(m => m.type === type && !m.achieved);
      
      if (activeMilestone) {
        activeMilestone.current = progress;
        if (progress >= activeMilestone.target && !activeMilestone.achieved) {
          activeMilestone.achieved = true;
          activeMilestone.achievedAt = Date.now();
          await this.celebrateMilestone(activeMilestone);
        }
        await this.saveMilestone(activeMilestone);
      }
    } catch (error) {
      console.error('Error updating milestone progress:', error);
    }
  }

  static async getUserMilestones(userId: string): Promise<Milestone[]> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}${userId}`;
      const storedData = await SecureStorage.getItem(key);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Error getting user milestones:', error);
      return [];
    }
  }

  static async getUpcomingMilestones(userId: string): Promise<Milestone[]> {
    try {
      const milestones = await this.getUserMilestones(userId);
      return milestones.filter(m => !m.achieved).sort((a, b) => {
        const aProgress = a.current / a.target;
        const bProgress = b.current / b.target;
        return bProgress - aProgress;
      });
    } catch (error) {
      console.error('Error getting upcoming milestones:', error);
      return [];
    }
  }

  private static async saveMilestone(milestone: Milestone): Promise<void> {
    try {
      const milestones = await this.getUserMilestones(milestone.userId);
      const index = milestones.findIndex(m => m.id === milestone.id);
      
      if (index >= 0) {
        milestones[index] = milestone;
      } else {
        milestones.push(milestone);
      }
      
      const key = `${this.STORAGE_KEY_PREFIX}${milestone.userId}`;
      await SecureStorage.setItem(key, JSON.stringify(milestones));
    } catch (error) {
      console.error('Error saving milestone:', error);
      throw error;
    }
  }

  private static async celebrateMilestone(milestone: Milestone): Promise<void> {
    // Implement celebration logic (notifications, animations, etc.)
    console.log(`🎉 Milestone achieved! ${milestone.type} target: ${milestone.target}`);
  }
}
