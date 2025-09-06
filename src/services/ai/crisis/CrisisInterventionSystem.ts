/**
 * Crisis Intervention System - Provides immediate crisis response and support
 * Delivers personalized crisis interventions with local coping strategies and emergency resources
 */
import { crisisDetector, CrisisRiskAssessment } from './CrisisDetector';
import { recoveryCoachManager } from '../recovery/RecoveryCoachManager';
import { personalizationEngine } from '../recovery/PersonalizationEngine';
import { aiIntegrationService } from '../AIIntegrationService';
import { dataAnonymizationService } from '../DataAnonymizationService';
import { userRecoveryProfileRepository } from '../repositories/UserRecoveryProfileRepository';
import { dailyCheckInRepository } from '../repositories/DailyCheckInRepository';
import { TriggerType, RiskLevel } from '../types';

export interface CrisisIntervention {
  interventionId: string;
  userId: string;
  triggerType: TriggerType;
  severity: RiskLevel;
  interventionType: 'immediate' | 'supportive' | 'preventive';
  content: CrisisInterventionContent;
  emergencyResources: EmergencyResource[];
  followUpRequired: boolean;
  followUpScheduled?: string;
  createdAt: string;
}

export interface CrisisInterventionContent {
  primaryMessage: string;
  copingStrategies: CrisisStrategy[];
  breathingExercise?: BreathingExercise;
  groundingTechnique?: GroundingTechnique;
  affirmations: string[];
  safetyPlan?: SafetyPlan;
  personalizedElements: string[];
}

export interface CrisisStrategy {
  name: string;
  description: string;
  instructions: string[];
  timeRequired: string;
  difficulty: 'easy' | 'medium' | 'hard';
  effectiveness: number;
  category: 'immediate' | 'short_term' | 'grounding' | 'distraction';
}

export interface BreathingExercise {
  name: string;
  description: string;
  pattern: string; // e.g., "4-7-8" for inhale-hold-exhale
  duration: string;
  instructions: string[];
  audioGuidance?: string;
}

export interface GroundingTechnique {
  name: string;
  description: string;
  steps: string[];
  sensoryFocus: string[];
  timeRequired: string;
}

export interface SafetyPlan {
  warningSignsIdentified: string[];
  copingStrategiesListed: string[];
  supportContacts: string[];
  professionalContacts: string[];
  environmentalSafety: string[];
  reasonsForLiving: string[];
}

export interface EmergencyResource {
  type: 'hotline' | 'text' | 'chat' | 'local_service' | 'app';
  name: string;
  description: string;
  contact: string;
  availability: string;
  specialization?: string[];
  anonymous: boolean;
  immediate: boolean;
}

export interface CrisisFollowUp {
  interventionId: string;
  userId: string;
  scheduledAt: string;
  completedAt?: string;
  userResponse?: 'helped' | 'partially_helped' | 'not_helped';
  additionalSupport?: string;
  escalationNeeded: boolean;
}

class CrisisInterventionSystem {
  private readonly EMERGENCY_RESOURCES: EmergencyResource[] = [
    {
      type: 'hotline',
      name: 'National Suicide Prevention Lifeline',
      description: '24/7 crisis support and suicide prevention',
      contact: '988',
      availability: '24/7',
      specialization: ['suicide_prevention', 'mental_health_crisis'],
      anonymous: true,
      immediate: true,
    },
    {
      type: 'text',
      name: 'Crisis Text Line',
      description: 'Text-based crisis support',
      contact: 'Text HOME to 741741',
      availability: '24/7',
      specialization: ['crisis_support', 'mental_health'],
      anonymous: true,
      immediate: true,
    },
    {
      type: 'hotline',
      name: 'SAMHSA National Helpline',
      description: 'Treatment referral and information service',
      contact: '1-800-662-4357',
      availability: '24/7',
      specialization: ['substance_abuse', 'mental_health', 'treatment_referral'],
      anonymous: true,
      immediate: true,
    },
    {
      type: 'chat',
      name: 'NAMI HelpLine',
      description: 'Mental health information and support',
      contact: 'nami.org/help',
      availability: 'Mon-Fri 10am-10pm ET',
      specialization: ['mental_health', 'family_support'],
      anonymous: false,
      immediate: false,
    },
  ];

