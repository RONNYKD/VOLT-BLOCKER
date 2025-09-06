/**
 * Recovery Stage Tracker - Monitors user's recovery journey progression
 * Tracks stage transitions and provides stage-specific insights
 */
import { userRecoveryProfileRepository } from '../repositories/UserRecoveryProfileRepository';
import { dailyCheckInRepository } from '../repositories/DailyCheckInRepository';
import { milestoneRepository } from '../repositories/MilestoneRepository';
import { RecoveryStage, RiskLevel, TriggerType } from '../types';

export interface StageTransition {
  fromStage: RecoveryStage;
  toStage: RecoveryStage;
  transitionDate: string;
  triggerEvent: 'progress' | 'setback' | 'milestone' | 'manual';
  daysSinceLastTransition: number;
  confidence: number; // 0-1 scale
  supportingFactors: string[];
}

export interface StageMetrics {
  stage: RecoveryStage;
  daysInStage: number;
  stageProgress: number; // 0-1 scale
  nextStageRequirements: string[];
  riskFactors: string[];
  strengthFactors: string[];
  recommendedActions: string[];
}

export interface RecoveryProgression {
  currentStage: RecoveryStage;
  stageHistory: StageTransition[];
  overallTrend: 'improving' | 'stable' | 'declining';
  projectedNextStage?: RecoveryStage;
  projectedTransitionDate?: string;
  confidenceInProgression: number;
}

class RecoveryStageTracker {
  /**
   * Evaluate and potentially update user's recovery stage
   */
  async evaluateStageProgression(userId: string): Promise<StageTransition | null> {
    try {
      console.log('📊 Evaluating recovery stage progression');

      const currentProfile = await userRecoveryProfileRepository.findByUserId(userId);
      if (!currentProfile) {
        throw new Error('User recovery profile not found');
      }

      const currentStage = currentProfile.current_stage;
      const daysSinceSetback = currentProfile.days_since_last_setback;
      const totalDays = currentProfile.total_recovery_days;

      // Get supporting data for stage evaluation
      const recentCheckIns = await dailyCheckInRepository.getRecentCheckIns(userId, 14);
      const averageRatings = await dailyCheckInRepository.getAverageRatings(userId, 14);
      const recentMilestones = await milestoneRepository.getRecentMilestones(userId, 30);

      // Evaluate potential stage transition
      const suggestedStage = this.calculateOptimalStage(
        currentStage,
        daysSinceSetback,
        totalDays,
        averageRatings,
        recentCheckIns,
        recentMilestones
      );

      // If stage should change, create transition record
      if (suggestedStage !== currentStage) {
        const transition = await this.createStageTransition(
          userId,
          currentStage,
          suggestedStage,
          daysSinceSetback,
          totalDays,
          averageRatings,
          recentMilestones
        );

        // Update user profile with new stage
        await userRecoveryProfileRepository.updateStage(userId, suggestedStage);

        console.log(`Stage transition: ${currentStage} → ${suggestedStage}`);
        return transition;
      }

      return null;
    } catch (error) {
      console.error('Recovery Stage Tracker: Error evaluating progression:', error);
      throw error;
    }
  }

  /**
   * Get current stage metrics and progress
   */
  async getStageMetrics(userId: string): Promise<StageMetrics> {
    try {
      const profile = await userRecoveryProfileRepository.findByUserId(userId);
      if (!profile) {
        throw new Error('User recovery profile not found');
      }

      const recentCheckIns = await dailyCheckInRepository.getRecentCheckIns(userId, 7);
      const averageRatings = await dailyCheckInRepository.getAverageRatings(userId, 14);

      const stage = profile.current_stage;
      const daysInStage = this.calculateDaysInCurrentStage(profile);
      const stageProgress = this.calculateStageProgress(stage, profile, averageRatings);

      return {
        stage,
        daysInStage,
        stageProgress,
        nextStageRequirements: this.getNextStageRequirements(stage, profile),
        riskFactors: this.identifyRiskFactors(stage, averageRatings, recentCheckIns),
        strengthFactors: this.identifyStrengthFactors(stage, averageRatings, recentCheckIns),
        recommendedActions: this.getStageSpecificRecommendations(stage, stageProgress, averageRatings),
      };
    } catch (error) {
      console.error('Recovery Stage Tracker: Error getting stage metrics:', error);
      throw error;
    }
  }

