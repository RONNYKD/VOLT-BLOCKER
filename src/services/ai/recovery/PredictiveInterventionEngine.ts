/**
 * Predictive Intervention Engine - Proactively identifies and responds to recovery risks
 * Uses pattern analysis and machine learning-like algorithms to predict and prevent setbacks
 */
import { crisisDetector } from '../crisis/CrisisDetector';
import { recoveryStageTracker } from './RecoveryStageTracker';
import { personalizationEngine } from './PersonalizationEngine';
import { recoveryCoachManager } from './RecoveryCoachManager';
import { userRecoveryProfileRepository } from '../repositories/UserRecoveryProfileRepository';
import { dailyCheckInRepository } from '../repositories/DailyCheckInRepository';
import { milestoneRepository } from '../repositories/MilestoneRepository';
import { RecoveryStage, RiskLevel, TriggerType, AIInteractionType } from '../types';

export interface RiskPrediction {
  userId: string;
  riskScore: number; // 0-100 scale
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  timeToIntervention: number; // hours until recommended intervention
  interventionType: InterventionType;
  confidence: number; // 0-1 scale
  predictionTimestamp: Date;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  daysObserved: number;
  severity: 'low' | 'medium' | 'high';
}

export interface InterventionRecommendation {
  type: InterventionType;
  urgency: 'immediate' | 'within_hour' | 'within_day' | 'monitor';
  interventionMessage: string;
  copingStrategies: string[];
  followUpSchedule: string[];
  escalationTriggers: string[];
}

export interface PredictivePattern {
  pattern: string;
  frequency: number;
  riskCorrelation: number;
  stageSensitivity: Record<RecoveryStage, number>;
  timePatterns: number[];
  contextFactors: string[];
}

export type InterventionType = 
  | 'supportive_message'
  | 'coping_strategy_reminder'
  | 'distraction_suggestion'
  | 'professional_resource'
  | 'emergency_support'
  | 'milestone_encouragement'
  | 'routine_adjustment';

export interface InterventionExecution {
  interventionId: string;
  userId: string;
  prediction: RiskPrediction;
  recommendation: InterventionRecommendation;
  executedAt: Date;
  userResponse?: 'helpful' | 'not_helpful' | 'very_helpful';
  effectiveness?: number; // 0-1 scale, determined by follow-up data
  followUpRequired: boolean;
}

class PredictiveInterventionEngine {
  private patterns: Map<string, PredictivePattern> = new Map();
  private interventionHistory: Map<string, InterventionExecution[]> = new Map();

  /**
   * Analyze user patterns and predict intervention needs
   */
  async predictRiskAndIntervene(userId: string): Promise<RiskPrediction | null> {
    try {
      console.log('🔮 Analyzing patterns for predictive intervention');

      // Gather comprehensive user data
      const profile = await userRecoveryProfileRepository.findByUserId(userId);
      if (!profile) {
        throw new Error('User recovery profile not found');
      }

      const recentCheckIns = await dailyCheckInRepository.getRecentCheckIns(userId, 14);
      const averageRatings = await dailyCheckInRepository.getAverageRatings(userId, 14);
      const stageMetrics = await recoveryStageTracker.getStageMetrics(userId);

      // Calculate risk prediction
      const riskPrediction = await this.calculateRiskPrediction(
        userId,
        profile,
        recentCheckIns,
        averageRatings,
        stageMetrics
      );

      // If significant risk detected, trigger intervention
      if (riskPrediction.riskLevel === 'high' || riskPrediction.riskScore >= 70) {
        await this.executeIntervention(riskPrediction);
      }

      return riskPrediction;
    } catch (error) {
      console.error('Predictive Intervention Engine: Error predicting risk:', error);
      return null;
    }
  }

