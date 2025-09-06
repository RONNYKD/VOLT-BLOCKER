/**
 * Milestone Celebration Service - Automated milestone detection and celebration
 * Provides personalized recognition, achievements, and motivational workflows
 */
import { milestoneRepository } from '../repositories/MilestoneRepository';
import { userRecoveryProfileRepository } from '../repositories/UserRecoveryProfileRepository';
import { dailyCheckInRepository } from '../repositories/DailyCheckInRepository';
import { personalizationEngine } from './PersonalizationEngine';
import { recoveryCoachManager } from './RecoveryCoachManager';
import { recoveryStageTracker } from './RecoveryStageTracker';
import { RecoveryStage, MilestoneType } from '../types';

export interface MilestoneDetection {
  userId: string;
  milestoneType: MilestoneType;
  milestone: MilestoneAchievement;
  isNewAchievement: boolean;
  celebrationLevel: 'small' | 'medium' | 'major' | 'epic';
  detectedAt: Date;
}

export interface MilestoneAchievement {
  id: string;
  title: string;
  description: string;
  category: 'time_based' | 'behavioral' | 'personal_growth' | 'community' | 'milestone_chain';
  value: number;
  unit: 'days' | 'weeks' | 'months' | 'count' | 'percentage';
  badges: string[];
  shareMessage?: string;
  nextMilestone?: {
    title: string;
    target: number;
    encouragement: string;
  };
}

export interface CelebrationWorkflow {
  celebrationId: string;
  userId: string;
  milestone: MilestoneAchievement;
  celebrationLevel: 'small' | 'medium' | 'major' | 'epic';
  personalizedMessage: string;
  visualElements: VisualCelebration;
  notifications: NotificationSchedule[];
  sharingOptions: SharingOption[];
  followUpActions: FollowUpAction[];
  executedAt: Date;
}

export interface VisualCelebration {
  celebrationType: 'badge_unlock' | 'progress_ring' | 'confetti' | 'achievement_banner' | 'fireworks';
  colors: string[];
  animations: string[];
  duration: number; // milliseconds
  sounds?: string[];
}

export interface NotificationSchedule {
  type: 'immediate' | 'daily_reminder' | 'weekly_review' | 'monthly_reflection';
  title: string;
  body: string;
  scheduledFor: Date;
  delivered: boolean;
  metadata?: any;
}

export interface SharingOption {
  platform: 'internal' | 'social' | 'family' | 'support_group';
  message: string;
  privacyLevel: 'anonymous' | 'first_name' | 'full_disclosure';
  enabled: boolean;
}

export interface FollowUpAction {
  action: 'set_new_goal' | 'increase_difficulty' | 'extend_streak' | 'unlock_feature' | 'offer_mentorship';
  title: string;
  description: string;
  dueDate?: Date;
  completed: boolean;
}

export interface MilestonePattern {
  type: MilestoneType;
  detectionRules: DetectionRule[];
  celebrationConfig: CelebrationConfig;
}

export interface DetectionRule {
  metric: string;
  operator: '>=' | '<=' | '==' | '>' | '<';
  threshold: number;
  timeWindow?: number; // days
  prerequisites?: string[];
}

export interface CelebrationConfig {
  level: 'small' | 'medium' | 'major' | 'epic';
  visualTheme: string;
  messageTemplate: string;
  badgeUnlocks: string[];
  notificationSchedule: string[];
}

class MilestoneCelebrationService {
  private milestonePatterns: Map<MilestoneType, MilestonePattern[]> = new Map();
  private celebrationHistory: Map<string, CelebrationWorkflow[]> = new Map();

  constructor() {
    this.initializeMilestonePatterns();
  }

