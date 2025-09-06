/**
 * Personalization Engine - Customizes messages and recommendations based on user profile and history
 * Uses machine learning-like algorithms to adapt to user preferences and effectiveness
 */
import { userRecoveryProfileRepository } from '../repositories/UserRecoveryProfileRepository';
import { dailyCheckInRepository } from '../repositories/DailyCheckInRepository';
import { milestoneRepository } from '../repositories/MilestoneRepository';
import { RecoveryStage, TriggerType, AIInteractionType } from '../types';

export interface PersonalizationProfile {
  userId: string;
  preferredTone: 'encouraging' | 'supportive' | 'celebratory' | 'gentle';
  preferredMessageLength: 'brief' | 'moderate' | 'detailed';
  effectiveCopingStrategies: string[];
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  motivationalTriggers: string[];
  avoidanceTopics: string[];
  responsePatterns: ResponsePattern[];
  learningPreferences: LearningPreference[];
  engagementMetrics: EngagementMetrics;
}

export interface ResponsePattern {
  interactionType: AIInteractionType;
  messageCharacteristics: string[];
  userFeedback: 'helpful' | 'not_helpful' | 'very_helpful';
  effectiveness: number; // 0-1 scale
  frequency: number;
  lastUsed: string;
}

export interface LearningPreference {
  contentType: 'scientific' | 'practical' | 'inspirational' | 'structured';
  complexity: 'simple' | 'moderate' | 'advanced';
  examples: 'personal' | 'general' | 'metaphorical';
  interactivity: 'passive' | 'guided' | 'interactive';
}

export interface EngagementMetrics {
  averageSessionLength: number;
  preferredInteractionFrequency: number;
  responseRate: number;
  feedbackRate: number;
  featureUsage: Record<string, number>;
  timePatterns: Record<string, number>;
}

export interface PersonalizedContent {
  content: string;
  tone: string;
  personalizationFactors: string[];
  confidenceScore: number;
  adaptationReasons: string[];
}

class PersonalizationEngine {
  /**
   * Generate personalized content based on user profile and context
   */
  async personalizeContent(
    userId: string,
    baseContent: string,
    interactionType: AIInteractionType,
    context: any = {}
  ): Promise<PersonalizedContent> {
    try {
      console.log('🎨 Personalizing content for user');

      const profile = await this.getPersonalizationProfile(userId);
      const adaptations = await this.calculateAdaptations(userId, profile, interactionType, context);

      const personalizedContent = this.applyPersonalizations(
        baseContent,
        profile,
        adaptations,
        context
      );

      return personalizedContent;
    } catch (error) {
      console.error('Personalization Engine: Error personalizing content:', error);
      
      // Return base content with minimal personalization
      return {
        content: baseContent,
        tone: 'supportive',
        personalizationFactors: [],
        confidenceScore: 0.3,
        adaptationReasons: ['Error in personalization - using base content'],
      };
    }
  }

  /**
   * Learn from user feedback to improve personalization
   */
  async learnFromFeedback(
    userId: string,
    interactionType: AIInteractionType,
    content: string,
    feedback: 'helpful' | 'not_helpful' | 'very_helpful',
    context: any = {}
  ): Promise<void> {
    try {
      console.log('📚 Learning from user feedback');

      const profile = await this.getPersonalizationProfile(userId);
      
      // Extract characteristics from the content
      const characteristics = this.extractContentCharacteristics(content);
      
      // Update response patterns
      await this.updateResponsePatterns(userId, interactionType, characteristics, feedback);
      
      // Adjust preferences based on feedback
      await this.adjustPreferences(userId, profile, characteristics, feedback, context);
      
      console.log(`Learned from ${feedback} feedback for ${interactionType}`);
    } catch (error) {
      console.error('Personalization Engine: Error learning from feedback:', error);
    }
  }

