/**
 * Recovery Coach Manager - Main orchestration class for AI-powered recovery coaching
 * Provides personalized support, motivation, and guidance based on recovery science
 */
import { aiIntegrationService } from '../AIIntegrationService';
import { dataAnonymizationService } from '../DataAnonymizationService';
import { aiErrorHandler } from '../AIErrorHandler';
import { userRecoveryProfileRepository } from '../repositories/UserRecoveryProfileRepository';
import { dailyCheckInRepository } from '../repositories/DailyCheckInRepository';
import { recoveryStageTracker } from './RecoveryStageTracker';
import { personalizationEngine } from './PersonalizationEngine';
import { RecoveryStage, TriggerType } from '../types';

export interface RecoveryCoachContext {
  userId: string;
  recoveryStage: RecoveryStage;
  daysSinceLastSetback: number;
  recentMoodTrend: 'improving' | 'stable' | 'declining';
  engagementLevel: 'high' | 'medium' | 'low';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  riskFactors: string[];
  personalTriggers: TriggerType[];
  copingStrategies: string[];
}

export interface MotivationMessage {
  content: string;
  tone: 'encouraging' | 'supportive' | 'celebratory' | 'gentle';
  actionable: boolean;
  actionItems?: string[];
  source: 'ai' | 'fallback';
  confidence: number;
  personalizedElements: string[];
}

export interface CopingStrategy {
  name: string;
  description: string;
  category: 'immediate' | 'short_term' | 'long_term';
  difficulty: 'easy' | 'medium' | 'hard';
  timeRequired: string;
  effectiveness: number; // 0-1 scale
  triggerTypes: TriggerType[];
  instructions: string[];
}

class RecoveryCoachManager {
  /**
   * Generate personalized daily motivation message
   */
  async generateDailyMotivation(userId: string): Promise<MotivationMessage> {
    try {
      console.log('🎯 Generating daily motivation for user');

      // Update recovery stage if needed
      await recoveryStageTracker.evaluateStageProgression(userId);

      // Get user context
      const context = await this.buildRecoveryContext(userId);
      
      // Create AI prompt based on recovery stage and context
      const prompt = this.buildMotivationPrompt(context);
      
      // Anonymize the prompt
      const safePrompt = await dataAnonymizationService.createSafePrompt(prompt, context);
      
      // Generate AI response
      const aiResponse = await aiIntegrationService.generateResponse({
        prompt: safePrompt.prompt,
        category: 'motivation',
        userId: context.userId,
      });

      // Parse and enhance response
      let motivationMessage = this.parseMotivationResponse(aiResponse, context);

      // Personalize the content
      const personalizedContent = await personalizationEngine.personalizeContent(
        userId,
        motivationMessage.content,
        'daily_motivation',
        context
      );

      // Update message with personalized content
      motivationMessage = {
        ...motivationMessage,
        content: personalizedContent.content,
        personalizedElements: [
          ...motivationMessage.personalizedElements,
          ...personalizedContent.personalizationFactors,
        ],
      };

      // Log interaction
      await this.logCoachInteraction(userId, 'daily_motivation', safePrompt.prompt, aiResponse.content);

      return motivationMessage;
    } catch (error) {
      console.error('Recovery Coach: Error generating daily motivation:', error);
      
      // Return fallback motivation
      return this.getFallbackMotivation(userId);
    }
  }

  /**
   * Provide personalized coping strategies
   */
  async provideCopingStrategies(userId: string, triggerType: TriggerType, urgency: 'low' | 'medium' | 'high' = 'medium'): Promise<CopingStrategy[]> {
    try {
      console.log(`🛠️ Providing coping strategies for ${triggerType} trigger`);

      const context = await this.buildRecoveryContext(userId);
      
      // Build prompt for coping strategies
      const prompt = this.buildCopingStrategiesPrompt(context, triggerType, urgency);
      
      // Anonymize the prompt
      const safePrompt = await dataAnonymizationService.createSafePrompt(prompt, { triggerType, urgency });
      
      // Generate AI response
      const aiResponse = await aiIntegrationService.generateResponse({
        prompt: safePrompt.prompt,
        category: 'education',
        userId: context.userId,
      });

      // Parse strategies from response
      let strategies = this.parseCopingStrategiesResponse(aiResponse, triggerType);

      // Personalize strategy descriptions
      for (let i = 0; i < strategies.length; i++) {
        const personalizedContent = await personalizationEngine.personalizeContent(
          userId,
          strategies[i].description,
          'crisis_intervention',
          { triggerType, urgency, ...context }
        );
        
        strategies[i] = {
          ...strategies[i],
          description: personalizedContent.content,
        };
      }

      // Log interaction
      await this.logCoachInteraction(userId, 'education', safePrompt.prompt, aiResponse.content);

      return strategies;
    } catch (error) {
      console.error('Recovery Coach: Error providing coping strategies:', error);
      
      // Return fallback strategies
      return this.getFallbackCopingStrategies(triggerType);
    }
  }

