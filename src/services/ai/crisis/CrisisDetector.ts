/**
 * Crisis Detector - Identifies high-risk patterns and situations
 * Uses multiple data sources to detect potential crisis moments and trigger interventions
 */
import { userRecoveryProfileRepository } from '../repositories/UserRecoveryProfileRepository';
import { dailyCheckInRepository } from '../repositories/DailyCheckInRepository';
import { RiskLevel, TriggerType, RecoveryStage } from '../types';

export interface CrisisIndicator {
  type: 'temporal' | 'emotional' | 'behavioral' | 'environmental' | 'physiological';
  severity: RiskLevel;
  confidence: number; // 0-1 scale
  description: string;
  triggerFactors: string[];
  detectedAt: string;
  requiresImmediate: boolean;
}

export interface CrisisRiskAssessment {
  overallRiskLevel: RiskLevel;
  riskScore: number; // 0-100 scale
  indicators: CrisisIndicator[];
  triggerTypes: TriggerType[];
  interventionRecommended: boolean;
  escalationRequired: boolean;
  timeToIntervention: 'immediate' | 'within_hour' | 'within_day' | 'monitor';
  contextualFactors: string[];
}

export interface RiskPattern {
  patternType: 'temporal' | 'emotional' | 'usage' | 'environmental';
  pattern: string;
  riskMultiplier: number;
  historicalOccurrences: number;
  lastOccurrence?: string;
  effectiveness: number; // How well past interventions worked
}

class CrisisDetector {
  private readonly CRISIS_THRESHOLDS = {
    IMMEDIATE: 80,
    HIGH: 65,
    MEDIUM: 45,
    LOW: 25,
  };

  private readonly RISK_WEIGHTS = {
    temporal: 0.2,
    emotional: 0.3,
    behavioral: 0.25,
    environmental: 0.15,
    physiological: 0.1,
  };

  /**
   * Perform comprehensive crisis risk assessment
   */
  async assessCrisisRisk(userId: string): Promise<CrisisRiskAssessment> {
    try {
      console.log('🚨 Performing crisis risk assessment');

      const profile = await userRecoveryProfileRepository.findByUserId(userId);
      if (!profile) {
        throw new Error('User recovery profile not found');
      }

      // Gather data for assessment
      const recentCheckIns = await dailyCheckInRepository.getRecentCheckIns(userId, 7);
      const averageRatings = await dailyCheckInRepository.getAverageRatings(userId, 7);
      const currentTime = new Date();

      // Detect various risk indicators
      const indicators: CrisisIndicator[] = [];
      
      // Temporal risk indicators
      indicators.push(...await this.detectTemporalRisks(userId, profile, currentTime));
      
      // Emotional risk indicators
      indicators.push(...await this.detectEmotionalRisks(recentCheckIns, averageRatings, profile));
      
      // Behavioral risk indicators
      indicators.push(...this.detectBehavioralRisks(recentCheckIns, profile));
      
      // Environmental risk indicators
      indicators.push(...this.detectEnvironmentalRisks(userId, currentTime));
      
      // Physiological risk indicators
      indicators.push(...this.detectPhysiologicalRisks(recentCheckIns, averageRatings));

      // Calculate overall risk assessment
      const assessment = this.calculateRiskAssessment(indicators, profile);

      console.log(`Crisis risk assessment: ${assessment.overallRiskLevel} (${assessment.riskScore}/100)`);
      
      return assessment;
    } catch (error) {
      console.error('Crisis Detector: Error assessing crisis risk:', error);
      
      // Return safe default assessment
      return {
        overallRiskLevel: 'medium',
        riskScore: 50,
        indicators: [],
        triggerTypes: [],
        interventionRecommended: true,
        escalationRequired: false,
        timeToIntervention: 'within_hour',
        contextualFactors: ['Assessment error - using safe defaults'],
      };
    }
  }

  /**
   * Detect immediate crisis situations requiring urgent intervention
   */
  async detectImmediateCrisis(userId: string): Promise<boolean> {
    try {
      const assessment = await this.assessCrisisRisk(userId);
      
      // Check for immediate crisis indicators
      const hasImmediateIndicators = assessment.indicators.some(indicator => 
        indicator.requiresImmediate || indicator.severity === 'critical'
      );
      
      const hasHighRiskScore = assessment.riskScore >= this.CRISIS_THRESHOLDS.IMMEDIATE;
      
      return hasImmediateIndicators || hasHighRiskScore;
    } catch (error) {
      console.error('Crisis Detector: Error detecting immediate crisis:', error);
      // Err on the side of caution
      return true;
    }
  }