  /**
   * Detect and celebrate new milestones for a user
   */
  async detectAndCelebrateMilestones(userId: string): Promise<MilestoneDetection[]> {
    try {
      console.log('🎯 Detecting milestones for user');

      const detections: MilestoneDetection[] = [];
      
      // Get user data for milestone evaluation
      const profile = await userRecoveryProfileRepository.findByUserId(userId);
      const recentCheckIns = await dailyCheckInRepository.getRecentCheckIns(userId, 30);
      const existingMilestones = await milestoneRepository.getUserMilestones(userId);
      
      if (!profile) {
        console.warn('No recovery profile found for milestone detection');
        return detections;
      }

      // Check each milestone pattern type
      for (const [milestoneType, patterns] of this.milestonePatterns.entries()) {
        for (const pattern of patterns) {
          const detection = await this.evaluateMilestonePattern(
            userId,
            milestoneType,
            pattern,
            profile,
            recentCheckIns,
            existingMilestones
          );

          if (detection) {
            detections.push(detection);
            
            // Execute celebration workflow if it's a new achievement
            if (detection.isNewAchievement) {
              await this.executeCelebrationWorkflow(detection);
            }
          }
        }
      }

      console.log(`Found ${detections.length} milestone detections`);
      return detections;
    } catch (error) {
      console.error('Milestone Celebration Service: Error detecting milestones:', error);
      return [];
    }
  }

  /**
   * Execute celebration workflow for a milestone achievement
   */
  private async executeCelebrationWorkflow(detection: MilestoneDetection): Promise<CelebrationWorkflow> {
    try {
      console.log(`🎉 Executing celebration for ${detection.milestone.title}`);

      // Generate personalized celebration message
      const personalizedMessage = await personalizationEngine.personalizeContent(
        detection.userId,
        this.generateBaseCelebrationMessage(detection.milestone),
        'motivational_boost',
        {
          milestoneType: detection.milestoneType,
          celebrationLevel: detection.celebrationLevel,
          achievement: detection.milestone,
        }
      );

      // Create visual celebration elements
      const visualElements = this.createVisualCelebration(detection.celebrationLevel, detection.milestone);

      // Schedule notifications
      const notifications = await this.scheduleNotifications(detection);

      // Generate sharing options
      const sharingOptions = this.createSharingOptions(detection.milestone);

      // Create follow-up actions
      const followUpActions = await this.createFollowUpActions(detection);

      const celebration: CelebrationWorkflow = {
        celebrationId: this.generateCelebrationId(),
        userId: detection.userId,
        milestone: detection.milestone,
        celebrationLevel: detection.celebrationLevel,
        personalizedMessage: personalizedMessage.content,
        visualElements,
        notifications,
        sharingOptions,
        followUpActions,
        executedAt: new Date(),
      };

      // Store celebration in history
      this.storeCelebrationWorkflow(celebration);

      // Trigger immediate celebration UI
      await this.triggerImmediateCelebration(celebration);

      console.log(`Celebration workflow executed: ${celebration.celebrationId}`);
      return celebration;
    } catch (error) {
      console.error('Milestone Celebration Service: Error executing celebration:', error);
      throw error;
    }
  }

  /**
   * Evaluate if a milestone pattern matches user's current state
   */
  private async evaluateMilestonePattern(
    userId: string,
    milestoneType: MilestoneType,
    pattern: MilestonePattern,
    profile: any,
    recentCheckIns: any[],
    existingMilestones: any[]
  ): Promise<MilestoneDetection | null> {
    try {
      // Check if user already has this specific milestone
      const existingMilestone = existingMilestones.find(m => 
        m.milestone_type === milestoneType && m.title === pattern.celebrationConfig.messageTemplate
      );

      // Evaluate all detection rules
      let allRulesPassed = true;
      let milestoneValue = 0;

      for (const rule of pattern.detectionRules) {
        const ruleResult = this.evaluateDetectionRule(rule, profile, recentCheckIns);
        
        if (!ruleResult.passed) {
          allRulesPassed = false;
          break;
        }
        
        milestoneValue = Math.max(milestoneValue, ruleResult.value);
      }

      if (!allRulesPassed) {
        return null;
      }

      // Check prerequisites if any
      if (pattern.detectionRules.some(r => r.prerequisites)) {
        const prereqsMet = await this.checkPrerequisites(
          userId,
          pattern.detectionRules.flatMap(r => r.prerequisites || [])
        );
        
        if (!prereqsMet) {
          return null;
        }
      }

      // Create milestone achievement
      const milestone = await this.createMilestoneAchievement(
        milestoneType,
        pattern,
        milestoneValue,
        profile
      );

      return {
        userId,
        milestoneType,
        milestone,
        isNewAchievement: !existingMilestone,
        celebrationLevel: pattern.celebrationConfig.level,
        detectedAt: new Date(),
      };
    } catch (error) {
      console.error('Error evaluating milestone pattern:', error);
      return null;
    }
  }