  /**
   * Get or create personalization profile for user
   */
  async getPersonalizationProfile(userId: string): Promise<PersonalizationProfile> {
    try {
      // In a full implementation, this would be stored in a personalization_profiles table
      // For now, we'll build it dynamically from available data
      
      const recoveryProfile = await userRecoveryProfileRepository.findByUserId(userId);
      const recentCheckIns = await dailyCheckInRepository.getRecentCheckIns(userId, 30);
      const averageRatings = await dailyCheckInRepository.getAverageRatings(userId, 30);

      if (!recoveryProfile) {
        throw new Error('Recovery profile not found');
      }

      // Determine preferred tone based on recovery stage and mood patterns
      const preferredTone = this.inferPreferredTone(recoveryProfile.current_stage, averageRatings);
      
      // Determine preferred message length based on engagement patterns
      const preferredMessageLength = this.inferMessageLengthPreference(recentCheckIns);
      
      // Get effective coping strategies from user's history
      const effectiveCopingStrategies = recoveryProfile.coping_strategies || [];
      
      // Determine preferred time of day from check-in patterns
      const preferredTimeOfDay = this.inferPreferredTimeOfDay(recentCheckIns);
      
      // Build motivational triggers from successful interactions
      const motivationalTriggers = this.inferMotivationalTriggers(recoveryProfile, recentCheckIns);
      
      // Identify topics to avoid based on triggers
      const avoidanceTopics = this.inferAvoidanceTopics(recoveryProfile.personal_triggers);

      return {
        userId,
        preferredTone,
        preferredMessageLength,
        effectiveCopingStrategies,
        preferredTimeOfDay,
        motivationalTriggers,
        avoidanceTopics,
        responsePatterns: [], // Would be loaded from database
        learningPreferences: this.inferLearningPreferences(recoveryProfile, recentCheckIns),
        engagementMetrics: this.calculateEngagementMetrics(recentCheckIns),
      };
    } catch (error) {
      console.error('Personalization Engine: Error getting profile:', error);
      
      // Return default profile
      return {
        userId,
        preferredTone: 'supportive',
        preferredMessageLength: 'moderate',
        effectiveCopingStrategies: [],
        preferredTimeOfDay: 'morning',
        motivationalTriggers: ['progress', 'consistency'],
        avoidanceTopics: [],
        responsePatterns: [],
        learningPreferences: [{
          contentType: 'practical',
          complexity: 'moderate',
          examples: 'general',
          interactivity: 'guided',
        }],
        engagementMetrics: {
          averageSessionLength: 5,
          preferredInteractionFrequency: 1,
          responseRate: 0.7,
          feedbackRate: 0.3,
          featureUsage: {},
          timePatterns: {},
        },
      };
    }
  }

  /**
   * Calculate personalization adaptations
   */
  private async calculateAdaptations(
    userId: string,
    profile: PersonalizationProfile,
    interactionType: AIInteractionType,
    context: any
  ): Promise<string[]> {
    const adaptations: string[] = [];

    // Tone adaptations
    if (profile.preferredTone !== 'supportive') {
      adaptations.push(`tone_${profile.preferredTone}`);
    }

    // Length adaptations
    if (profile.preferredMessageLength === 'brief') {
      adaptations.push('length_brief');
    } else if (profile.preferredMessageLength === 'detailed') {
      adaptations.push('length_detailed');
    }

    // Time-based adaptations
    const currentHour = new Date().getHours();
    const timeOfDay = this.getTimeOfDay(currentHour);
    if (timeOfDay === profile.preferredTimeOfDay) {
      adaptations.push('time_optimal');
    }

    // Recovery stage adaptations
    if (context.recoveryStage) {
      adaptations.push(`stage_${context.recoveryStage}`);
    }

    // Mood-based adaptations
    if (context.recentMoodTrend === 'declining') {
      adaptations.push('mood_support');
    } else if (context.recentMoodTrend === 'improving') {
      adaptations.push('mood_celebrate');
    }

    // Engagement adaptations
    if (profile.engagementMetrics.responseRate < 0.5) {
      adaptations.push('engagement_low');
    } else if (profile.engagementMetrics.responseRate > 0.8) {
      adaptations.push('engagement_high');
    }

    // Coping strategy adaptations
    if (profile.effectiveCopingStrategies.length > 0 && interactionType === 'crisis_intervention') {
      adaptations.push('coping_personalized');
    }

    return adaptations;
  }