  /**
   * Provide immediate crisis intervention
   */
  async provideCrisisIntervention(
    userId: string,
    triggerType?: TriggerType,
    severity?: RiskLevel
  ): Promise<CrisisIntervention> {
    try {
      console.log('🚨 Providing crisis intervention');

      // Assess current crisis risk if not provided
      let riskAssessment: CrisisRiskAssessment;
      if (!severity) {
        riskAssessment = await crisisDetector.assessCrisisRisk(userId);
        severity = riskAssessment.overallRiskLevel;
        triggerType = triggerType || riskAssessment.triggerTypes[0] || 'stress';
      } else {
        riskAssessment = await crisisDetector.assessCrisisRisk(userId);
      }

      // Determine intervention type
      const interventionType = this.determineInterventionType(severity, riskAssessment);

      // Generate personalized intervention content
      const content = await this.generateInterventionContent(
        userId,
        triggerType!,
        severity,
        interventionType,
        riskAssessment
      );

      // Select appropriate emergency resources
      const emergencyResources = this.selectEmergencyResources(severity, triggerType!);

      // Create intervention record
      const intervention: CrisisIntervention = {
        interventionId: this.generateInterventionId(),
        userId,
        triggerType: triggerType!,
        severity,
        interventionType,
        content,
        emergencyResources,
        followUpRequired: severity === 'critical' || severity === 'high',
        followUpScheduled: this.scheduleFollowUp(severity),
        createdAt: new Date().toISOString(),
      };

      // Log intervention
      await this.logCrisisIntervention(intervention);

      console.log(`Crisis intervention provided: ${interventionType} for ${severity} ${triggerType}`);
      
      return intervention;
    } catch (error) {
      console.error('Crisis Intervention: Error providing intervention:', error);
      
      // Return emergency fallback intervention
      return this.getEmergencyFallbackIntervention(userId, triggerType || 'stress');
    }
  }

  /**
   * Check if user needs immediate crisis intervention
   */
  async checkForCrisisIntervention(userId: string): Promise<CrisisIntervention | null> {
    try {
      const needsIntervention = await crisisDetector.detectImmediateCrisis(userId);
      
      if (needsIntervention) {
        return await this.provideCrisisIntervention(userId);
      }
      
      return null;
    } catch (error) {
      console.error('Crisis Intervention: Error checking for crisis:', error);
      // Err on the side of caution
      return await this.provideCrisisIntervention(userId);
    }
  }

  /**
   * Provide crisis follow-up support
   */
  async provideCrisisFollowUp(interventionId: string): Promise<CrisisFollowUp> {
    try {
      console.log('🔄 Providing crisis follow-up');

      // In a full implementation, this would retrieve the original intervention
      // For now, we'll create a basic follow-up structure
      
      const followUp: CrisisFollowUp = {
        interventionId,
        userId: 'user-from-intervention', // Would be retrieved from intervention record
        scheduledAt: new Date().toISOString(),
        escalationNeeded: false,
      };

      return followUp;
    } catch (error) {
      console.error('Crisis Intervention: Error providing follow-up:', error);
      throw error;
    }
  }

  /**
   * Generate personalized intervention content
   */
  private async generateInterventionContent(
    userId: string,
    triggerType: TriggerType,
    severity: RiskLevel,
    interventionType: 'immediate' | 'supportive' | 'preventive',
    riskAssessment: CrisisRiskAssessment
  ): Promise<CrisisInterventionContent> {
    try {
      // Get user profile for personalization
      const profile = await userRecoveryProfileRepository.findByUserId(userId);
      
      // Generate primary crisis message
      const primaryMessage = await this.generateCrisisMessage(
        userId,
        triggerType,
        severity,
        interventionType
      );

      // Get personalized coping strategies
      const copingStrategies = await this.getCrisisStrategies(
        userId,
        triggerType,
        severity,
        interventionType
      );

      // Select appropriate breathing exercise
      const breathingExercise = this.selectBreathingExercise(triggerType, severity);

      // Select grounding technique
      const groundingTechnique = this.selectGroundingTechnique(triggerType, severity);

      // Generate affirmations
      const affirmations = await this.generateAffirmations(userId, triggerType, severity);

      // Create safety plan if needed
      const safetyPlan = severity === 'critical' ? 
        await this.createSafetyPlan(userId, profile) : undefined;

      return {
        primaryMessage,
        copingStrategies,
        breathingExercise,
        groundingTechnique,
        affirmations,
        safetyPlan,
        personalizedElements: ['crisis_specific', 'user_history', 'severity_appropriate'],
      };
    } catch (error) {
      console.error('Crisis Intervention: Error generating content:', error);
      
      // Return basic crisis content
      return {
        primaryMessage: 'You are not alone in this moment. This feeling will pass. Let\'s work through this together.',
        copingStrategies: this.getBasicCrisisStrategies(triggerType),
        affirmations: [
          'This feeling is temporary',
          'I have survived difficult moments before',
          'I am stronger than this challenge',
          'Help is available when I need it',
        ],
        personalizedElements: ['fallback_content'],
      };
    }
  }