  /**
   * Evaluate individual detection rule
   */
  private evaluateDetectionRule(rule: DetectionRule, profile: any, recentCheckIns: any[]): {
    passed: boolean;
    value: number;
  } {
    let value = 0;
    let passed = false;

    switch (rule.metric) {
      case 'days_since_setback':
        value = profile.days_since_last_setback || 0;
        break;
      case 'total_recovery_days':
        value = profile.total_recovery_days || 0;
        break;
      case 'consecutive_checkins':
        value = this.calculateConsecutiveCheckIns(recentCheckIns);
        break;
      case 'average_mood':
        value = this.calculateAverageMood(recentCheckIns, rule.timeWindow);
        break;
      case 'stress_improvement':
        value = this.calculateStressImprovement(recentCheckIns, rule.timeWindow);
        break;
      case 'coping_strategy_usage':
        value = this.calculateCopingStrategyUsage(recentCheckIns, rule.timeWindow);
        break;
      case 'milestone_count':
        // This would need to be passed in as a parameter
        value = 0; // Placeholder
        break;
      default:
        console.warn(`Unknown metric: ${rule.metric}`);
        return { passed: false, value: 0 };
    }

    // Evaluate the rule condition
    switch (rule.operator) {
      case '>=':
        passed = value >= rule.threshold;
        break;
      case '<=':
        passed = value <= rule.threshold;
        break;
      case '==':
        passed = value === rule.threshold;
        break;
      case '>':
        passed = value > rule.threshold;
        break;
      case '<':
        passed = value < rule.threshold;
        break;
    }

    return { passed, value };
  }

  /**
   * Create milestone achievement object
   */
  private async createMilestoneAchievement(
    milestoneType: MilestoneType,
    pattern: MilestonePattern,
    value: number,
    profile: any
  ): Promise<MilestoneAchievement> {
    const milestoneTemplates = {
      'time_based': {
        7: { title: 'First Week Strong!', description: 'You\'ve completed your first week of recovery. This is a huge step forward!', unit: 'days' },
        14: { title: '2 Weeks Champion!', description: 'Two weeks of dedication and strength. You\'re building real momentum!', unit: 'days' },
        30: { title: 'Month Warrior!', description: 'One month of recovery - you\'ve shown incredible resilience!', unit: 'days' },
        90: { title: 'Quarter Master!', description: 'Three months of consistent recovery. You\'re a true champion!', unit: 'days' },
        180: { title: 'Half Year Hero!', description: 'Six months of recovery - you\'re an inspiration to others!', unit: 'days' },
        365: { title: 'Annual Legend!', description: 'One full year of recovery. You\'ve achieved something extraordinary!', unit: 'days' }
      },
      'behavioral': {
        7: { title: 'Check-in Champion!', description: 'Seven consecutive daily check-ins completed!', unit: 'count' },
        14: { title: 'Consistency King!', description: 'Two weeks of perfect check-in consistency!', unit: 'count' },
        30: { title: 'Dedication Master!', description: 'One month of unwavering commitment to daily check-ins!', unit: 'count' }
      },
      'personal_growth': {
        5: { title: 'Self-Awareness Rising!', description: 'Completed five deep reflection sessions!', unit: 'count' },
        10: { title: 'Mindfulness Master!', description: 'Ten reflection sessions completed - true self-awareness!', unit: 'count' },
        8: { title: 'Stress Slayer!', description: 'Maintained excellent mood levels for over a week!', unit: 'average' }
      }
    };

    const template = milestoneTemplates[milestoneType]?.[value] || {
      title: `${milestoneType} Achievement`,
      description: `Reached ${value} in ${milestoneType}`,
      unit: 'count'
    };

    const achievement: MilestoneAchievement = {
      id: this.generateMilestoneId(),
      title: template.title,
      description: template.description,
      category: milestoneType,
      value,
      unit: template.unit as any,
      badges: pattern.celebrationConfig.badgeUnlocks,
      shareMessage: this.generateShareMessage(template.title, value, template.unit),
    };

    // Add next milestone if applicable
    const nextMilestoneValue = this.getNextMilestoneValue(milestoneType, value);
    if (nextMilestoneValue) {
      const nextTemplate = milestoneTemplates[milestoneType]?.[nextMilestoneValue];
      if (nextTemplate) {
        achievement.nextMilestone = {
          title: nextTemplate.title,
          target: nextMilestoneValue,
          encouragement: `You're ${value} ${template.unit} strong! Your next milestone is just ${nextMilestoneValue - value} ${template.unit} away.`,
        };
      }
    }

    // Save milestone to repository
    await milestoneRepository.createMilestone({
      user_id: profile.user_id,
      milestone_type: milestoneType,
      title: achievement.title,
      description: achievement.description,
      value: achievement.value,
      unit: achievement.unit,
    });

    return achievement;
  }