  /**
   * Apply personalizations to content
   */
  private applyPersonalizations(
    baseContent: string,
    profile: PersonalizationProfile,
    adaptations: string[],
    context: any
  ): PersonalizedContent {
    let personalizedContent = baseContent;
    const personalizationFactors: string[] = [];
    const adaptationReasons: string[] = [];
    let confidenceScore = 0.7;

    // Apply tone adaptations
    if (adaptations.includes('tone_encouraging')) {
      personalizedContent = this.adjustToneToEncouraging(personalizedContent);
      personalizationFactors.push('encouraging_tone');
      adaptationReasons.push('User responds well to encouraging messages');
      confidenceScore += 0.1;
    } else if (adaptations.includes('tone_gentle')) {
      personalizedContent = this.adjustToneToGentle(personalizedContent);
      personalizationFactors.push('gentle_tone');
      adaptationReasons.push('User prefers gentle, patient communication');
      confidenceScore += 0.1;
    } else if (adaptations.includes('tone_celebratory')) {
      personalizedContent = this.adjustToneToCelebratory(personalizedContent);
      personalizationFactors.push('celebratory_tone');
      adaptationReasons.push('User enjoys celebration of achievements');
      confidenceScore += 0.1;
    }

    // Apply length adaptations
    if (adaptations.includes('length_brief')) {
      personalizedContent = this.shortenContent(personalizedContent);
      personalizationFactors.push('brief_format');
      adaptationReasons.push('User prefers concise messages');
      confidenceScore += 0.05;
    } else if (adaptations.includes('length_detailed')) {
      personalizedContent = this.expandContent(personalizedContent, context);
      personalizationFactors.push('detailed_format');
      adaptationReasons.push('User engages better with detailed content');
      confidenceScore += 0.05;
    }

    // Apply time-based adaptations
    if (adaptations.includes('time_optimal')) {
      personalizedContent = this.addTimeContextualElements(personalizedContent, profile.preferredTimeOfDay);
      personalizationFactors.push('time_context');
      adaptationReasons.push('Message timed for user\'s preferred interaction time');
      confidenceScore += 0.1;
    }

    // Apply mood-based adaptations
    if (adaptations.includes('mood_support')) {
      personalizedContent = this.addSupportiveElements(personalizedContent);
      personalizationFactors.push('mood_support');
      adaptationReasons.push('Extra support provided due to recent mood decline');
      confidenceScore += 0.1;
    } else if (adaptations.includes('mood_celebrate')) {
      personalizedContent = this.addCelebratoryElements(personalizedContent);
      personalizationFactors.push('mood_celebration');
      adaptationReasons.push('Celebrating recent mood improvements');
      confidenceScore += 0.1;
    }

    // Apply engagement adaptations
    if (adaptations.includes('engagement_low')) {
      personalizedContent = this.addEngagementHooks(personalizedContent);
      personalizationFactors.push('engagement_boost');
      adaptationReasons.push('Enhanced engagement elements for increased interaction');
      confidenceScore += 0.05;
    }

    // Apply personalized coping strategies
    if (adaptations.includes('coping_personalized') && profile.effectiveCopingStrategies.length > 0) {
      personalizedContent = this.addPersonalizedCopingReferences(personalizedContent, profile.effectiveCopingStrategies);
      personalizationFactors.push('personalized_coping');
      adaptationReasons.push('Referenced user\'s previously effective coping strategies');
      confidenceScore += 0.15;
    }

    // Add personal motivational triggers
    if (profile.motivationalTriggers.length > 0) {
      personalizedContent = this.incorporateMotivationalTriggers(personalizedContent, profile.motivationalTriggers);
      personalizationFactors.push('motivational_triggers');
      adaptationReasons.push('Incorporated user\'s personal motivational themes');
      confidenceScore += 0.1;
    }

    return {
      content: personalizedContent,
      tone: profile.preferredTone,
      personalizationFactors,
      confidenceScore: Math.min(confidenceScore, 1.0),
      adaptationReasons,
    };
  }

  /**
   * Infer preferred tone from recovery stage and mood patterns
   */
  private inferPreferredTone(stage: RecoveryStage, averageRatings: any): 'encouraging' | 'supportive' | 'celebratory' | 'gentle' {
    if (stage === 'challenge' || averageRatings.mood < 5) {
      return 'gentle';
    } else if (stage === 'growth' || averageRatings.mood >= 8) {
      return 'celebratory';
    } else if (stage === 'early' || averageRatings.mood < 6) {
      return 'encouraging';
    } else {
      return 'supportive';
    }
  }

  /**
   * Infer message length preference from engagement patterns
   */
  private inferMessageLengthPreference(recentCheckIns: any[]): 'brief' | 'moderate' | 'detailed' {
    // Analyze completion rates and interaction times
    const completionRate = recentCheckIns.filter(c => c.reflection_completed).length / recentCheckIns.length;
    const averageInteractions = recentCheckIns.reduce((sum, c) => sum + (c.ai_coach_interactions || 0), 0) / recentCheckIns.length;

    if (completionRate < 0.5 || averageInteractions < 1) {
      return 'brief';
    } else if (completionRate > 0.8 && averageInteractions > 2) {
      return 'detailed';
    } else {
      return 'moderate';
    }
  }