  /**
   * Calculate comprehensive risk prediction
   */
  private async calculateRiskPrediction(
    userId: string,
    profile: any,
    recentCheckIns: any[],
    averageRatings: any,
    stageMetrics: any
  ): Promise<RiskPrediction> {
    let riskScore = 0;
    const riskFactors: RiskFactor[] = [];
    let confidence = 0.6;

    // Stage-based baseline risk
    const stageRiskMap = {
      'challenge': 40,
      'early': 25,
      'maintenance': 15,
      'growth': 10,
    };
    riskScore += stageRiskMap[profile.current_stage as keyof typeof stageRiskMap] || 30;

    // Days since setback factor
    const daysSinceSetback = profile.days_since_last_setback;
    if (daysSinceSetback < 3) {
      riskScore += 30;
      riskFactors.push({
        factor: 'Recent setback vulnerability',
        weight: 0.3,
        trend: 'increasing',
        daysObserved: 3 - daysSinceSetback,
        severity: 'high',
      });
    } else if (daysSinceSetback < 7) {
      riskScore += 15;
      riskFactors.push({
        factor: 'Early recovery phase',
        weight: 0.15,
        trend: 'decreasing',
        daysObserved: daysSinceSetback,
        severity: 'medium',
      });
    }

    // Mood and stress pattern analysis
    if (averageRatings.mood <= 4) {
      riskScore += 20;
      riskFactors.push({
        factor: 'Persistent low mood',
        weight: 0.2,
        trend: this.calculateMoodTrend(recentCheckIns),
        daysObserved: recentCheckIns.length,
        severity: 'high',
      });
      confidence += 0.1;
    }

    if (averageRatings.stress >= 8) {
      riskScore += 25;
      riskFactors.push({
        factor: 'High stress levels',
        weight: 0.25,
        trend: this.calculateStressTrend(recentCheckIns),
        daysObserved: recentCheckIns.length,
        severity: 'high',
      });
      confidence += 0.1;
    }

    // Check-in consistency risk
    const checkInRate = recentCheckIns.length / 14;
    if (checkInRate < 0.5) {
      riskScore += 15;
      riskFactors.push({
        factor: 'Inconsistent engagement',
        weight: 0.15,
        trend: 'increasing',
        daysObserved: 14,
        severity: 'medium',
      });
    }

    // Sleep quality impact
    if (averageRatings.sleep <= 4) {
      riskScore += 10;
      riskFactors.push({
        factor: 'Poor sleep quality',
        weight: 0.1,
        trend: this.calculateSleepTrend(recentCheckIns),
        daysObserved: recentCheckIns.length,
        severity: 'medium',
      });
    }

    // Crisis indicators from recent check-ins
    const crisisIndicators = await this.analyzeCrisisIndicators(recentCheckIns);
    riskScore += crisisIndicators.riskIncrease;
    riskFactors.push(...crisisIndicators.factors);

    // Pattern-based risk (from historical data)
    const patternRisk = await this.analyzeHistoricalPatterns(userId, profile);
    riskScore += patternRisk.riskIncrease;
    riskFactors.push(...patternRisk.factors);
    confidence += patternRisk.confidenceBoost;

    // Time-based risk factors
    const timeRisk = this.analyzeTimeBasedRisk(recentCheckIns);
    riskScore += timeRisk.riskIncrease;
    riskFactors.push(...timeRisk.factors);

    // Determine risk level
    let riskLevel: RiskLevel;
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    else riskLevel = 'low';

    // Calculate intervention timing
    const timeToIntervention = this.calculateInterventionTiming(riskLevel, riskFactors);

    // Determine intervention type
    const interventionType = this.determineInterventionType(riskLevel, riskFactors, profile.current_stage);

    return {
      userId,
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      riskFactors,
      timeToIntervention,
      interventionType,
      confidence: Math.min(confidence, 1.0),
      predictionTimestamp: new Date(),
    };
  }

  /**
   * Execute intervention based on risk prediction
   */
  private async executeIntervention(prediction: RiskPrediction): Promise<InterventionExecution> {
    try {
      console.log(`🚨 Executing ${prediction.riskLevel} risk intervention for user`);

      const recommendation = await this.generateInterventionRecommendation(prediction);
      
      // Create personalized intervention message
      const personalizationResult = await personalizationEngine.personalizeContent(
        prediction.userId,
        recommendation.interventionMessage,
        this.mapInterventionTypeToAIType(recommendation.type),
        {
          riskLevel: prediction.riskLevel,
          riskFactors: prediction.riskFactors.map(f => f.factor),
          urgency: recommendation.urgency,
        }
      );

      // Execute the intervention through recovery coach
      const coachResponse = await recoveryCoachManager.generateContextualResponse(
        prediction.userId,
        personalizationResult.content,
        this.mapInterventionTypeToAIType(recommendation.type)
      );

      const execution: InterventionExecution = {
        interventionId: this.generateInterventionId(),
        userId: prediction.userId,
        prediction,
        recommendation,
        executedAt: new Date(),
        followUpRequired: recommendation.urgency === 'immediate' || prediction.riskLevel === 'critical',
      };

      // Store intervention for learning
      this.storeInterventionExecution(execution);

      console.log(`Intervention executed: ${recommendation.type} (${recommendation.urgency})`);
      return execution;
    } catch (error) {
      console.error('Predictive Intervention Engine: Error executing intervention:', error);
      throw error;
    }
  }