  /**
   * Get historical risk patterns for user
   */
  async getRiskPatterns(userId: string): Promise<RiskPattern[]> {
    try {
      const profile = await userRecoveryProfileRepository.findByUserId(userId);
      const recentCheckIns = await dailyCheckInRepository.getRecentCheckIns(userId, 30);
      
      if (!profile) return [];

      const patterns: RiskPattern[] = [];

      // Analyze temporal patterns
      patterns.push(...this.analyzeTemporalPatterns(recentCheckIns));
      
      // Analyze emotional patterns
      patterns.push(...this.analyzeEmotionalPatterns(recentCheckIns, profile));
      
      // Analyze usage patterns
      patterns.push(...this.analyzeUsagePatterns(recentCheckIns));
      
      // Analyze environmental patterns
      patterns.push(...this.analyzeEnvironmentalPatterns(userId, recentCheckIns));

      return patterns.filter(pattern => pattern.riskMultiplier > 1.2); // Only significant patterns
    } catch (error) {
      console.error('Crisis Detector: Error getting risk patterns:', error);
      return [];
    }
  }

  /**
   * Detect temporal risk indicators
   */
  private async detectTemporalRisks(
    userId: string, 
    profile: any, 
    currentTime: Date
  ): Promise<CrisisIndicator[]> {
    const indicators: CrisisIndicator[] = [];
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();

    // High-risk time periods (based on research)
    const highRiskHours = [22, 23, 0, 1, 2]; // Late night/early morning
    const highRiskDays = [0, 6]; // Weekends

    if (highRiskHours.includes(hour)) {
      indicators.push({
        type: 'temporal',
        severity: 'medium',
        confidence: 0.7,
        description: 'Current time is a statistically high-risk period for relapse',
        triggerFactors: ['late_night_hours', 'reduced_supervision'],
        detectedAt: currentTime.toISOString(),
        requiresImmediate: false,
      });
    }

    if (highRiskDays.includes(dayOfWeek)) {
      indicators.push({
        type: 'temporal',
        severity: 'low',
        confidence: 0.6,
        description: 'Weekend periods show increased vulnerability',
        triggerFactors: ['weekend', 'schedule_change'],
        detectedAt: currentTime.toISOString(),
        requiresImmediate: false,
      });
    }

    // Check for user-specific temporal patterns
    const recentCheckIns = await dailyCheckInRepository.getRecentCheckIns(userId, 14);
    const timeBasedIssues = recentCheckIns.filter(checkIn => {
      const checkInHour = new Date(checkIn.created_at).getHours();
      return checkIn.trigger_events?.some(event => 
        event.intensity >= 7 && Math.abs(checkInHour - hour) <= 1
      );
    });

    if (timeBasedIssues.length >= 2) {
      indicators.push({
        type: 'temporal',
        severity: 'high',
        confidence: 0.8,
        description: 'Personal temporal pattern detected - this time has been challenging recently',
        triggerFactors: ['personal_temporal_pattern', 'historical_triggers'],
        detectedAt: currentTime.toISOString(),
        requiresImmediate: false,
      });
    }

    return indicators;
  }