  /**
   * Get complete recovery progression analysis
   */
  async getRecoveryProgression(userId: string): Promise<RecoveryProgression> {
    try {
      const profile = await userRecoveryProfileRepository.findByUserId(userId);
      if (!profile) {
        throw new Error('User recovery profile not found');
      }

      // Get stage history (in a full implementation, this would come from a stage_transitions table)
      const stageHistory = await this.getStageHistory(userId);
      
      // Calculate overall trend
      const overallTrend = this.calculateOverallTrend(stageHistory, profile);
      
      // Project next stage if applicable
      const { projectedNextStage, projectedTransitionDate, confidence } = 
        await this.projectNextStageTransition(userId, profile);

      return {
        currentStage: profile.current_stage,
        stageHistory,
        overallTrend,
        projectedNextStage,
        projectedTransitionDate,
        confidenceInProgression: confidence,
      };
    } catch (error) {
      console.error('Recovery Stage Tracker: Error getting progression:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal recovery stage based on multiple factors
   */
  private calculateOptimalStage(
    currentStage: RecoveryStage,
    daysSinceSetback: number,
    totalDays: number,
    averageRatings: any,
    recentCheckIns: any[],
    recentMilestones: any[]
  ): RecoveryStage {
    // Stage progression rules based on recovery science
    
    // Challenge stage indicators
    if (daysSinceSetback < 7 || 
        averageRatings.mood < 4 || 
        averageRatings.stress > 8 ||
        this.hasRecentCrisisIndicators(recentCheckIns)) {
      return 'challenge';
    }

    // Early stage (7-30 days, building foundation)
    if (daysSinceSetback >= 7 && daysSinceSetback < 30) {
      // Can stay in early if making good progress
      if (averageRatings.mood >= 6 && averageRatings.stress <= 6) {
        return 'early';
      }
      // Might need to go back to challenge if struggling
      if (averageRatings.mood < 5 || averageRatings.stress > 7) {
        return 'challenge';
      }
      return 'early';
    }

    // Maintenance stage (30-90 days, establishing routines)
    if (daysSinceSetback >= 30 && daysSinceSetback < 90) {
      // Strong indicators for maintenance
      if (averageRatings.mood >= 6 && 
          averageRatings.stress <= 6 && 
          totalDays >= 60 &&
          recentMilestones.length >= 2) {
        return 'maintenance';
      }
      // Stay in early if not quite ready
      return 'early';
    }

    // Growth stage (90+ days, expanding life)
    if (daysSinceSetback >= 90 && totalDays >= 180) {
      // Strong indicators for growth
      if (averageRatings.mood >= 7 && 
          averageRatings.stress <= 5 && 
          recentMilestones.length >= 3 &&
          this.hasGrowthIndicators(recentCheckIns, recentMilestones)) {
        return 'growth';
      }
      // Stay in maintenance if not quite ready for growth
      return 'maintenance';
    }

    // Default progression based on time
    if (daysSinceSetback >= 90) return 'maintenance';
    if (daysSinceSetback >= 30) return 'early';
    return currentStage;
  }

  /**
   * Create stage transition record
   */
  private async createStageTransition(
    userId: string,
    fromStage: RecoveryStage,
    toStage: RecoveryStage,
    daysSinceSetback: number,
    totalDays: number,
    averageRatings: any,
    recentMilestones: any[]
  ): Promise<StageTransition> {
    const supportingFactors: string[] = [];
    let confidence = 0.7; // Base confidence

    // Determine trigger event and supporting factors
    let triggerEvent: 'progress' | 'setback' | 'milestone' | 'manual' = 'progress';

    if (this.isProgressiveTransition(fromStage, toStage)) {
      triggerEvent = 'progress';
      supportingFactors.push(`${daysSinceSetback} days since setback`);
      
      if (averageRatings.mood >= 7) {
        supportingFactors.push('Improved mood ratings');
        confidence += 0.1;
      }
      
      if (averageRatings.stress <= 5) {
        supportingFactors.push('Reduced stress levels');
        confidence += 0.1;
      }
      
      if (recentMilestones.length >= 2) {
        supportingFactors.push('Recent milestone achievements');
        confidence += 0.1;
        triggerEvent = 'milestone';
      }
    } else {
      triggerEvent = 'setback';
      supportingFactors.push('Recent challenges or setbacks');
      
      if (averageRatings.mood < 5) {
        supportingFactors.push('Declining mood ratings');
      }
      
      if (averageRatings.stress > 7) {
        supportingFactors.push('Elevated stress levels');
      }
    }

    const transition: StageTransition = {
      fromStage,
      toStage,
      transitionDate: new Date().toISOString(),
      triggerEvent,
      daysSinceLastTransition: 0, // Would be calculated from stage history
      confidence: Math.min(confidence, 1.0),
      supportingFactors,
    };

    // In a full implementation, this would be saved to a stage_transitions table
    console.log('Stage transition created:', transition);

    return transition;
  }

  /**
   * Calculate days in current stage
   */
  private calculateDaysInCurrentStage(profile: any): number {
    // In a full implementation, this would use the stage_transitions table
    // For now, estimate based on recovery progress
    const totalDays = profile.total_recovery_days;
    const daysSinceSetback = profile.days_since_last_setback;

    switch (profile.current_stage) {
      case 'challenge':
        return Math.min(daysSinceSetback, 7);
      case 'early':
        return Math.min(Math.max(daysSinceSetback - 7, 0), 23);
      case 'maintenance':
        return Math.min(Math.max(daysSinceSetback - 30, 0), 60);
      case 'growth':
        return Math.max(daysSinceSetback - 90, 0);
      default:
        return daysSinceSetback;
    }
  }

  /**
   * Calculate progress within current stage
   */
  private calculateStageProgress(stage: RecoveryStage, profile: any, averageRatings: any): number {
    const daysSinceSetback = profile.days_since_last_setback;
    let baseProgress = 0;

    // Calculate base progress based on time in stage
    switch (stage) {
      case 'challenge':
        baseProgress = Math.min(daysSinceSetback / 7, 1);
        break;
      case 'early':
        baseProgress = Math.min(Math.max(daysSinceSetback - 7, 0) / 23, 1);
        break;
      case 'maintenance':
        baseProgress = Math.min(Math.max(daysSinceSetback - 30, 0) / 60, 1);
        break;
      case 'growth':
        baseProgress = Math.min(Math.max(daysSinceSetback - 90, 0) / 90, 1);
        break;
    }

    // Adjust based on quality metrics
    let qualityMultiplier = 1.0;
    
    if (averageRatings.mood >= 7) qualityMultiplier += 0.2;
    else if (averageRatings.mood < 5) qualityMultiplier -= 0.2;
    
    if (averageRatings.stress <= 4) qualityMultiplier += 0.1;
    else if (averageRatings.stress > 7) qualityMultiplier -= 0.2;

    return Math.max(0, Math.min(1, baseProgress * qualityMultiplier));
  }

  /**
   * Get requirements for next stage
   */
  private getNextStageRequirements(stage: RecoveryStage, profile: any): string[] {
    const requirements: string[] = [];

    switch (stage) {
      case 'challenge':
        requirements.push('Maintain 7+ consecutive days without setbacks');
        requirements.push('Achieve mood rating average of 5+ for one week');
        requirements.push('Complete daily check-ins consistently');
        break;
      case 'early':
        requirements.push('Reach 30 days since last setback');
        requirements.push('Maintain mood rating average of 6+ for two weeks');
        requirements.push('Achieve 2+ behavioral milestones');
        requirements.push('Establish consistent coping strategy usage');
        break;
      case 'maintenance':
        requirements.push('Reach 90 days since last setback');
        requirements.push('Maintain mood rating average of 7+ for one month');
        requirements.push('Achieve 3+ personal growth milestones');
        requirements.push('Demonstrate consistent stress management (≤5 average)');
        break;
      case 'growth':
        requirements.push('Continue expanding recovery skills and life goals');
        requirements.push('Maintain high well-being metrics');
        requirements.push('Consider mentoring others in recovery');
        break;
    }

    return requirements;
  }

  /**
   * Identify current risk factors
   */
  private identifyRiskFactors(stage: RecoveryStage, averageRatings: any, recentCheckIns: any[]): string[] {
    const riskFactors: string[] = [];

    if (averageRatings.mood < 5) riskFactors.push('Low mood ratings');
    if (averageRatings.stress > 7) riskFactors.push('High stress levels');
    if (averageRatings.sleep < 5) riskFactors.push('Poor sleep quality');
    if (averageRatings.energy < 4) riskFactors.push('Low energy levels');

    // Check for declining trends
    if (recentCheckIns.length >= 5) {
      const recent = recentCheckIns.slice(0, 3);
      const older = recentCheckIns.slice(3, 6);
      
      const recentMoodAvg = recent.reduce((sum, c) => sum + c.mood_rating, 0) / recent.length;
      const olderMoodAvg = older.reduce((sum, c) => sum + c.mood_rating, 0) / older.length;
      
      if (recentMoodAvg < olderMoodAvg - 1) {
        riskFactors.push('Declining mood trend');
      }
    }

    // Stage-specific risk factors
    switch (stage) {
      case 'challenge':
        if (recentCheckIns.some(c => c.trigger_events?.length > 2)) {
          riskFactors.push('Multiple trigger events');
        }
        break;
      case 'early':
        if (recentCheckIns.filter(c => c.reflection_completed).length < recentCheckIns.length * 0.5) {
          riskFactors.push('Inconsistent reflection practice');
        }
        break;
    }

    return riskFactors;
  }

  /**
   * Identify current strength factors
   */
  private identifyStrengthFactors(stage: RecoveryStage, averageRatings: any, recentCheckIns: any[]): string[] {
    const strengthFactors: string[] = [];

    if (averageRatings.mood >= 7) strengthFactors.push('Strong mood ratings');
    if (averageRatings.stress <= 4) strengthFactors.push('Good stress management');
    if (averageRatings.sleep >= 7) strengthFactors.push('Quality sleep patterns');
    if (averageRatings.energy >= 7) strengthFactors.push('High energy levels');

    // Check for improving trends
    if (recentCheckIns.length >= 5) {
      const recent = recentCheckIns.slice(0, 3);
      const older = recentCheckIns.slice(3, 6);
      
      const recentMoodAvg = recent.reduce((sum, c) => sum + c.mood_rating, 0) / recent.length;
      const olderMoodAvg = older.reduce((sum, c) => sum + c.mood_rating, 0) / older.length;
      
      if (recentMoodAvg > olderMoodAvg + 1) {
        strengthFactors.push('Improving mood trend');
      }
    }

    // Consistency factors
    const checkInRate = recentCheckIns.length / 7; // Assuming 7-day period
    if (checkInRate >= 0.8) strengthFactors.push('Consistent check-in practice');

    const reflectionRate = recentCheckIns.filter(c => c.reflection_completed).length / recentCheckIns.length;
    if (reflectionRate >= 0.7) strengthFactors.push('Regular reflection practice');

    return strengthFactors;
  }

  /**
   * Get stage-specific recommendations
   */
  private getStageSpecificRecommendations(stage: RecoveryStage, progress: number, averageRatings: any): string[] {
    const recommendations: string[] = [];

    switch (stage) {
      case 'challenge':
        recommendations.push('Focus on immediate coping strategies');
        recommendations.push('Maintain daily check-ins for stability');
        if (averageRatings.stress > 7) {
          recommendations.push('Practice stress reduction techniques daily');
        }
        if (progress < 0.5) {
          recommendations.push('Consider reaching out to support network');
        }
        break;

      case 'early':
        recommendations.push('Build consistent daily routines');
        recommendations.push('Practice new coping strategies regularly');
        if (progress > 0.7) {
          recommendations.push('Start setting short-term recovery goals');
        }
        if (averageRatings.mood < 6) {
          recommendations.push('Focus on mood-boosting activities');
        }
        break;

      case 'maintenance':
        recommendations.push('Strengthen long-term coping skills');
        recommendations.push('Expand social support network');
        if (progress > 0.6) {
          recommendations.push('Consider new personal growth challenges');
        }
        recommendations.push('Maintain consistent self-care practices');
        break;

      case 'growth':
        recommendations.push('Explore new life goals and interests');
        recommendations.push('Consider helping others in recovery');
        recommendations.push('Continue expanding your comfort zone');
        recommendations.push('Maintain strong recovery foundation');
        break;
    }

    return recommendations;
  }

  /**
   * Check for recent crisis indicators
   */
  private hasRecentCrisisIndicators(recentCheckIns: any[]): boolean {
    return recentCheckIns.some(checkIn => 
      checkIn.trigger_events?.some((event: any) => 
        event.intensity >= 8 || event.outcome === 'overwhelmed'
      )
    );
  }

  /**
   * Check for growth stage indicators
   */
  private hasGrowthIndicators(recentCheckIns: any[], recentMilestones: any[]): boolean {
    // Look for signs of life expansion and helping others
    const hasPersonalGrowthMilestones = recentMilestones.some(m => 
      m.milestone_type === 'personal_growth' || m.milestone_type === 'community'
    );
    
    const hasHighEngagement = recentCheckIns.every(c => 
      c.reflection_completed && c.focus_sessions_completed >= 1
    );

    return hasPersonalGrowthMilestones && hasHighEngagement;
  }

  /**
   * Check if transition is progressive (forward) or regressive
   */
  private isProgressiveTransition(fromStage: RecoveryStage, toStage: RecoveryStage): boolean {
    const stageOrder = ['challenge', 'early', 'maintenance', 'growth'];
    const fromIndex = stageOrder.indexOf(fromStage);
    const toIndex = stageOrder.indexOf(toStage);
    return toIndex > fromIndex;
  }

  /**
   * Get stage transition history
   */
  private async getStageHistory(userId: string): Promise<StageTransition[]> {
    // In a full implementation, this would query a stage_transitions table
    // For now, return a mock history based on current profile
    try {
      const profile = await userRecoveryProfileRepository.findByUserId(userId);
      if (!profile) return [];

      // Create a simplified history based on current stage and progress
      const history: StageTransition[] = [];
      const currentDate = new Date();
      const daysSinceSetback = profile.days_since_last_setback;

      // Estimate previous transitions based on current progress
      if (profile.current_stage !== 'challenge' && daysSinceSetback >= 7) {
        history.push({
          fromStage: 'challenge',
          toStage: 'early',
          transitionDate: new Date(currentDate.getTime() - (daysSinceSetback - 7) * 24 * 60 * 60 * 1000).toISOString(),
          triggerEvent: 'progress',
          daysSinceLastTransition: 7,
          confidence: 0.8,
          supportingFactors: ['Completed initial stabilization period'],
        });
      }

      if (profile.current_stage === 'maintenance' || profile.current_stage === 'growth') {
        if (daysSinceSetback >= 30) {
          history.push({
            fromStage: 'early',
            toStage: 'maintenance',
            transitionDate: new Date(currentDate.getTime() - (daysSinceSetback - 30) * 24 * 60 * 60 * 1000).toISOString(),
            triggerEvent: 'progress',
            daysSinceLastTransition: 23,
            confidence: 0.8,
            supportingFactors: ['Established consistent routines'],
          });
        }
      }

      if (profile.current_stage === 'growth' && daysSinceSetback >= 90) {
        history.push({
          fromStage: 'maintenance',
          toStage: 'growth',
          transitionDate: new Date(currentDate.getTime() - (daysSinceSetback - 90) * 24 * 60 * 60 * 1000).toISOString(),
          triggerEvent: 'milestone',
          daysSinceLastTransition: 60,
          confidence: 0.9,
          supportingFactors: ['Achieved significant milestones', 'Demonstrated life expansion'],
        });
      }

      return history.reverse(); // Most recent first
    } catch (error) {
      console.error('Error getting stage history:', error);
      return [];
    }
  }

  /**
   * Calculate overall recovery trend
   */
  private calculateOverallTrend(stageHistory: StageTransition[], profile: any): 'improving' | 'stable' | 'declining' {
    if (stageHistory.length === 0) {
      // Base on current stage and progress
      const daysSinceSetback = profile.days_since_last_setback;
      if (daysSinceSetback >= 30) return 'improving';
      if (daysSinceSetback >= 7) return 'stable';
      return 'declining';
    }

    // Analyze recent transitions
    const recentTransitions = stageHistory.slice(0, 3);
    const progressiveTransitions = recentTransitions.filter(t => 
      this.isProgressiveTransition(t.fromStage, t.toStage)
    );

    if (progressiveTransitions.length >= recentTransitions.length * 0.7) {
      return 'improving';
    } else if (progressiveTransitions.length >= recentTransitions.length * 0.3) {
      return 'stable';
    } else {
      return 'declining';
    }
  }

  /**
   * Project next stage transition
   */
  private async projectNextStageTransition(
    userId: string, 
    profile: any
  ): Promise<{ projectedNextStage?: RecoveryStage; projectedTransitionDate?: string; confidence: number }> {
    try {
      const currentStage = profile.current_stage;
      const daysSinceSetback = profile.days_since_last_setback;
      const averageRatings = await dailyCheckInRepository.getAverageRatings(userId, 14);

      let projectedNextStage: RecoveryStage | undefined;
      let daysToTransition = 0;
      let confidence = 0.5;

      switch (currentStage) {
        case 'challenge':
          if (averageRatings.mood >= 5 && averageRatings.stress <= 6) {
            projectedNextStage = 'early';
            daysToTransition = Math.max(7 - daysSinceSetback, 1);
            confidence = 0.7;
          }
          break;

        case 'early':
          if (averageRatings.mood >= 6 && averageRatings.stress <= 6) {
            projectedNextStage = 'maintenance';
            daysToTransition = Math.max(30 - daysSinceSetback, 1);
            confidence = 0.8;
          }
          break;

        case 'maintenance':
          if (averageRatings.mood >= 7 && averageRatings.stress <= 5) {
            projectedNextStage = 'growth';
            daysToTransition = Math.max(90 - daysSinceSetback, 1);
            confidence = 0.7;
          }
          break;

        case 'growth':
          // Growth stage is the final stage - no further transitions
          confidence = 0.9;
          break;
      }

      const projectedTransitionDate = projectedNextStage 
        ? new Date(Date.now() + daysToTransition * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      return {
        projectedNextStage,
        projectedTransitionDate,
        confidence,
      };
    } catch (error) {
      console.error('Error projecting next stage transition:', error);
      return { confidence: 0.3 };
    }
  }
}

// Export singleton instance
export const recoveryStageTracker = new RecoveryStageTracker();