  /**
   * Generate crisis-specific message
   */
  private async generateCrisisMessage(
    userId: string,
    triggerType: TriggerType,
    severity: RiskLevel,
    interventionType: 'immediate' | 'supportive' | 'preventive'
  ): Promise<string> {
    try {
      // Build crisis-specific prompt
      let prompt = `Generate a compassionate, immediate crisis intervention message for someone experiencing ${triggerType} triggers at ${severity} severity level. `;
      
      switch (interventionType) {
        case 'immediate':
          prompt += 'This is an immediate crisis requiring urgent support. Focus on safety, grounding, and immediate coping. ';
          break;
        case 'supportive':
          prompt += 'Provide supportive intervention with empathy and practical guidance. ';
          break;
        case 'preventive':
          prompt += 'Offer preventive support to help avoid escalation. ';
          break;
      }

      prompt += 'Keep the message warm, non-judgmental, and hopeful. Emphasize that this feeling will pass and help is available. 2-3 sentences maximum.';

      // Anonymize and generate
      const safePrompt = await dataAnonymizationService.createSafePrompt(prompt, {
        triggerType,
        severity,
        interventionType,
      });

      const aiResponse = await aiIntegrationService.generateResponse({
        prompt: safePrompt.prompt,
        category: 'crisis_intervention',
        userId,
      });

      // Personalize the response
      const personalizedContent = await personalizationEngine.personalizeContent(
        userId,
        aiResponse.content,
        'crisis_intervention',
        { triggerType, severity, interventionType }
      );

      return personalizedContent.content;
    } catch (error) {
      console.error('Crisis Intervention: Error generating message:', error);
      
      // Return appropriate fallback message
      const fallbackMessages = {
        immediate: 'You are safe right now. This intense feeling will pass. Take a deep breath with me and let\'s work through this moment together.',
        supportive: 'I understand you\'re going through a difficult time. You have the strength to get through this, and you don\'t have to face it alone.',
        preventive: 'I notice you might be struggling right now. Let\'s take a moment to use some tools that can help you feel more grounded and in control.',
      };

      return fallbackMessages[interventionType];
    }
  }

  /**
   * Get crisis-specific coping strategies
   */
  private async getCrisisStrategies(
    userId: string,
    triggerType: TriggerType,
    severity: RiskLevel,
    interventionType: 'immediate' | 'supportive' | 'preventive'
  ): Promise<CrisisStrategy[]> {
    try {
      // Get personalized strategies from recovery coach
      const urgency = severity === 'critical' ? 'high' : severity === 'high' ? 'medium' : 'low';
      const copingStrategies = await recoveryCoachManager.provideCopingStrategies(
        userId,
        triggerType,
        urgency
      );

      // Convert to crisis strategies format
      return copingStrategies.map(strategy => ({
        name: strategy.name,
        description: strategy.description,
        instructions: strategy.instructions,
        timeRequired: strategy.timeRequired,
        difficulty: strategy.difficulty,
        effectiveness: strategy.effectiveness,
        category: strategy.category as 'immediate' | 'short_term' | 'grounding' | 'distraction',
      }));
    } catch (error) {
      console.error('Crisis Intervention: Error getting strategies:', error);
      return this.getBasicCrisisStrategies(triggerType);
    }
  }