  /**
   * Initialize default milestone patterns
   */
  private initializeMilestonePatterns(): void {
    // Time-based milestones
    const timeBasedPatterns: MilestonePattern[] = [
      {
        type: 'time_based',
        detectionRules: [
          {
            metric: 'days_since_setback',
            operator: '>=',
            threshold: 7,
          }
        ],
        celebrationConfig: {
          level: 'medium',
          visualTheme: 'success_green',
          messageTemplate: 'First Week Strong!',
          badgeUnlocks: ['week_warrior'],
          notificationSchedule: ['immediate', 'daily_reminder'],
        }
      },
      {
        type: 'time_based',
        detectionRules: [
          {
            metric: 'days_since_setback',
            operator: '>=',
            threshold: 30,
          }
        ],
        celebrationConfig: {
          level: 'major',
          visualTheme: 'celebration_gold',
          messageTemplate: 'Month Warrior!',
          badgeUnlocks: ['month_champion', 'consistency_master'],
          notificationSchedule: ['immediate', 'daily_reminder', 'weekly_review'],
        }
      },
      {
        type: 'time_based',
        detectionRules: [
          {
            metric: 'days_since_setback',
            operator: '>=',
            threshold: 90,
          }
        ],
        celebrationConfig: {
          level: 'epic',
          visualTheme: 'victory_royal',
          messageTemplate: 'Quarter Master!',
          badgeUnlocks: ['quarter_champion', 'resilience_master', 'inspiration'],
          notificationSchedule: ['immediate', 'daily_reminder', 'weekly_review', 'monthly_reflection'],
        }
      }
    ];

    // Behavioral milestones
    const behavioralPatterns: MilestonePattern[] = [
      {
        type: 'behavioral',
        detectionRules: [
          {
            metric: 'consecutive_checkins',
            operator: '>=',
            threshold: 7,
          }
        ],
        celebrationConfig: {
          level: 'medium',
          visualTheme: 'consistency_blue',
          messageTemplate: 'Check-in Champion!',
          badgeUnlocks: ['consistency_starter'],
          notificationSchedule: ['immediate'],
        }
      },
      {
        type: 'behavioral',
        detectionRules: [
          {
            metric: 'average_mood',
            operator: '>=',
            threshold: 8,
            timeWindow: 14,
          }
        ],
        celebrationConfig: {
          level: 'major',
          visualTheme: 'happiness_yellow',
          messageTemplate: 'Mood Master!',
          badgeUnlocks: ['mood_champion', 'positivity_expert'],
          notificationSchedule: ['immediate', 'weekly_review'],
        }
      }
    ];

    // Personal growth milestones
    const personalGrowthPatterns: MilestonePattern[] = [
      {
        type: 'personal_growth',
        detectionRules: [
          {
            metric: 'stress_improvement',
            operator: '>=',
            threshold: 2,
            timeWindow: 14,
          }
        ],
        celebrationConfig: {
          level: 'major',
          visualTheme: 'peace_purple',
          messageTemplate: 'Stress Slayer!',
          badgeUnlocks: ['stress_master', 'calm_achiever'],
          notificationSchedule: ['immediate', 'weekly_review'],
        }
      }
    ];

    // Store patterns
    this.milestonePatterns.set('time_based', timeBasedPatterns);
    this.milestonePatterns.set('behavioral', behavioralPatterns);
    this.milestonePatterns.set('personal_growth', personalGrowthPatterns);
  }