  /**
   * Infer preferred time of day from check-in patterns
   */
  private inferPreferredTimeOfDay(recentCheckIns: any[]): 'morning' | 'afternoon' | 'evening' | 'night' {
    const timePatterns = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    recentCheckIns.forEach(checkIn => {
      const hour = new Date(checkIn.created_at).getHours();
      const timeOfDay = this.getTimeOfDay(hour);
      timePatterns[timeOfDay]++;
    });

    // Return the time with most check-ins
    return Object.entries(timePatterns).reduce((a, b) => timePatterns[a[0]] > timePatterns[b[0]] ? a : b)[0] as any;
  }

  /**
   * Get time of day from hour
   */
  private getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Infer motivational triggers from user data
   */
  private inferMotivationalTriggers(profile: any, recentCheckIns: any[]): string[] {
    const triggers: string[] = [];

    // Progress-based triggers
    if (profile.days_since_last_setback >= 30) {
      triggers.push('progress_milestones');
    }

    // Consistency triggers
    const consistentCheckIns = recentCheckIns.length >= 7;
    if (consistentCheckIns) {
      triggers.push('consistency');
    }

    // Growth triggers
    if (profile.current_stage === 'growth') {
      triggers.push('personal_growth');
      triggers.push('helping_others');
    }

    // Achievement triggers
    const highPerformance = recentCheckIns.some(c => c.focus_sessions_completed >= 3);
    if (highPerformance) {
      triggers.push('achievement');
    }

    return triggers;
  }

  /**
   * Infer topics to avoid based on triggers
   */
  private inferAvoidanceTopics(personalTriggers: TriggerType[]): string[] {
    const avoidanceMap: Record<TriggerType, string[]> = {
      stress: ['pressure', 'deadlines', 'overwhelming'],
      loneliness: ['isolation', 'abandonment'],
      anxiety: ['uncertainty', 'worst-case scenarios'],
      depression: ['hopelessness', 'worthlessness'],
      anger: ['frustration', 'injustice'],
      boredom: ['monotony', 'lack of purpose'],
      fatigue: ['exhaustion', 'burnout'],
      custom: [],
    };

    const topics: string[] = [];
    personalTriggers.forEach(trigger => {
      topics.push(...(avoidanceMap[trigger] || []));
    });

    return [...new Set(topics)]; // Remove duplicates
  }

  /**
   * Infer learning preferences
   */
  private inferLearningPreferences(profile: any, recentCheckIns: any[]): LearningPreference[] {
    // Base preferences on recovery stage and engagement patterns
    const preferences: LearningPreference[] = [];

    if (profile.current_stage === 'early' || profile.current_stage === 'challenge') {
      preferences.push({
        contentType: 'practical',
        complexity: 'simple',
        examples: 'personal',
        interactivity: 'guided',
      });
    } else if (profile.current_stage === 'maintenance') {
      preferences.push({
        contentType: 'structured',
        complexity: 'moderate',
        examples: 'general',
        interactivity: 'interactive',
      });
    } else if (profile.current_stage === 'growth') {
      preferences.push({
        contentType: 'scientific',
        complexity: 'advanced',
        examples: 'metaphorical',
        interactivity: 'interactive',
      });
    }

    return preferences;
  }

  /**
   * Calculate engagement metrics
   */
  private calculateEngagementMetrics(recentCheckIns: any[]): EngagementMetrics {
    const totalCheckIns = recentCheckIns.length;
    const completedReflections = recentCheckIns.filter(c => c.reflection_completed).length;
    const totalInteractions = recentCheckIns.reduce((sum, c) => sum + (c.ai_coach_interactions || 0), 0);

    return {
      averageSessionLength: 5, // Would be calculated from actual session data
      preferredInteractionFrequency: totalInteractions / Math.max(totalCheckIns, 1),
      responseRate: completedReflections / Math.max(totalCheckIns, 1),
      feedbackRate: 0.3, // Would be calculated from feedback data
      featureUsage: {
        daily_checkin: totalCheckIns,
        reflection: completedReflections,
        ai_coach: totalInteractions,
      },
      timePatterns: {}, // Would be calculated from interaction timestamps
    };
  }