  /**
   * Generate intervention recommendation based on prediction
   */
  private async generateInterventionRecommendation(prediction: RiskPrediction): Promise<InterventionRecommendation> {
    const riskLevel = prediction.riskLevel;
    const riskFactors = prediction.riskFactors;
    const dominantRisks = riskFactors.filter(f => f.severity === 'high').slice(0, 3);

    let interventionMessage = '';
    const copingStrategies: string[] = [];
    const followUpSchedule: string[] = [];
    const escalationTriggers: string[] = [];

    // Determine urgency
    let urgency: 'immediate' | 'within_hour' | 'within_day' | 'monitor';
    if (riskLevel === 'critical') {
      urgency = 'immediate';
    } else if (riskLevel === 'high' && dominantRisks.length >= 2) {
      urgency = 'within_hour';
    } else if (riskLevel === 'high') {
      urgency = 'within_day';
    } else {
      urgency = 'monitor';
    }

    // Generate intervention content based on risk factors
    if (dominantRisks.some(r => r.factor.includes('mood'))) {
      interventionMessage = 'I notice you might be going through a challenging time. Your feelings are valid, and this difficult moment will pass.';
      copingStrategies.push('Deep breathing exercises');
      copingStrategies.push('Reach out to a trusted friend or family member');
      copingStrategies.push('Practice self-compassion meditation');
      
      if (urgency === 'immediate') {
        escalationTriggers.push('Crisis hotline contact if thoughts of self-harm arise');
      }
    }

    if (dominantRisks.some(r => r.factor.includes('stress'))) {
      interventionMessage = 'Your stress levels seem elevated lately. Let\'s work on some techniques to help you feel more grounded and in control.';
      copingStrategies.push('Progressive muscle relaxation');
      copingStrategies.push('Take a 10-minute walk outside');
      copingStrategies.push('Practice the 5-4-3-2-1 grounding technique');
    }

    if (dominantRisks.some(r => r.factor.includes('engagement'))) {
      interventionMessage = 'I\'ve noticed you might be feeling disconnected from your recovery routine. That\'s completely normal - let\'s gently get back on track.';
      copingStrategies.push('Start with just one small positive action today');
      copingStrategies.push('Set a gentle reminder for daily check-ins');
      copingStrategies.push('Review your recovery goals and adjust if needed');
    }

    if (dominantRisks.some(r => r.factor.includes('setback'))) {
      interventionMessage = 'Recent challenges don\'t erase your progress. Every moment is a new opportunity to choose recovery. You have the strength to continue moving forward.';
      copingStrategies.push('Review your coping strategies toolkit');
      copingStrategies.push('Practice self-forgiveness and compassion');
      copingStrategies.push('Focus on the next 24 hours only');
      
      followUpSchedule.push('Check-in within 2 hours');
      followUpSchedule.push('Daily check-in for next 3 days');
    }

    // Default supportive message if no specific risk factors
    if (!interventionMessage) {
      interventionMessage = 'I\'m here to support you on your recovery journey. Remember that seeking help is a sign of strength, not weakness.';
      copingStrategies.push('Practice mindfulness for 5 minutes');
      copingStrategies.push('Connect with your support network');
      copingStrategies.push('Review your recovery progress and celebrate small wins');
    }

    // Set follow-up schedule based on urgency
    if (urgency === 'immediate') {
      followUpSchedule.push('Follow-up in 30 minutes', 'Check-in within 2 hours', 'Daily follow-up for 1 week');
      escalationTriggers.push('No response within 1 hour');
    } else if (urgency === 'within_hour') {
      followUpSchedule.push('Follow-up in 1 hour', 'Check-in within 6 hours', 'Daily check-in for 3 days');
      escalationTriggers.push('No response within 3 hours');
    } else if (urgency === 'within_day') {
      followUpSchedule.push('Follow-up within 6 hours', 'Check-in tomorrow', 'Weekly follow-up');
    }

    return {
      type: prediction.interventionType,
      urgency,
      interventionMessage,
      copingStrategies,
      followUpSchedule,
      escalationTriggers,
    };
  }