  /**
   * Detect emotional risk indicators
   */
  private async detectEmotionalRisks(
    recentCheckIns: any[], 
    averageRatings: any, 
    profile: any
  ): Promise<CrisisIndicator[]> {
    const indicators: CrisisIndicator[] = [];

    // Low mood indicators
    if (averageRatings.mood <= 3) {
      indicators.push({
        type: 'emotional',
        severity: 'high',
        confidence: 0.9,
        description: 'Severely low mood ratings indicate high emotional vulnerability',
        triggerFactors: ['depression', 'low_mood', 'emotional_distress'],
        detectedAt: new Date().toISOString(),
        requiresImmediate: true,
      });
    } else if (averageRatings.mood <= 5) {
      indicators.push({
        type: 'emotional',
        severity: 'medium',
        confidence: 0.8,
        description: 'Below-average mood ratings suggest emotional vulnerability',
        triggerFactors: ['low_mood', 'emotional_risk'],
        detectedAt: new Date().toISOString(),
        requiresImmediate: false,
      });
    }

    // High stress indicators
    if (averageRatings.stress >= 8) {
      indicators.push({
        type: 'emotional',
        severity: 'high',
        confidence: 0.85,
        description: 'Extremely high stress levels create significant relapse risk',
        triggerFactors: ['high_stress', 'overwhelm', 'pressure'],
        detectedAt: new Date().toISOString(),
        requiresImmediate: true,
      });
    } else if (averageRatings.stress >= 6) {
      indicators.push({
        type: 'emotional',
        severity: 'medium',
        confidence: 0.7,
        description: 'Elevated stress levels increase vulnerability',
        triggerFactors: ['stress', 'tension'],
        detectedAt: new Date().toISOString(),
        requiresImmediate: false,
      });
    }

    // Emotional volatility
    if (recentCheckIns.length >= 3) {
      const moodVariance = this.calculateVariance(recentCheckIns.map(c => c.mood_rating));
      if (moodVariance > 6) {
        indicators.push({
          type: 'emotional',
          severity: 'medium',
          confidence: 0.75,
          description: 'High emotional volatility indicates instability',
          triggerFactors: ['emotional_instability', 'mood_swings'],
          detectedAt: new Date().toISOString(),
          requiresImmediate: false,
        });
      }
    }

    // Personal trigger alignment
    const recentTriggers = recentCheckIns.flatMap(c => 
      c.trigger_events?.map((e: any) => e.type) || []
    );
    
    const personalTriggerHits = profile.personal_triggers?.filter((trigger: TriggerType) =>
      recentTriggers.includes(trigger)
    ) || [];

    if (personalTriggerHits.length >= 2) {
      indicators.push({
        type: 'emotional',
        severity: 'high',
        confidence: 0.9,
        description: 'Multiple personal triggers have been activated recently',
        triggerFactors: personalTriggerHits,
        detectedAt: new Date().toISOString(),
        requiresImmediate: true,
      });
    }

    return Promise.resolve(indicators);
  }

  /**
   * Detect behavioral risk indicators
   */
  private detectBehavioralRisks(recentCheckIns: any[], profile: any): CrisisIndicator[] {
    const indicators: CrisisIndicator[] = [];

    // Engagement drop-off
    const engagementRate = recentCheckIns.filter(c => c.reflection_completed).length / Math.max(recentCheckIns.length, 1);
    if (engagementRate < 0.3) {
      indicators.push({
        type: 'behavioral',
        severity: 'medium',
        confidence: 0.7,
        description: 'Significant drop in app engagement and self-reflection',
        triggerFactors: ['disengagement', 'avoidance', 'withdrawal'],
        detectedAt: new Date().toISOString(),
        requiresImmediate: false,
      });
    }

    // Coping strategy abandonment
    const recentCopingUsage = recentCheckIns.flatMap(c => c.coping_strategies_used || []);
    const copingRate = recentCopingUsage.length / Math.max(recentCheckIns.length, 1);
    
    if (copingRate < 0.5 && profile.coping_strategies?.length > 0) {
      indicators.push({
        type: 'behavioral',
        severity: 'medium',
        confidence: 0.8,
        description: 'Decreased use of established coping strategies',
        triggerFactors: ['coping_abandonment', 'skill_regression'],
        detectedAt: new Date().toISOString(),
        requiresImmediate: false,
      });
    }

    // Crisis event frequency
    const recentCrisisEvents = recentCheckIns.filter(c =>
      c.trigger_events?.some((e: any) => e.intensity >= 8 || e.outcome === 'overwhelmed')
    );

    if (recentCrisisEvents.length >= 3) {
      indicators.push({
        type: 'behavioral',
        severity: 'high',
        confidence: 0.9,
        description: 'Multiple high-intensity crisis events in recent period',
        triggerFactors: ['crisis_frequency', 'overwhelm_pattern'],
        detectedAt: new Date().toISOString(),
        requiresImmediate: true,
      });
    }

    // Sleep disruption
    const averageSleep = recentCheckIns.reduce((sum, c) => sum + (c.sleep_quality || 5), 0) / Math.max(recentCheckIns.length, 1);
    if (averageSleep <= 3) {
      indicators.push({
        type: 'behavioral',
        severity: 'medium',
        confidence: 0.8,
        description: 'Poor sleep quality affects emotional regulation and decision-making',
        triggerFactors: ['sleep_disruption', 'fatigue', 'poor_recovery'],
        detectedAt: new Date().toISOString(),
        requiresImmediate: false,
      });
    }

    return indicators;
  }