  /**
   * Get basic crisis strategies as fallback
   */
  private getBasicCrisisStrategies(triggerType: TriggerType): CrisisStrategy[] {
    const strategies: Record<TriggerType, CrisisStrategy[]> = {
      stress: [
        {
          name: 'Box Breathing',
          description: 'Slow, controlled breathing to activate your calm response',
          instructions: ['Breathe in for 4 counts', 'Hold for 4 counts', 'Breathe out for 4 counts', 'Hold for 4 counts', 'Repeat 4-6 times'],
          timeRequired: '2-3 minutes',
          difficulty: 'easy',
          effectiveness: 0.9,
          category: 'immediate',
        },
        {
          name: 'Progressive Muscle Relaxation',
          description: 'Release physical tension to calm your mind',
          instructions: ['Tense your shoulders for 5 seconds', 'Release and notice the relaxation', 'Tense your arms for 5 seconds', 'Release and breathe', 'Continue with each muscle group'],
          timeRequired: '5-10 minutes',
          difficulty: 'medium',
          effectiveness: 0.8,
          category: 'short_term',
        },
      ],
      anxiety: [
        {
          name: '5-4-3-2-1 Grounding',
          description: 'Use your senses to anchor yourself in the present',
          instructions: ['Name 5 things you can see', 'Name 4 things you can touch', 'Name 3 things you can hear', 'Name 2 things you can smell', 'Name 1 thing you can taste'],
          timeRequired: '3-5 minutes',
          difficulty: 'easy',
          effectiveness: 0.85,
          category: 'grounding',
        },
      ],
      depression: [
        {
          name: 'Gentle Movement',
          description: 'Light physical activity to shift your energy',
          instructions: ['Stand up slowly', 'Stretch your arms above your head', 'Take 5 steps forward', 'Take 5 deep breaths', 'Notice any small change in how you feel'],
          timeRequired: '2-5 minutes',
          difficulty: 'easy',
          effectiveness: 0.7,
          category: 'immediate',
        },
      ],
      loneliness: [
        {
          name: 'Connection Visualization',
          description: 'Remember your support network and connection',
          instructions: ['Think of someone who cares about you', 'Imagine their voice saying something kind', 'Remember a time they helped you', 'Feel that connection in your heart', 'Know that connection is still there'],
          timeRequired: '3-5 minutes',
          difficulty: 'medium',
          effectiveness: 0.75,
          category: 'grounding',
        },
      ],
      anger: [
        {
          name: 'Cooling Breath',
          description: 'Use breathing to cool down intense anger',
          instructions: ['Breathe in slowly through your nose', 'Imagine cool, calming air', 'Breathe out slowly through your mouth', 'Imagine releasing the heat of anger', 'Repeat until you feel cooler'],
          timeRequired: '2-4 minutes',
          difficulty: 'easy',
          effectiveness: 0.8,
          category: 'immediate',
        },
      ],
      boredom: [
        {
          name: 'Mindful Observation',
          description: 'Engage your mind with present-moment awareness',
          instructions: ['Choose an object near you', 'Look at it closely for 1 minute', 'Notice colors, textures, shapes', 'Think about its purpose and history', 'Appreciate its existence'],
          timeRequired: '3-5 minutes',
          difficulty: 'easy',
          effectiveness: 0.6,
          category: 'distraction',
        },
      ],
      fatigue: [
        {
          name: 'Energy Check-In',
          description: 'Gentle assessment and energy conservation',
          instructions: ['Sit or lie down comfortably', 'Notice where you feel tired', 'Take 3 deep, nourishing breaths', 'Ask yourself what you need right now', 'Choose the gentlest option available'],
          timeRequired: '2-3 minutes',
          difficulty: 'easy',
          effectiveness: 0.7,
          category: 'immediate',
        },
      ],
      custom: [
        {
          name: 'Mindful Pause',
          description: 'Create space between you and the difficult feeling',
          instructions: ['Stop what you\'re doing', 'Take one deep breath', 'Notice what you\'re feeling without judgment', 'Remind yourself this feeling will pass', 'Choose your next action mindfully'],
          timeRequired: '1-2 minutes',
          difficulty: 'easy',
          effectiveness: 0.75,
          category: 'immediate',
        },
      ],
    };

    return strategies[triggerType] || strategies.custom;
  }