  /**
   * Analyze crisis indicators from recent check-ins
   */
  private async analyzeCrisisIndicators(recentCheckIns: any[]): Promise<{
    riskIncrease: number;
    factors: RiskFactor[];
  }> {
    let riskIncrease = 0;
    const factors: RiskFactor[] = [];

    for (const checkIn of recentCheckIns) {
      // Use existing crisis detector
      try {
        const crisisDetection = await crisisDetector.detectCrisis(checkIn);
        
        if (crisisDetection.isInCrisis) {
          riskIncrease += crisisDetection.severity === 'severe' ? 40 : 25;
          factors.push({
            factor: 'Crisis indicators detected',
            weight: crisisDetection.severity === 'severe' ? 0.4 : 0.25,
            trend: 'increasing',
            daysObserved: 1,
            severity: crisisDetection.severity === 'severe' ? 'high' : 'medium',
          });
        }
      } catch (error) {
        console.warn('Error running crisis detection:', error);
      }

      // Analyze trigger events
      if (checkIn.trigger_events && checkIn.trigger_events.length > 0) {
        const highIntensityTriggers = checkIn.trigger_events.filter((e: any) => e.intensity >= 7);
        if (highIntensityTriggers.length > 0) {
          riskIncrease += highIntensityTriggers.length * 10;
          factors.push({
            factor: 'High intensity trigger events',
            weight: 0.1 * highIntensityTriggers.length,
            trend: 'increasing',
            daysObserved: 1,
            severity: 'medium',
          });
        }
      }
    }

    return { riskIncrease, factors };
  }

  /**
   * Analyze historical patterns for prediction
   */
  private async analyzeHistoricalPatterns(userId: string, profile: any): Promise<{
    riskIncrease: number;
    factors: RiskFactor[];
    confidenceBoost: number;
  }> {
    let riskIncrease = 0;
    const factors: RiskFactor[] = [];
    let confidenceBoost = 0;

    try {
      // Get longer-term check-in data for pattern analysis
      const historicalCheckIns = await dailyCheckInRepository.getRecentCheckIns(userId, 30);
      
      if (historicalCheckIns.length >= 7) {
        // Analyze weekly patterns
        const weeklyPatterns = this.analyzeWeeklyPatterns(historicalCheckIns);
        
        if (weeklyPatterns.riskDays.length > 0) {
          const currentDay = new Date().getDay();
          if (weeklyPatterns.riskDays.includes(currentDay)) {
            riskIncrease += 15;
            factors.push({
              factor: 'Historical weekly risk pattern',
              weight: 0.15,
              trend: 'stable',
              daysObserved: 30,
              severity: 'medium',
            });
            confidenceBoost += 0.1;
          }
        }

        // Analyze time-of-day patterns
        const timePatterns = this.analyzeTimePatterns(historicalCheckIns);
        const currentHour = new Date().getHours();
        
        if (timePatterns.riskHours.includes(currentHour)) {
          riskIncrease += 10;
          factors.push({
            factor: 'Historical time-based risk pattern',
            weight: 0.1,
            trend: 'stable',
            daysObserved: 30,
            severity: 'low',
          });
          confidenceBoost += 0.05;
        }

        // Analyze declining trend patterns
        const trendAnalysis = this.analyzeTrends(historicalCheckIns);
        if (trendAnalysis.isDeclineTrend) {
          riskIncrease += trendAnalysis.severity === 'sharp' ? 20 : 10;
          factors.push({
            factor: 'Declining trend pattern',
            weight: trendAnalysis.severity === 'sharp' ? 0.2 : 0.1,
            trend: 'increasing',
            daysObserved: trendAnalysis.observedDays,
            severity: trendAnalysis.severity === 'sharp' ? 'high' : 'medium',
          });
          confidenceBoost += 0.15;
        }
      }

      return { riskIncrease, factors, confidenceBoost };
    } catch (error) {
      console.error('Error analyzing historical patterns:', error);
      return { riskIncrease: 0, factors: [], confidenceBoost: 0 };
    }
  }