  // Helper methods for metric calculations
  private calculateConsecutiveCheckIns(checkIns: any[]): number {
    if (checkIns.length === 0) return 0;

    let consecutive = 0;
    const today = new Date();
    const sortedCheckIns = checkIns.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (let i = 0; i < sortedCheckIns.length; i++) {
      const checkInDate = new Date(sortedCheckIns[i].created_at);
      const expectedDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      
      if (this.isSameDay(checkInDate, expectedDate)) {
        consecutive++;
      } else {
        break;
      }
    }

    return consecutive;
  }

  private calculateAverageMood(checkIns: any[], timeWindow?: number): number {
    const relevantCheckIns = timeWindow 
      ? checkIns.slice(0, timeWindow)
      : checkIns;

    if (relevantCheckIns.length === 0) return 0;

    const moodSum = relevantCheckIns.reduce((sum, c) => sum + (c.mood_rating || 5), 0);
    return moodSum / relevantCheckIns.length;
  }

  private calculateStressImprovement(checkIns: any[], timeWindow?: number): number {
    const relevantCheckIns = timeWindow 
      ? checkIns.slice(0, timeWindow)
      : checkIns;

    if (relevantCheckIns.length < 2) return 0;

    const recentStress = relevantCheckIns.slice(0, Math.ceil(relevantCheckIns.length / 2))
      .reduce((sum, c) => sum + (c.stress_level || 5), 0) / Math.ceil(relevantCheckIns.length / 2);

    const olderStress = relevantCheckIns.slice(Math.ceil(relevantCheckIns.length / 2))
      .reduce((sum, c) => sum + (c.stress_level || 5), 0) / Math.floor(relevantCheckIns.length / 2);

    // Return improvement (older stress - recent stress, so positive = improvement)
    return olderStress - recentStress;
  }