  /**
   * Detect environmental risk indicators
   */
  private detectEnvironmentalRisks(userId: string, currentTime: Date): CrisisIndicator[] {
    const indicators: CrisisIndicator[] = [];

    // Weekend/holiday periods (higher risk)
    const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6;
    if (isWeekend) {
      indicators.push({
        type: 'environmental',
        severity: 'low',
        confidence: 0.6,
        description: 'Weekend periods often present increased social and environmental triggers',
        triggerFactors: ['weekend', 'social_pressure', 'schedule_change'],
        detectedAt: currentTime.toISOString(),
        requiresImmediate: false,
      });
    }

    // Late night hours (higher vulnerability)
    const hour = currentTime.getHours();
    if (hour >= 22 || hour <= 5) {
      indicators.push({
        type: 'environmental',
        severity: 'medium',
        confidence: 0.7,
        description: 'Late night/early morning hours show increased vulnerability',
        triggerFactors: ['late_hours', 'reduced_supervision', 'isolation'],
        detectedAt: currentTime.toISOString(),
        requiresImmediate: false,
      });
    }

    return indicators;
  }

  /**
   * Detect physiological risk indicators
   */
  private detectPhysiologicalRisks(recentCheckIns: any[], averageRatings: any): CrisisIndicator[] {
    const indicators: CrisisIndicator[] = [];

    // Energy depletion
    if (averageRatings.energy <= 3) {
      indicators.push({
        type: 'physiological',
        severity: 'medium',
        confidence: 0.7,
        description: 'Severe energy depletion affects decision-making and resilience',
        triggerFactors: ['fatigue', 'energy_depletion', 'physical_exhaustion'],
        detectedAt: new Date().toISOString(),
        requiresImmediate: false,
      });
    }

    // Sleep quality issues
    if (averageRatings.sleep <= 4) {
      indicators.push({
        type: 'physiological',
        severity: 'medium',
        confidence: 0.8,
        description: 'Poor sleep quality compromises emotional regulation and cognitive function',
        triggerFactors: ['sleep_disruption', 'insomnia', 'poor_recovery'],
        detectedAt: new Date().toISOString(),
        requiresImmediate: false,
      });
    }

    return indicators;
  }

  /**
   * Calculate overall risk assessment from indicators
   */
  private calculateRiskAssessment(indicators: CrisisIndicator[], profile: any): CrisisRiskAssessment {
    let totalRiskScore = 0;
    const triggerTypes: TriggerType[] = [];
    const contextualFactors: string[] = [];

    // Calculate weighted risk score
    indicators.forEach(indicator => {
      let indicatorScore = 0;
      
      switch (indicator.severity) {
        case 'critical':
          indicatorScore = 25;
          break;
        case 'high':
          indicatorScore = 20;
          break;
        case 'medium':
          indicatorScore = 15;
          break;
        case 'low':
          indicatorScore = 10;
          break;
      }

      // Apply confidence and type weighting
      const typeWeight = this.RISK_WEIGHTS[indicator.type] || 0.2;
      totalRiskScore += indicatorScore * indicator.confidence * typeWeight;

      // Collect contextual factors
      contextualFactors.push(...indicator.triggerFactors);
    });

    // Normalize score to 0-100 scale
    const riskScore = Math.min(100, Math.max(0, totalRiskScore * 2));

    // Determine overall risk level
    let overallRiskLevel: RiskLevel;
    if (riskScore >= this.CRISIS_THRESHOLDS.IMMEDIATE) {
      overallRiskLevel = 'critical';
    } else if (riskScore >= this.CRISIS_THRESHOLDS.HIGH) {
      overallRiskLevel = 'high';
    } else if (riskScore >= this.CRISIS_THRESHOLDS.MEDIUM) {
      overallRiskLevel = 'medium';
    } else {
      overallRiskLevel = 'low';
    }

    // Determine intervention timing
    let timeToIntervention: 'immediate' | 'within_hour' | 'within_day' | 'monitor';
    const hasImmediateIndicators = indicators.some(i => i.requiresImmediate);
    
    if (hasImmediateIndicators || overallRiskLevel === 'critical') {
      timeToIntervention = 'immediate';
    } else if (overallRiskLevel === 'high') {
      timeToIntervention = 'within_hour';
    } else if (overallRiskLevel === 'medium') {
      timeToIntervention = 'within_day';
    } else {
      timeToIntervention = 'monitor';
    }

    // Extract trigger types from personal triggers and recent events
    if (profile.personal_triggers) {
      triggerTypes.push(...profile.personal_triggers);
    }

    return {
      overallRiskLevel,
      riskScore,
      indicators,
      triggerTypes: [...new Set(triggerTypes)], // Remove duplicates
      interventionRecommended: riskScore >= this.CRISIS_THRESHOLDS.MEDIUM,
      escalationRequired: riskScore >= this.CRISIS_THRESHOLDS.IMMEDIATE,
      timeToIntervention,
      contextualFactors: [...new Set(contextualFactors)], // Remove duplicates
    };
  }