  /**
   * Analyze time-based risk factors
   */
  private analyzeTimeBasedRisk(recentCheckIns: any[]): {
    riskIncrease: number;
    factors: RiskFactor[];
  } {
    let riskIncrease = 0;
    const factors: RiskFactor[] = [];

    const now = new Date();
    const currentHour = now.getHours();

    // Late night risk (11 PM - 3 AM typically higher risk)
    if (currentHour >= 23 || currentHour <= 3) {
      riskIncrease += 8;
      factors.push({
        factor: 'Late night vulnerability window',
        weight: 0.08,
        trend: 'stable',
        daysObserved: 1,
        severity: 'low',
      });
    }

    // Weekend risk analysis
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      const weekendCheckIns = recentCheckIns.filter(c => {
        const checkInDay = new Date(c.created_at).getDay();
        return checkInDay === 0 || checkInDay === 6;
      });
      
      if (weekendCheckIns.length > 0) {
        const weekendStressAvg = weekendCheckIns.reduce((sum, c) => sum + (c.stress_level || 5), 0) / weekendCheckIns.length;
        if (weekendStressAvg > 6) {
          riskIncrease += 12;
          factors.push({
            factor: 'Weekend stress pattern',
            weight: 0.12,
            trend: 'stable',
            daysObserved: weekendCheckIns.length,
            severity: 'medium',
          });
        }
      }
    }