  /**
   * Select appropriate breathing exercise
   */
  private selectBreathingExercise(triggerType: TriggerType, severity: RiskLevel): BreathingExercise {
    const exercises: Record<string, BreathingExercise> = {
      'anxiety_high': {
        name: '4-7-8 Calming Breath',
        description: 'Powerful breathing technique to reduce anxiety quickly',
        pattern: '4-7-8',
        duration: '3-4 cycles',
        instructions: [
          'Exhale completely through your mouth',
          'Close your mouth and inhale through nose for 4 counts',
          'Hold your breath for 7 counts',
          'Exhale through mouth for 8 counts',
          'Repeat 3-4 times maximum',
        ],
      },
      'stress_medium': {
        name: 'Box Breathing',
        description: 'Balanced breathing to restore calm and focus',
        pattern: '4-4-4-4',
        duration: '5-10 cycles',
        instructions: [
          'Inhale for 4 counts',
          'Hold for 4 counts',
          'Exhale for 4 counts',
          'Hold empty for 4 counts',
          'Repeat 5-10 times',
        ],
      },
      'default': {
        name: 'Simple Deep Breathing',
        description: 'Basic calming breath for any situation',
        pattern: '4-6',
        duration: '5-10 breaths',
        instructions: [
          'Breathe in slowly for 4 counts',
          'Breathe out slowly for 6 counts',
          'Focus on making exhale longer than inhale',
          'Continue for 5-10 breaths',
        ],
      },
    };

    const key = `${triggerType}_${severity}`;
    return exercises[key] || exercises.default;
  }

  /**
   * Select grounding technique
   */
  private selectGroundingTechnique(triggerType: TriggerType, severity: RiskLevel): GroundingTechnique {
    if (triggerType === 'anxiety' || severity === 'high') {
      return {
        name: '5-4-3-2-1 Sensory Grounding',
        description: 'Use all your senses to anchor yourself in the present moment',
        steps: [
          'Look around and name 5 things you can see',
          'Notice and name 4 things you can physically feel',
          'Listen and identify 3 things you can hear',
          'Find 2 things you can smell',
          'Notice 1 thing you can taste',
        ],
        sensoryFocus: ['sight', 'touch', 'hearing', 'smell', 'taste'],
        timeRequired: '3-5 minutes',
      };
    }

    return {
      name: 'Physical Grounding',
      description: 'Use physical sensations to feel more present and stable',
      steps: [
        'Feel your feet on the ground',
        'Notice the weight of your body',
        'Touch a nearby object and focus on its texture',
        'Take three deep breaths',
        'Say your name and today\'s date out loud',
      ],
      sensoryFocus: ['touch', 'proprioception'],
      timeRequired: '2-3 minutes',
    };
  }

  /**
   * Generate personalized affirmations
   */
  private async generateAffirmations(
    userId: string,
    triggerType: TriggerType,
    severity: RiskLevel
  ): Promise<string[]> {
    const baseAffirmations = {
      stress: [
        'I can handle this one moment at a time',
        'This stress will pass, and I will be okay',
        'I have tools to manage difficult feelings',
        'I am stronger than this temporary challenge',
      ],
      anxiety: [
        'I am safe in this moment',
        'This anxiety is temporary and will pass',
        'I can breathe through this feeling',
        'I have survived anxiety before and I will again',
      ],
      depression: [
        'This feeling is not permanent',
        'I matter and my life has value',
        'Small steps forward are still progress',
        'I deserve compassion, especially from myself',
      ],
      loneliness: [
        'I am not truly alone in this world',
        'Connection is possible, even in small ways',
        'I can be good company for myself',
        'There are people who care about me',
      ],
      anger: [
        'I can feel this anger without acting on it',
        'This intense feeling will cool down',
        'I have the power to choose my response',
        'I can express my needs in healthy ways',
      ],
      boredom: [
        'This moment has potential I haven\'t discovered yet',
        'I can find meaning in simple things',
        'Stillness can be peaceful, not empty',
        'I have the power to create interest and engagement',
      ],
      fatigue: [
        'It\'s okay to rest when I need to',
        'My energy will return with proper care',
        'I can be gentle with myself today',
        'Small actions are enough right now',
      ],
      custom: [
        'This difficult moment will pass',
        'I have the strength to get through this',
        'I am worthy of help and support',
        'I can take this one breath at a time',
      ],
    };

    return baseAffirmations[triggerType] || baseAffirmations.custom;
  }