  /**
   * Analyze temporal risk patterns
   */
  private analyzeTemporalPatterns(recentCheckIns: any[]): RiskPattern[] {
    const patterns: RiskPattern[] = [];

    // Analyze time-of-day patterns
    const hourlyRisks: Record<number, number> = {};
    recentCheckIns.forEach(checkIn => {
      const hour = new Date(checkIn.created_at).getHours();
      const riskEvents = checkIn.trigger_events?.filter((e: any) => e.intensity >= 7) || [];
      hourlyRisks[hour] = (hourlyRisks[hour] || 0) + riskEvents.length;
    });

    // Find high-risk hours
    Object.entries(hourlyRisks).forEach(([hour, riskCount]) => {
      if (riskCount >= 2) {
        patterns.push({
          patternType: 'temporal',
          pattern: `High risk during ${hour}:00 hour`,
          riskMultiplier: 1.5 + (riskCount * 0.2),
          historicalOccurrences: riskCount,
          effectiveness: 0.7, // Default effectiveness
        });
      }
    });

    return patterns;
  }

  /**
   * Analyze emotional risk patterns
   */
  private analyzeEmotionalPatterns(recentCheckIns: any[], profile: any): RiskPattern[] {
    const patterns: RiskPattern[] = [];

    // Analyze mood-trigger correlations
    const lowMoodDays = recentCheckIns.filter(c => c.mood_rating <= 4);
    if (lowMoodDays.length >= 3) {
      patterns.push({
        patternType: 'emotional',
        pattern: 'Low mood episodes increase trigger vulnerability',
        riskMultiplier: 1.8,
        historicalOccurrences: lowMoodDays.length,
        effectiveness: 0.6,
      });
    }

    // Analyze stress-trigger correlations
    const highStressDays = recentCheckIns.filter(c => c.stress_level >= 7);
    if (highStressDays.length >= 2) {
      patterns.push({
        patternType: 'emotional',
        pattern: 'High stress periods correlate with increased triggers',
        riskMultiplier: 1.6,
        historicalOccurrences: highStressDays.length,
        effectiveness: 0.7,
      });
    }

    return patterns;
  }

  /**
   * Analyze usage patterns
   */
  private analyzeUsagePatterns(recentCheckIns: any[]): RiskPattern[] {
    const patterns: RiskPattern[] = [];

    // Analyze engagement patterns
    const lowEngagementDays = recentCheckIns.filter(c => !c.reflection_completed && c.ai_coach_interactions === 0);
    if (lowEngagementDays.length >= 3) {
      patterns.push({
        patternType: 'usage',
        pattern: 'Low app engagement correlates with increased risk',
        riskMultiplier: 1.4,
        historicalOccurrences: lowEngagementDays.length,
        effectiveness: 0.8,
      });
    }

    return patterns;
  }

  /**
   * Analyze environmental patterns
   */
  private analyzeEnvironmentalPatterns(userId: string, recentCheckIns: any[]): RiskPattern[] {
    const patterns: RiskPattern[] = [];

    // Analyze weekend patterns
    const weekendIssues = recentCheckIns.filter(c => {
      const dayOfWeek = new Date(c.created_at).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const hasHighIntensityEvents = c.trigger_events?.some((e: any) => e.intensity >= 7);
      return isWeekend && hasHighIntensityEvents;
    });

    if (weekendIssues.length >= 2) {
      patterns.push({
        patternType: 'environmental',
        pattern: 'Weekend periods show increased trigger events',
        riskMultiplier: 1.3,
        historicalOccurrences: weekendIssues.length,
        effectiveness: 0.6,
      });
    }

    return patterns;
  }

  /**
   * Calculate variance for emotional volatility detection
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}

// Export singleton instance
export const crisisDetector = new CrisisDetector();