  /**
   * Update user's recovery stage based on progress
   */
  async updateRecoveryStage(userId: string, progressData: any): Promise<RecoveryStage> {
    try {
      // Use the RecoveryStageTracker for more sophisticated stage evaluation
      const stageTransition = await recoveryStageTracker.evaluateStageProgression(userId);
      
      if (stageTransition) {
        console.log(`Recovery stage updated: ${stageTransition.fromStage} → ${stageTransition.toStage}`);
        return stageTransition.toStage;
      }

      // If no transition, return current stage
      const currentProfile = await userRecoveryProfileRepository.findByUserId(userId);
      return currentProfile?.current_stage || 'early';
    } catch (error) {
      console.error('Recovery Coach: Error updating recovery stage:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive recovery stage metrics
   */
  async getRecoveryStageMetrics(userId: string) {
    try {
      return await recoveryStageTracker.getStageMetrics(userId);
    } catch (error) {
      console.error('Recovery Coach: Error getting stage metrics:', error);
      throw error;
    }
  }

  /**
   * Get recovery progression analysis
   */
  async getRecoveryProgression(userId: string) {
    try {
      return await recoveryStageTracker.getRecoveryProgression(userId);
    } catch (error) {
      console.error('Recovery Coach: Error getting recovery progression:', error);
      throw error;
    }
  }

  /**
   * Learn from user feedback to improve personalization
   */
  async learnFromUserFeedback(
    userId: string,
    interactionType: 'daily_motivation' | 'coping_strategies' | 'crisis_intervention',
    content: string,
    feedback: 'helpful' | 'not_helpful' | 'very_helpful',
    context: any = {}
  ): Promise<void> {
    try {
      const aiInteractionType = interactionType === 'daily_motivation' ? 'daily_motivation' : 
                               interactionType === 'coping_strategies' ? 'education' : 'crisis_intervention';
      
      await personalizationEngine.learnFromFeedback(
        userId,
        aiInteractionType,
        content,
        feedback,
        context
      );
      
      console.log(`Learned from user feedback: ${feedback} for ${interactionType}`);
    } catch (error) {
      console.error('Recovery Coach: Error learning from feedback:', error);
    }
  }

  /**
   * Get personalized daily recommendations
   */
  async getDailyRecommendations(userId: string): Promise<{
    motivation: MotivationMessage;
    stageMetrics: any;
    recommendations: string[];
  }> {
    try {
      console.log('📋 Generating daily recommendations');

      // Get motivation message
      const motivation = await this.generateDailyMotivation(userId);
      
      // Get stage metrics
      const stageMetrics = await this.getRecoveryStageMetrics(userId);
      
      // Generate personalized recommendations based on stage and context
      const context = await this.buildRecoveryContext(userId);
      const recommendations = this.generateContextualRecommendations(context, stageMetrics);

      return {
        motivation,
        stageMetrics,
        recommendations,
      };
    } catch (error) {
      console.error('Recovery Coach: Error getting daily recommendations:', error);
      throw error;
    }
  }

  /**
   * Build recovery context for AI prompts
   */
  private async buildRecoveryContext(userId: string): Promise<RecoveryCoachContext> {
    try {
      // Get user profile
      const profile = await userRecoveryProfileRepository.findByUserId(userId);
      if (!profile) {
        throw new Error('User recovery profile not found');
      }

      // Get recent check-ins for mood trend
      const recentCheckIns = await dailyCheckInRepository.getRecentCheckIns(userId, 7);
      const averageRatings = await dailyCheckInRepository.getAverageRatings(userId, 7);

      // Determine mood trend
      let recentMoodTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentCheckIns.length >= 3) {
        const recent = recentCheckIns.slice(0, 3).map(c => c.mood_rating);
        const older = recentCheckIns.slice(3, 6).map(c => c.mood_rating);
        
        if (recent.length > 0 && older.length > 0) {
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
          
          if (recentAvg > olderAvg + 1) {
            recentMoodTrend = 'improving';
          } else if (recentAvg < olderAvg - 1) {
            recentMoodTrend = 'declining';
          }
        }
      }

      // Determine engagement level
      const checkInStreak = await dailyCheckInRepository.getCheckInStreak(userId);
      let engagementLevel: 'high' | 'medium' | 'low' = 'medium';
      
      if (checkInStreak >= 7) {
        engagementLevel = 'high';
      } else if (checkInStreak < 3) {
        engagementLevel = 'low';
      }

      // Determine time of day
      const hour = new Date().getHours();
      let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
      if (hour < 6) timeOfDay = 'night';
      else if (hour < 12) timeOfDay = 'morning';
      else if (hour < 18) timeOfDay = 'afternoon';
      else timeOfDay = 'evening';

      // Get risk factors from recent check-ins
      const riskFactors: string[] = [];
      if (averageRatings.stress > 7) riskFactors.push('high_stress');
      if (averageRatings.mood < 4) riskFactors.push('low_mood');
      if (averageRatings.sleep < 5) riskFactors.push('poor_sleep');
      if (checkInStreak < 3) riskFactors.push('low_engagement');

      return {
        userId,
        recoveryStage: profile.current_stage,
        daysSinceLastSetback: profile.days_since_last_setback,
        recentMoodTrend,
        engagementLevel,
        timeOfDay,
        riskFactors,
        personalTriggers: profile.personal_triggers,
        copingStrategies: profile.coping_strategies,
      };
    } catch (error) {
      console.error('Recovery Coach: Error building context:', error);
      throw error;
    }
  }

  /**
   * Build motivation prompt based on context
   */
  private buildMotivationPrompt(context: RecoveryCoachContext): string {
    let prompt = `Generate a personalized, supportive message for someone in recovery. `;
    
    // Add stage-specific context
    switch (context.recoveryStage) {
      case 'early':
        prompt += `They are in early recovery (${context.daysSinceLastSetback} days progress). Focus on encouragement, building confidence, and celebrating small wins. `;
        break;
      case 'maintenance':
        prompt += `They are in maintenance stage (${context.daysSinceLastSetback} days progress). Focus on consistency, routine building, and long-term vision. `;
        break;
      case 'challenge':
        prompt += `They are facing challenges in recovery. Focus on resilience, coping strategies, and hope. Be extra supportive and understanding. `;
        break;
      case 'growth':
        prompt += `They are in growth stage with strong recovery (${context.daysSinceLastSetback} days progress). Focus on personal development, helping others, and life expansion. `;
        break;
    }

    // Add mood context
    switch (context.recentMoodTrend) {
      case 'improving':
        prompt += `Their mood has been improving recently. Acknowledge this positive trend. `;
        break;
      case 'declining':
        prompt += `Their mood has been declining. Provide extra support and gentle encouragement. `;
        break;
      case 'stable':
        prompt += `Their mood has been stable. Focus on maintaining momentum. `;
        break;
    }

    // Add time-of-day context
    switch (context.timeOfDay) {
      case 'morning':
        prompt += `It's morning - focus on setting positive intentions for the day. `;
        break;
      case 'afternoon':
        prompt += `It's afternoon - provide midday encouragement and energy. `;
        break;
      case 'evening':
        prompt += `It's evening - focus on reflection and preparing for restful sleep. `;
        break;
      case 'night':
        prompt += `It's late night - provide calming support and encourage healthy sleep habits. `;
        break;
    }

    // Add risk factors if present
    if (context.riskFactors.length > 0) {
      prompt += `Be aware they may be experiencing: ${context.riskFactors.join(', ')}. `;
    }

    // Add engagement context
    switch (context.engagementLevel) {
      case 'high':
        prompt += `They are highly engaged with their recovery. Acknowledge their commitment. `;
        break;
      case 'low':
        prompt += `They have low engagement recently. Gently encourage re-engagement without pressure. `;
        break;
    }

    prompt += `Keep the message concise (2-3 sentences), warm, hopeful, and actionable. Use evidence-based recovery principles. Avoid toxic positivity.`;

    return prompt;
  }

  /**
   * Build coping strategies prompt
   */
  private buildCopingStrategiesPrompt(context: RecoveryCoachContext, triggerType: TriggerType, urgency: 'low' | 'medium' | 'high'): string {
    let prompt = `Provide 3-5 evidence-based coping strategies for someone experiencing ${triggerType} triggers in recovery. `;
    
    // Add urgency context
    switch (urgency) {
      case 'high':
        prompt += `This is urgent - focus on immediate, practical strategies they can use right now. `;
        break;
      case 'medium':
        prompt += `Provide both immediate and short-term strategies. `;
        break;
      case 'low':
        prompt += `Focus on preventive and long-term coping strategies. `;
        break;
    }

    // Add recovery stage context
    prompt += `They are in ${context.recoveryStage} stage of recovery with ${context.daysSinceLastSetback} days of progress. `;

    // Add existing strategies context
    if (context.copingStrategies.length > 0) {
      prompt += `They have used these strategies before: ${context.copingStrategies.slice(0, 3).join(', ')}. Build on these or suggest complementary approaches. `;
    }

    prompt += `Format as a numbered list with brief explanations. Base strategies on CBT, mindfulness, and behavioral activation principles. Make them specific and actionable.`;

    return prompt;
  }

  /**
   * Parse motivation response from AI
   */
  private parseMotivationResponse(aiResponse: any, context: RecoveryCoachContext): MotivationMessage {
    const content = aiResponse.content || 'Keep moving forward in your recovery journey. You have the strength to overcome today\'s challenges.';
    
    // Determine tone based on content
    let tone: 'encouraging' | 'supportive' | 'celebratory' | 'gentle' = 'supportive';
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('congratulations') || contentLower.includes('celebrate') || contentLower.includes('achievement')) {
      tone = 'celebratory';
    } else if (contentLower.includes('encourage') || contentLower.includes('strength') || contentLower.includes('capable')) {
      tone = 'encouraging';
    } else if (contentLower.includes('gentle') || contentLower.includes('patient') || contentLower.includes('kind')) {
      tone = 'gentle';
    }

    // Extract action items if present
    const actionItems: string[] = [];
    const actionPatterns = [
      /try\s+([^.!?]+)/gi,
      /consider\s+([^.!?]+)/gi,
      /practice\s+([^.!?]+)/gi,
      /focus\s+on\s+([^.!?]+)/gi,
    ];

    actionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const action = match.replace(/^(try|consider|practice|focus on)\s+/i, '').trim();
          if (action.length > 5 && action.length < 100) {
            actionItems.push(action);
          }
        });
      }
    });

    // Identify personalized elements
    const personalizedElements: string[] = [];
    if (content.includes(context.daysSinceLastSetback.toString())) {
      personalizedElements.push('progress_days');
    }
    if (context.recoveryStage === 'early' && contentLower.includes('beginning')) {
      personalizedElements.push('recovery_stage');
    }
    if (context.timeOfDay === 'morning' && contentLower.includes('morning')) {
      personalizedElements.push('time_context');
    }

    return {
      content,
      tone,
      actionable: actionItems.length > 0,
      actionItems: actionItems.slice(0, 3), // Limit to 3 action items
      source: aiResponse.source === 'ai' ? 'ai' : 'fallback',
      confidence: aiResponse.confidence,
      personalizedElements,
    };
  }

  /**
   * Parse coping strategies from AI response
   */
  private parseCopingStrategiesResponse(aiResponse: any, triggerType: TriggerType): CopingStrategy[] {
    const content = aiResponse.content || '';
    const strategies: CopingStrategy[] = [];

    // Try to parse numbered list format
    const listItems = content.match(/\d+\.\s*([^0-9]+?)(?=\d+\.|$)/gs);
    
    if (listItems && listItems.length > 0) {
      listItems.forEach((item, index) => {
        const cleanItem = item.replace(/^\d+\.\s*/, '').trim();
        const lines = cleanItem.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
          const name = lines[0].split(':')[0].trim();
          const description = lines.join(' ').trim();
          
          strategies.push({
            name: name || `Strategy ${index + 1}`,
            description,
            category: this.categorizeCopingStrategy(description, triggerType),
            difficulty: this.assessStrategyDifficulty(description),
            timeRequired: this.estimateTimeRequired(description),
            effectiveness: 0.8, // Default effectiveness
            triggerTypes: [triggerType],
            instructions: this.extractInstructions(description),
          });
        }
      });
    }

    // If parsing failed, create fallback strategies
    if (strategies.length === 0) {
      return this.getFallbackCopingStrategies(triggerType);
    }

    return strategies.slice(0, 5); // Limit to 5 strategies
  }

  /**
   * Get fallback motivation message
   */
  private async getFallbackMotivation(userId: string): Promise<MotivationMessage> {
    try {
      const context = await this.buildRecoveryContext(userId);
      
      const fallbackMessages = {
        early: [
          "Every day of recovery is a victory. You're building strength with each positive choice you make.",
          "Your journey in recovery shows incredible courage. Take it one moment at a time, and be patient with yourself.",
          "Recovery is about progress, not perfection. You're doing better than you think, and each day matters.",
        ],
        maintenance: [
          "Your consistency in recovery is building lasting change. Trust the process and keep moving forward.",
          "You've established strong foundations in your recovery. Your dedication is creating positive transformation.",
          "Maintaining your recovery progress takes real commitment. You should be proud of your perseverance.",
        ],
        challenge: [
          "Difficult moments are part of the recovery process. You have the tools and strength to navigate through this.",
          "This challenging period will pass. Focus on the coping strategies that have worked for you before.",
          "Your resilience has brought you this far. Draw on that inner strength to overcome today's obstacles.",
        ],
        growth: [
          "Your recovery journey has given you wisdom and strength. Use these gifts to continue growing and helping others.",
          "You've transformed challenges into opportunities for growth. Keep embracing the positive changes in your life.",
          "Your progress in recovery is inspiring. You're not just healing yourself, but becoming a beacon of hope.",
        ],
      };

      const stageMessages = fallbackMessages[context.recoveryStage];
      const selectedMessage = stageMessages[Math.floor(Math.random() * stageMessages.length)];

      return {
        content: selectedMessage,
        tone: 'supportive',
        actionable: false,
        source: 'fallback',
        confidence: 0.7,
        personalizedElements: ['recovery_stage'],
      };
    } catch (error) {
      console.error('Recovery Coach: Error getting fallback motivation:', error);
      
      return {
        content: "Your recovery journey is unique and valuable. Keep moving forward with patience and self-compassion.",
        tone: 'supportive',
        actionable: false,
        source: 'fallback',
        confidence: 0.6,
        personalizedElements: [],
      };
    }
  }

  /**
   * Get fallback coping strategies
   */
  private getFallbackCopingStrategies(triggerType: TriggerType): CopingStrategy[] {
    const strategies: Record<TriggerType, CopingStrategy[]> = {
      stress: [
        {
          name: 'Deep Breathing Exercise',
          description: 'Take 5 deep breaths, counting to 4 on inhale and 6 on exhale. This activates your parasympathetic nervous system.',
          category: 'immediate',
          difficulty: 'easy',
          timeRequired: '2-3 minutes',
          effectiveness: 0.8,
          triggerTypes: ['stress', 'anxiety'],
          instructions: ['Find a quiet space', 'Sit comfortably', 'Breathe in for 4 counts', 'Hold for 2 counts', 'Exhale for 6 counts', 'Repeat 5 times'],
        },
        {
          name: 'Progressive Muscle Relaxation',
          description: 'Systematically tense and release muscle groups to reduce physical stress and tension.',
          category: 'short_term',
          difficulty: 'medium',
          timeRequired: '10-15 minutes',
          effectiveness: 0.9,
          triggerTypes: ['stress', 'anxiety'],
          instructions: ['Start with your toes', 'Tense for 5 seconds', 'Release and notice the relaxation', 'Move up through each muscle group'],
        },
      ],
      loneliness: [
        {
          name: 'Reach Out to Support Network',
          description: 'Contact a trusted friend, family member, or support group member for connection and encouragement.',
          category: 'immediate',
          difficulty: 'easy',
          timeRequired: '5-30 minutes',
          effectiveness: 0.9,
          triggerTypes: ['loneliness'],
          instructions: ['Choose someone you trust', 'Be honest about how you\'re feeling', 'Ask for support or just to talk', 'Express gratitude for their time'],
        },
      ],
      boredom: [
        {
          name: 'Engage in Creative Activity',
          description: 'Start a creative project like drawing, writing, music, or crafts to redirect mental energy positively.',
          category: 'short_term',
          difficulty: 'easy',
          timeRequired: '15-60 minutes',
          effectiveness: 0.8,
          triggerTypes: ['boredom'],
          instructions: ['Choose an activity you enjoy', 'Set a small, achievable goal', 'Focus on the process, not perfection', 'Celebrate your creativity'],
        },
      ],
      anxiety: [
        {
          name: '5-4-3-2-1 Grounding Technique',
          description: 'Use your senses to ground yourself in the present moment and reduce anxiety.',
          category: 'immediate',
          difficulty: 'easy',
          timeRequired: '3-5 minutes',
          effectiveness: 0.8,
          triggerTypes: ['anxiety', 'stress'],
          instructions: ['Name 5 things you can see', 'Name 4 things you can touch', 'Name 3 things you can hear', 'Name 2 things you can smell', 'Name 1 thing you can taste'],
        },
      ],
      depression: [
        {
          name: 'Behavioral Activation',
          description: 'Engage in a small, meaningful activity to improve mood and create a sense of accomplishment.',
          category: 'short_term',
          difficulty: 'medium',
          timeRequired: '15-30 minutes',
          effectiveness: 0.7,
          triggerTypes: ['depression'],
          instructions: ['Choose a simple, enjoyable activity', 'Set a small goal', 'Focus on the action, not the outcome', 'Acknowledge your effort'],
        },
      ],
      anger: [
        {
          name: 'Physical Release Exercise',
          description: 'Use physical movement to release anger energy in a healthy way.',
          category: 'immediate',
          difficulty: 'easy',
          timeRequired: '5-15 minutes',
          effectiveness: 0.8,
          triggerTypes: ['anger', 'stress'],
          instructions: ['Do jumping jacks or push-ups', 'Go for a brisk walk', 'Hit a pillow or punching bag', 'Focus on releasing the energy'],
        },
      ],
      fatigue: [
        {
          name: 'Energy Management',
          description: 'Use gentle movement and mindfulness to work with fatigue rather than against it.',
          category: 'short_term',
          difficulty: 'easy',
          timeRequired: '10-20 minutes',
          effectiveness: 0.7,
          triggerTypes: ['fatigue'],
          instructions: ['Take a short walk outside', 'Do gentle stretching', 'Practice mindful breathing', 'Stay hydrated'],
        },
      ],
      custom: [
        {
          name: 'Mindful Awareness',
          description: 'Practice present-moment awareness to understand and work with your current experience.',
          category: 'immediate',
          difficulty: 'medium',
          timeRequired: '5-10 minutes',
          effectiveness: 0.8,
          triggerTypes: ['custom'],
          instructions: ['Notice what you\'re feeling', 'Accept the feeling without judgment', 'Ask what you need right now', 'Choose a kind response to yourself'],
        },
      ],
    };

    return strategies[triggerType] || strategies.custom;
  }

  /**
   * Categorize coping strategy based on description
   */
  private categorizeCopingStrategy(description: string, triggerType: TriggerType): 'immediate' | 'short_term' | 'long_term' {
    const descLower = description.toLowerCase();
    
    if (descLower.includes('immediately') || descLower.includes('right now') || descLower.includes('instant')) {
      return 'immediate';
    } else if (descLower.includes('daily') || descLower.includes('routine') || descLower.includes('habit')) {
      return 'long_term';
    } else {
      return 'short_term';
    }
  }

  /**
   * Assess strategy difficulty
   */
  private assessStrategyDifficulty(description: string): 'easy' | 'medium' | 'hard' {
    const descLower = description.toLowerCase();
    
    if (descLower.includes('simple') || descLower.includes('easy') || descLower.includes('basic')) {
      return 'easy';
    } else if (descLower.includes('complex') || descLower.includes('advanced') || descLower.includes('challenging')) {
      return 'hard';
    } else {
      return 'medium';
    }
  }

  /**
   * Estimate time required for strategy
   */
  private estimateTimeRequired(description: string): string {
    const descLower = description.toLowerCase();
    
    if (descLower.includes('minute') || descLower.includes('quick')) {
      const minutes = descLower.match(/(\d+)\s*minute/);
      return minutes ? `${minutes[1]} minutes` : '5-10 minutes';
    } else if (descLower.includes('hour')) {
      return '30-60 minutes';
    } else if (descLower.includes('breath') || descLower.includes('moment')) {
      return '2-5 minutes';
    } else {
      return '10-20 minutes';
    }
  }

  /**
   * Extract instructions from description
   */
  private extractInstructions(description: string): string[] {
    const instructions: string[] = [];
    
    // Look for numbered steps
    const numberedSteps = description.match(/\d+\.\s*([^0-9]+?)(?=\d+\.|$)/g);
    if (numberedSteps) {
      instructions.push(...numberedSteps.map(step => step.replace(/^\d+\.\s*/, '').trim()));
    }
    
    // Look for bullet points
    const bulletPoints = description.match(/[-•]\s*([^-•]+?)(?=[-•]|$)/g);
    if (bulletPoints) {
      instructions.push(...bulletPoints.map(bullet => bullet.replace(/^[-•]\s*/, '').trim()));
    }
    
    // If no structured instructions found, create basic ones
    if (instructions.length === 0) {
      instructions.push('Follow the guidance provided');
      instructions.push('Practice regularly for best results');
      instructions.push('Be patient and kind with yourself');
    }

    return instructions.slice(0, 5); // Limit to 5 instructions
  }

  /**
   * Generate contextual recommendations based on user state
   */
  private generateContextualRecommendations(context: RecoveryCoachContext, stageMetrics: any): string[] {
    const recommendations: string[] = [];

    // Stage-specific recommendations
    recommendations.push(...stageMetrics.recommendedActions);

    // Risk factor recommendations
    if (context.riskFactors.includes('high_stress')) {
      recommendations.push('Practice stress reduction techniques for 10 minutes today');
    }
    
    if (context.riskFactors.includes('low_mood')) {
      recommendations.push('Engage in a mood-boosting activity you enjoy');
    }
    
    if (context.riskFactors.includes('poor_sleep')) {
      recommendations.push('Focus on sleep hygiene - aim for consistent bedtime tonight');
    }

    // Engagement recommendations
    if (context.engagementLevel === 'low') {
      recommendations.push('Start with just 5 minutes of reflection today');
    } else if (context.engagementLevel === 'high') {
      recommendations.push('Consider setting a new personal growth goal');
    }

    // Time-based recommendations
    switch (context.timeOfDay) {
      case 'morning':
        recommendations.push('Set a positive intention for your day');
        break;
      case 'afternoon':
        recommendations.push('Take a mindful break to check in with yourself');
        break;
      case 'evening':
        recommendations.push('Reflect on today\'s wins, no matter how small');
        break;
      case 'night':
        recommendations.push('Practice gratitude before sleep');
        break;
    }

    // Coping strategy recommendations
    if (context.copingStrategies.length > 0) {
      const strategy = context.copingStrategies[Math.floor(Math.random() * context.copingStrategies.length)];
      recommendations.push(`Practice ${strategy} - it's worked well for you before`);
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Log coach interaction for analytics
   */
  private async logCoachInteraction(
    userId: string,
    interactionType: string,
    prompt: string,
    response: string
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      await dailyCheckInRepository.incrementAIInteractions(userId, today);
      
      // In a full implementation, you would also log to ai_interaction_logs table
      console.log(`Coach interaction logged: ${interactionType} for user ${userId.substring(0, 8)}...`);
    } catch (error) {
      console.error('Recovery Coach: Error logging interaction:', error);
      // Don't throw - logging failure shouldn't break the main functionality
    }
  }
}

// Export singleton instance
export const recoveryCoachManager = new RecoveryCoachManager();