  /**
   * Create safety plan for critical situations
   */
  private async createSafetyPlan(userId: string, profile: any): Promise<SafetyPlan> {
    return {
      warningSignsIdentified: [
        'Feeling overwhelmed or hopeless',
        'Isolating from others',
        'Neglecting self-care',
        'Increased substance cravings',
      ],
      copingStrategiesListed: profile?.coping_strategies || [
        'Deep breathing exercises',
        'Call a trusted friend',
        'Use grounding techniques',
        'Practice mindfulness',
      ],
      supportContacts: profile?.support_contacts || [
        'Trusted friend or family member',
        'Sponsor or mentor',
        'Therapist or counselor',
      ],
      professionalContacts: [
        'Crisis Hotline: 988',
        'Crisis Text Line: Text HOME to 741741',
        'Emergency Services: 911',
      ],
      environmentalSafety: [
        'Remove or secure potential triggers',
        'Stay in safe, supportive environments',
        'Avoid high-risk situations when vulnerable',
      ],
      reasonsForLiving: [
        'People who care about me',
        'Goals I want to achieve',
        'Experiences I want to have',
        'The possibility that things can get better',
      ],
    };
  }

  /**
   * Determine intervention type based on severity
   */
  private determineInterventionType(
    severity: RiskLevel,
    riskAssessment: CrisisRiskAssessment
  ): 'immediate' | 'supportive' | 'preventive' {
    if (severity === 'critical' || riskAssessment.escalationRequired) {
      return 'immediate';
    } else if (severity === 'high' || severity === 'medium') {
      return 'supportive';
    } else {
      return 'preventive';
    }
  }

  /**
   * Select appropriate emergency resources
   */
  private selectEmergencyResources(severity: RiskLevel, triggerType: TriggerType): EmergencyResource[] {
    let resources = [...this.EMERGENCY_RESOURCES];

    // Filter by severity
    if (severity === 'critical' || severity === 'high') {
      resources = resources.filter(r => r.immediate);
    }

    // Add trigger-specific resources
    if (triggerType === 'depression' || triggerType === 'anxiety') {
      resources = resources.filter(r => 
        r.specialization?.includes('mental_health') || 
        r.specialization?.includes('suicide_prevention')
      );
    }

    return resources.slice(0, 3); // Limit to top 3 most relevant
  }

  /**
   * Schedule follow-up based on severity
   */
  private scheduleFollowUp(severity: RiskLevel): string | undefined {
    const now = new Date();
    
    switch (severity) {
      case 'critical':
        // Follow up in 1 hour
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case 'high':
        // Follow up in 4 hours
        return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
      case 'medium':
        // Follow up in 24 hours
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      default:
        return undefined;
    }
  }

  /**
   * Generate unique intervention ID
   */
  private generateInterventionId(): string {
    return `crisis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log crisis intervention for tracking and analysis
   */
  private async logCrisisIntervention(intervention: CrisisIntervention): Promise<void> {
    try {
      // In a full implementation, this would save to crisis_intervention_records table
      console.log(`Crisis intervention logged: ${intervention.interventionId}`);
      
      // Update daily check-in with crisis intervention flag
      const today = new Date().toISOString().split('T')[0];
      await dailyCheckInRepository.incrementAIInteractions(intervention.userId, today);
    } catch (error) {
      console.error('Crisis Intervention: Error logging intervention:', error);
      // Don't throw - logging failure shouldn't break crisis intervention
    }
  }

  /**
   * Get emergency fallback intervention
   */
  private getEmergencyFallbackIntervention(userId: string, triggerType: TriggerType): CrisisIntervention {
    return {
      interventionId: this.generateInterventionId(),
      userId,
      triggerType,
      severity: 'high',
      interventionType: 'immediate',
      content: {
        primaryMessage: 'You are not alone. This difficult moment will pass. Please reach out for support if you need it.',
        copingStrategies: this.getBasicCrisisStrategies(triggerType),
        affirmations: [
          'I am safe right now',
          'This feeling is temporary',
          'Help is available when I need it',
          'I have survived difficult moments before',
        ],
        personalizedElements: ['emergency_fallback'],
      },
      emergencyResources: this.EMERGENCY_RESOURCES.filter(r => r.immediate),
      followUpRequired: true,
      followUpScheduled: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      createdAt: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const crisisInterventionSystem = new CrisisInterventionSystem();