  /**
   * Extract content characteristics for learning
   */
  private extractContentCharacteristics(content: string): string[] {
    const characteristics: string[] = [];
    const contentLower = content.toLowerCase();

    // Tone characteristics
    if (contentLower.includes('congratulations') || contentLower.includes('celebrate')) {
      characteristics.push('celebratory');
    }
    if (contentLower.includes('gentle') || contentLower.includes('patient')) {
      characteristics.push('gentle');
    }
    if (contentLower.includes('strength') || contentLower.includes('capable')) {
      characteristics.push('encouraging');
    }

    // Length characteristics
    if (content.length < 100) {
      characteristics.push('brief');
    } else if (content.length > 300) {
      characteristics.push('detailed');
    } else {
      characteristics.push('moderate');
    }

    // Content type characteristics
    if (contentLower.includes('try') || contentLower.includes('practice')) {
      characteristics.push('actionable');
    }
    if (contentLower.includes('research') || contentLower.includes('studies')) {
      characteristics.push('scientific');
    }
    if (contentLower.includes('story') || contentLower.includes('example')) {
      characteristics.push('narrative');
    }

    return characteristics;
  }

  /**
   * Update response patterns based on feedback
   */
  private async updateResponsePatterns(
    userId: string,
    interactionType: AIInteractionType,
    characteristics: string[],
    feedback: 'helpful' | 'not_helpful' | 'very_helpful'
  ): Promise<void> {
    // In a full implementation, this would update a response_patterns table
    console.log(`Updating response patterns for ${interactionType}: ${characteristics.join(', ')} -> ${feedback}`);
  }

  /**
   * Adjust preferences based on feedback
   */
  private async adjustPreferences(
    userId: string,
    profile: PersonalizationProfile,
    characteristics: string[],
    feedback: 'helpful' | 'not_helpful' | 'very_helpful',
    context: any
  ): Promise<void> {
    // In a full implementation, this would update user preferences
    console.log(`Adjusting preferences based on ${feedback} feedback`);
  }

  // Content modification methods
  private adjustToneToEncouraging(content: string): string {
    return content
      .replace(/you can/gi, 'you have the strength to')
      .replace(/try to/gi, 'you\'re capable of')
      .replace(/difficult/gi, 'challenging but manageable');
  }

  private adjustToneToGentle(content: string): string {
    return content
      .replace(/you should/gi, 'you might consider')
      .replace(/must/gi, 'could')
      .replace(/need to/gi, 'when you\'re ready, you can');
  }

  private adjustToneToCelebratory(content: string): string {
    return content
      .replace(/good job/gi, 'amazing work')
      .replace(/progress/gi, 'incredible progress')
      .replace(/keep going/gi, 'you\'re absolutely crushing it');
  }

  private shortenContent(content: string): string {
    const sentences = content.split('. ');
    return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
  }

  private expandContent(content: string, context: any): string {
    let expanded = content;
    
    if (context.recoveryStage) {
      expanded += ` This is especially important in your ${context.recoveryStage} stage of recovery.`;
    }
    
    expanded += ' Remember that every small step forward is building your foundation for lasting change.';
    
    return expanded;
  }

  private addTimeContextualElements(content: string, timeOfDay: string): string {
    const timeGreetings = {
      morning: 'Good morning! ',
      afternoon: 'Hope your afternoon is going well! ',
      evening: 'As your day winds down, ',
      night: 'Even at this late hour, ',
    };

    return timeGreetings[timeOfDay] + content;
  }

  private addSupportiveElements(content: string): string {
    return content + ' Remember, it\'s okay to have difficult moments - they\'re part of the journey. You\'re not alone in this.';
  }

  private addCelebratoryElements(content: string): string {
    return content + ' Your positive momentum is truly inspiring! Keep building on this success.';
  }

  private addEngagementHooks(content: string): string {
    return content + ' What\'s one small thing you could try today? Your recovery journey is unique and valuable.';
  }

  private addPersonalizedCopingReferences(content: string, strategies: string[]): string {
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    return content + ` Remember how well ${strategy} has worked for you before - that\'s a tool you can always return to.`;
  }

  private incorporateMotivationalTriggers(content: string, triggers: string[]): string {
    let enhanced = content;
    
    if (triggers.includes('progress_milestones')) {
      enhanced = enhanced.replace(/progress/gi, 'milestone progress');
    }
    
    if (triggers.includes('consistency')) {
      enhanced += ' Your consistency is building real, lasting change.';
    }
    
    if (triggers.includes('helping_others')) {
      enhanced += ' Your journey can inspire and help others too.';
    }
    
    return enhanced;
  }
}

// Export singleton instance
export const personalizationEngine = new PersonalizationEngine();