    return { riskIncrease, factors };
  }

  /**
   * Calculate intervention timing based on risk assessment
   */
  private calculateInterventionTiming(riskLevel: RiskLevel, riskFactors: RiskFactor[]): number {
    const baseHours = {
      'critical': 0, // Immediate
      'high': 1,
      'medium': 6,
      'low': 24,
    };

    let hours = baseHours[riskLevel];

    // Adjust based on trend acceleration
    const acceleratingRisks = riskFactors.filter(f => f.trend === 'increasing');
    if (acceleratingRisks.length > 1) {
      hours = Math.max(hours - 2, 0);
    }

    // Adjust based on historical effectiveness
    const historyData = this.interventionHistory.get('global') || [];
    if (historyData.length > 0) {
      const recentEffectiveness = historyData
        .slice(-5)
        .filter(i => i.effectiveness !== undefined)
        .reduce((avg, i) => avg + (i.effectiveness || 0), 0) / 5;
      
      if (recentEffectiveness < 0.5) {
        // If interventions haven't been very effective, intervene sooner
        hours = Math.max(hours - 1, 0);
      }
    }

    return hours;
  }

  /**
   * Determine appropriate intervention type
   */
  private determineInterventionType(riskLevel: RiskLevel, riskFactors: RiskFactor[], stage: RecoveryStage): InterventionType {
    if (riskLevel === 'critical') {
      return 'emergency_support';
    }

    // Check for specific risk patterns
    const moodRisks = riskFactors.filter(f => f.factor.includes('mood'));
    const stressRisks = riskFactors.filter(f => f.factor.includes('stress'));
    const engagementRisks = riskFactors.filter(f => f.factor.includes('engagement'));
    const setbackRisks = riskFactors.filter(f => f.factor.includes('setback'));

    if (setbackRisks.length > 0) {
      return 'coping_strategy_reminder';
    } else if (stressRisks.length > 0) {
      return 'distraction_suggestion';
    } else if (moodRisks.length > 0) {
      return 'supportive_message';
    } else if (engagementRisks.length > 0) {
      return 'milestone_encouragement';
    } else if (stage === 'maintenance' || stage === 'growth') {
      return 'routine_adjustment';
    } else {
      return 'supportive_message';
    }
  }

  /**
   * Learn from intervention effectiveness
   */
  async learnFromInterventionOutcome(
    interventionId: string,
    userResponse: 'helpful' | 'not_helpful' | 'very_helpful',
    followUpData?: any
  ): Promise<void> {
    try {
      console.log('📈 Learning from intervention outcome');

      // Find the intervention execution
      let execution: InterventionExecution | undefined;
      for (const userInterventions of this.interventionHistory.values()) {
        execution = userInterventions.find(i => i.interventionId === interventionId);
        if (execution) break;
      }

      if (!execution) {
        console.warn('Intervention execution not found for learning');
        return;
      }

      // Update execution with response
      execution.userResponse = userResponse;
      execution.effectiveness = this.calculateEffectiveness(userResponse, followUpData);

      // Learn patterns for future predictions
      await this.updatePredictivePatterns(execution);

      // Share learning with personalization engine
      await personalizationEngine.learnFromFeedback(
        execution.userId,
        this.mapInterventionTypeToAIType(execution.recommendation.type),
        execution.recommendation.interventionMessage,
        userResponse,
        { interventionType: execution.recommendation.type }
      );

      console.log(`Learned from intervention: ${userResponse} (effectiveness: ${execution.effectiveness})`);
    } catch (error) {
      console.error('Predictive Intervention Engine: Error learning from outcome:', error);
    }
  }

  /**
   * Get intervention recommendations for manual review
   */
  async getInterventionRecommendations(userId: string): Promise<InterventionRecommendation[]> {
    try {
      const prediction = await this.predictRiskAndIntervene(userId);
      if (!prediction) {
        return [];
      }

      const recommendation = await this.generateInterventionRecommendation(prediction);
      return [recommendation];
    } catch (error) {
      console.error('Predictive Intervention Engine: Error getting recommendations:', error);
      return [];
    }
  }

  // Helper methods for pattern analysis
  private analyzeWeeklyPatterns(checkIns: any[]): { riskDays: number[] } {
    const dayRiskScores = [0, 0, 0, 0, 0, 0, 0]; // Sunday = 0, Monday = 1, etc.
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];

    checkIns.forEach(checkIn => {
      const day = new Date(checkIn.created_at).getDay();
      const riskScore = this.calculateCheckInRisk(checkIn);
      
      dayRiskScores[day] += riskScore;
      dayCounts[day]++;
    });

    // Calculate average risk per day
    const avgRiskPerDay = dayRiskScores.map((score, index) => 
      dayCounts[index] > 0 ? score / dayCounts[index] : 0
    );

    // Find days with above-average risk
    const overallAvg = avgRiskPerDay.reduce((sum, score) => sum + score, 0) / 7;
    const riskDays = avgRiskPerDay
      .map((score, day) => ({ day, score }))
      .filter(item => item.score > overallAvg + 1)
      .map(item => item.day);

    return { riskDays };
  }

  private analyzeTimePatterns(checkIns: any[]): { riskHours: number[] } {
    const hourRiskScores = new Array(24).fill(0);
    const hourCounts = new Array(24).fill(0);

    checkIns.forEach(checkIn => {
      const hour = new Date(checkIn.created_at).getHours();
      const riskScore = this.calculateCheckInRisk(checkIn);
      
      hourRiskScores[hour] += riskScore;
      hourCounts[hour]++;
    });

    // Calculate average risk per hour
    const avgRiskPerHour = hourRiskScores.map((score, hour) => 
      hourCounts[hour] > 0 ? score / hourCounts[hour] : 0
    );

    // Find hours with above-average risk
    const overallAvg = avgRiskPerHour.reduce((sum, score) => sum + score, 0) / 24;
    const riskHours = avgRiskPerHour
      .map((score, hour) => ({ hour, score }))
      .filter(item => item.score > overallAvg + 1)
      .map(item => item.hour);

    return { riskHours };
  }

  private analyzeTrends(checkIns: any[]): { 
    isDeclineTrend: boolean; 
    severity: 'gradual' | 'sharp'; 
    observedDays: number; 
  } {
    if (checkIns.length < 5) {
      return { isDeclineTrend: false, severity: 'gradual', observedDays: 0 };
    }

    // Sort by date (most recent first)
    const sortedCheckIns = checkIns.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Analyze mood trend over recent period
    const recentMoods = sortedCheckIns.slice(0, 5).map(c => c.mood_rating || 5);
    const olderMoods = sortedCheckIns.slice(5, 10).map(c => c.mood_rating || 5);

    if (olderMoods.length === 0) {
      return { isDeclineTrend: false, severity: 'gradual', observedDays: 0 };
    }

    const recentAvg = recentMoods.reduce((sum, m) => sum + m, 0) / recentMoods.length;
    const olderAvg = olderMoods.reduce((sum, m) => sum + m, 0) / olderMoods.length;

    const decline = olderAvg - recentAvg;
    const isDeclineTrend = decline >= 1.5;
    const severity = decline >= 3 ? 'sharp' : 'gradual';

    return {
      isDeclineTrend,
      severity,
      observedDays: sortedCheckIns.length,
    };
  }

  private calculateMoodTrend(checkIns: any[]): 'increasing' | 'stable' | 'decreasing' {
    if (checkIns.length < 3) return 'stable';

    const moods = checkIns.slice(0, 3).map(c => c.mood_rating || 5);
    const trend = moods[0] - moods[moods.length - 1];

    if (trend > 1) return 'decreasing'; // Mood getting worse
    if (trend < -1) return 'increasing'; // Mood getting better
    return 'stable';
  }

  private calculateStressTrend(checkIns: any[]): 'increasing' | 'stable' | 'decreasing' {
    if (checkIns.length < 3) return 'stable';

    const stressLevels = checkIns.slice(0, 3).map(c => c.stress_level || 5);
    const trend = stressLevels[0] - stressLevels[stressLevels.length - 1];

    if (trend > 1) return 'increasing'; // Stress getting higher
    if (trend < -1) return 'decreasing'; // Stress getting lower
    return 'stable';
  }

  private calculateSleepTrend(checkIns: any[]): 'increasing' | 'stable' | 'decreasing' {
    if (checkIns.length < 3) return 'stable';

    const sleepQuality = checkIns.slice(0, 3).map(c => c.sleep_quality || 5);
    const trend = sleepQuality[0] - sleepQuality[sleepQuality.length - 1];

    if (trend < -1) return 'decreasing'; // Sleep getting worse
    if (trend > 1) return 'increasing'; // Sleep getting better
    return 'stable';
  }

  private calculateCheckInRisk(checkIn: any): number {
    let risk = 0;
    
    if (checkIn.mood_rating <= 4) risk += 3;
    if (checkIn.stress_level >= 7) risk += 3;
    if (checkIn.sleep_quality <= 4) risk += 2;
    if (checkIn.energy_level <= 3) risk += 2;
    if (checkIn.trigger_events && checkIn.trigger_events.length > 0) {
      risk += checkIn.trigger_events.length;
    }
    if (!checkIn.reflection_completed) risk += 1;

    return risk;
  }

  private calculateEffectiveness(
    userResponse: 'helpful' | 'not_helpful' | 'very_helpful',
    followUpData?: any
  ): number {
    let effectiveness = 0.5; // Base effectiveness

    switch (userResponse) {
      case 'very_helpful':
        effectiveness = 0.9;
        break;
      case 'helpful':
        effectiveness = 0.7;
        break;
      case 'not_helpful':
        effectiveness = 0.2;
        break;
    }

    // Adjust based on follow-up data if available
    if (followUpData) {
      if (followUpData.moodImprovement > 0) effectiveness += 0.1;
      if (followUpData.stressReduction > 0) effectiveness += 0.1;
      if (followUpData.copingStrategyUsed) effectiveness += 0.1;
    }

    return Math.min(effectiveness, 1.0);
  }

  private async updatePredictivePatterns(execution: InterventionExecution): Promise<void> {
    // In a full implementation, this would update ML models or pattern databases
    console.log('Updating predictive patterns based on intervention outcome');
  }

  private mapInterventionTypeToAIType(interventionType: InterventionType): AIInteractionType {
    const mapping: Record<InterventionType, AIInteractionType> = {
      'supportive_message': 'general_support',
      'coping_strategy_reminder': 'coping_guidance',
      'distraction_suggestion': 'coping_guidance',
      'professional_resource': 'resource_recommendation',
      'emergency_support': 'crisis_intervention',
      'milestone_encouragement': 'motivational_boost',
      'routine_adjustment': 'general_support',
    };

    return mapping[interventionType] || 'general_support';
  }

  private generateInterventionId(): string {
    return 'int_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private storeInterventionExecution(execution: InterventionExecution): void {
    const userInterventions = this.interventionHistory.get(execution.userId) || [];
    userInterventions.push(execution);
    
    // Keep only last 50 interventions per user
    if (userInterventions.length > 50) {
      userInterventions.splice(0, userInterventions.length - 50);
    }
    
    this.interventionHistory.set(execution.userId, userInterventions);

    // Also store in global history for pattern learning
    const globalInterventions = this.interventionHistory.get('global') || [];
    globalInterventions.push(execution);
    
    if (globalInterventions.length > 200) {
      globalInterventions.splice(0, globalInterventions.length - 200);
    }
    
    this.interventionHistory.set('global', globalInterventions);
  }
}

// Export singleton instance
export const predictiveInterventionEngine = new PredictiveInterventionEngine();