  private calculateCopingStrategyUsage(checkIns: any[], timeWindow?: number): number {
    const relevantCheckIns = timeWindow 
      ? checkIns.slice(0, timeWindow)
      : checkIns;

    if (relevantCheckIns.length === 0) return 0;

    const usageCount = relevantCheckIns.filter(c => 
      c.coping_strategies_used && c.coping_strategies_used.length > 0
    ).length;

    return (usageCount / relevantCheckIns.length) * 100; // Return as percentage
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private async checkPrerequisites(userId: string, prerequisites: string[]): Promise<boolean> {
    // Implementation would check if user has achieved prerequisite milestones
    // For now, return true
    return true;
  }

  private generateBaseCelebrationMessage(milestone: MilestoneAchievement): string {
    return `🎉 ${milestone.title}\n\n${milestone.description}\n\nYou've achieved something amazing - ${milestone.value} ${milestone.unit} of dedication and growth!`;
  }

  private createVisualCelebration(level: string, milestone: MilestoneAchievement): VisualCelebration {
    const celebrationStyles = {
      'small': {
        celebrationType: 'badge_unlock' as const,
        colors: ['#4CAF50', '#8BC34A'],
        animations: ['fadeInUp', 'pulse'],
        duration: 2000,
      },
      'medium': {
        celebrationType: 'progress_ring' as const,
        colors: ['#2196F3', '#03A9F4', '#00BCD4'],
        animations: ['zoomIn', 'rotate', 'bounce'],
        duration: 3000,
      },
      'major': {
        celebrationType: 'confetti' as const,
        colors: ['#FF9800', '#FFC107', '#FFD54F'],
        animations: ['confettiExplosion', 'sparkle', 'celebrate'],
        duration: 4000,
        sounds: ['celebration_fanfare'],
      },
      'epic': {
        celebrationType: 'fireworks' as const,
        colors: ['#9C27B0', '#E91E63', '#F44336', '#FF9800', '#FFEB3B'],
        animations: ['fireworksBurst', 'goldenShower', 'starfall', 'victory'],
        duration: 6000,
        sounds: ['epic_victory', 'fireworks_finale'],
      },
    };

    return celebrationStyles[level] || celebrationStyles['small'];
  }

  private async scheduleNotifications(detection: MilestoneDetection): Promise<NotificationSchedule[]> {
    const notifications: NotificationSchedule[] = [];
    const milestone = detection.milestone;

    // Immediate celebration notification
    notifications.push({
      type: 'immediate',
      title: `🎉 ${milestone.title}`,
      body: milestone.description,
      scheduledFor: new Date(),
      delivered: false,
    });

    // Daily reminder for major milestones
    if (detection.celebrationLevel === 'major' || detection.celebrationLevel === 'epic') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      notifications.push({
        type: 'daily_reminder',
        title: 'Building on Yesterday\'s Success',
        body: `Yesterday you achieved ${milestone.title}. Keep building on this momentum!`,
        scheduledFor: tomorrow,
        delivered: false,
      });
    }

    // Weekly review for epic milestones
    if (detection.celebrationLevel === 'epic') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(10, 0, 0, 0);

      notifications.push({
        type: 'weekly_review',
        title: 'Reflecting on Your Achievement',
        body: `It's been a week since your incredible ${milestone.title} achievement. How has this milestone impacted your journey?`,
        scheduledFor: nextWeek,
        delivered: false,
      });
    }

    return notifications;
  }

  private createSharingOptions(milestone: MilestoneAchievement): SharingOption[] {
    return [
      {
        platform: 'internal',
        message: `Just achieved: ${milestone.title}! ${milestone.shareMessage}`,
        privacyLevel: 'first_name',
        enabled: true,
      },
      {
        platform: 'family',
        message: `I wanted to share some good news - I've reached an important milestone in my recovery journey: ${milestone.title}. Thank you for your support! 💙`,
        privacyLevel: 'full_disclosure',
        enabled: false, // User can enable if desired
      },
      {
        platform: 'support_group',
        message: `Celebrating ${milestone.value} ${milestone.unit} of progress! ${milestone.title} - grateful for this community's support. 🙏`,
        privacyLevel: 'anonymous',
        enabled: false,
      },
    ];
  }

  private async createFollowUpActions(detection: MilestoneDetection): Promise<FollowUpAction[]> {
    const actions: FollowUpAction[] = [];
    const milestone = detection.milestone;

    // Set new goal based on milestone
    if (milestone.nextMilestone) {
      actions.push({
        action: 'set_new_goal',
        title: `Aim for ${milestone.nextMilestone.title}`,
        description: milestone.nextMilestone.encouragement,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        completed: false,
      });
    }

    // Offer mentorship for major achievements
    if (detection.celebrationLevel === 'major' || detection.celebrationLevel === 'epic') {
      actions.push({
        action: 'offer_mentorship',
        title: 'Consider Helping Others',
        description: 'Your achievement shows real strength. Would you like to mentor someone just starting their recovery journey?',
        completed: false,
      });
    }

    // Unlock features for significant milestones
    if (milestone.value >= 30 && milestone.category === 'time_based') {
      actions.push({
        action: 'unlock_feature',
        title: 'Advanced Analytics Unlocked',
        description: 'You\'ve unlocked access to advanced recovery analytics and insights!',
        completed: false,
      });
    }

    return actions;
  }

  private generateShareMessage(title: string, value: number, unit: string): string {
    return `${value} ${unit} of growth and counting! 💪 #RecoveryJourney #PersonalGrowth`;
  }

  private getNextMilestoneValue(milestoneType: MilestoneType, currentValue: number): number | null {
    const nextMilestones = {
      'time_based': [7, 14, 30, 60, 90, 180, 365, 730],
      'behavioral': [7, 14, 30, 60, 90],
      'personal_growth': [5, 10, 15, 20, 30],
    };

    const milestoneList = nextMilestones[milestoneType] || [];
    return milestoneList.find(value => value > currentValue) || null;
  }

  private async triggerImmediateCelebration(celebration: CelebrationWorkflow): Promise<void> {
    // In a full implementation, this would trigger UI animations and sounds
    console.log(`🎊 IMMEDIATE CELEBRATION: ${celebration.milestone.title}`);
    console.log(`🎨 Visual: ${celebration.visualElements.celebrationType}`);
    console.log(`📱 Notification: ${celebration.notifications[0]?.title}`);
    
    // This would integrate with the app's notification system
    // For now, we'll just log the celebration
  }

  private storeCelebrationWorkflow(celebration: CelebrationWorkflow): void {
    const userCelebrations = this.celebrationHistory.get(celebration.userId) || [];
    userCelebrations.push(celebration);
    
    // Keep only last 50 celebrations per user
    if (userCelebrations.length > 50) {
      userCelebrations.splice(0, userCelebrations.length - 50);
    }
    
    this.celebrationHistory.set(celebration.userId, userCelebrations);
  }

  private generateMilestoneId(): string {
    return 'milestone_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private generateCelebrationId(): string {
    return 'celebration_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Get celebration history for a user
   */
  async getCelebrationHistory(userId: string): Promise<CelebrationWorkflow[]> {
    return this.celebrationHistory.get(userId) || [];
  }

  /**
   * Manually trigger celebration for testing
   */
  async triggerManualCelebration(userId: string, milestoneType: MilestoneType): Promise<CelebrationWorkflow | null> {
    try {
      const detections = await this.detectAndCelebrateMilestones(userId);
      const targetDetection = detections.find(d => d.milestoneType === milestoneType && d.isNewAchievement);
      
      if (targetDetection) {
        return await this.executeCelebrationWorkflow(targetDetection);
      }
      
      return null;
    } catch (error) {
      console.error('Error triggering manual celebration:', error);
      return null;
    }
  }

  /**
   * Get upcoming milestones for a user
   */
  async getUpcomingMilestones(userId: string): Promise<{
    milestone: string;
    progress: number;
    target: number;
    daysRemaining?: number;
  }[]> {
    try {
      const profile = await userRecoveryProfileRepository.findByUserId(userId);
      const recentCheckIns = await dailyCheckInRepository.getRecentCheckIns(userId, 30);
      
      if (!profile) return [];

      const upcoming = [];
      
      // Time-based upcoming milestones
      const daysSinceSetback = profile.days_since_last_setback || 0;
      const nextTimeMilestones = [7, 14, 30, 60, 90, 180, 365].filter(days => days > daysSinceSetback);
      
      if (nextTimeMilestones.length > 0) {
        upcoming.push({
          milestone: `${nextTimeMilestones[0]} Day Milestone`,
          progress: daysSinceSetback,
          target: nextTimeMilestones[0],
          daysRemaining: nextTimeMilestones[0] - daysSinceSetback,
        });
      }

      // Behavioral milestones
      const consecutiveCheckIns = this.calculateConsecutiveCheckIns(recentCheckIns);
      const nextCheckInMilestones = [7, 14, 30].filter(count => count > consecutiveCheckIns);
      
      if (nextCheckInMilestones.length > 0) {
        upcoming.push({
          milestone: `${nextCheckInMilestones[0]} Day Check-in Streak`,
          progress: consecutiveCheckIns,
          target: nextCheckInMilestones[0],
        });
      }

      return upcoming.slice(0, 3); // Return top 3 upcoming milestones
    } catch (error) {
      console.error('Error getting upcoming milestones:', error);
      return [];
    }
  }
}

// Export singleton instance
export const milestoneCelebrationService = new MilestoneCelebrationService();
