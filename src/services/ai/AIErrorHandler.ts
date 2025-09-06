/**
 * AI Error Handler - Comprehensive error handling for AI service failures
 * Provides fallback responses and recovery mechanisms
 */

export interface AIServiceError {
  type: 'RATE_LIMIT_EXCEEDED' | 'SERVICE_UNAVAILABLE' | 'INVALID_REQUEST' | 'AUTHENTICATION_FAILED' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  code?: string;
  retryable: boolean;
  timestamp: Date;
}

export interface RequestContext {
  category: 'motivation' | 'crisis' | 'milestone' | 'insight' | 'education';
  userStage: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  retryCount: number;
}

export interface FallbackResponse {
  content: string;
  source: 'template' | 'cache' | 'emergency';
  confidence: number;
  shouldRetryLater: boolean;
  retryAfter?: number; // seconds
}

export interface CrisisContext {
  triggerType: string;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  userProfile: {
    recoveryStage: string;
    emergencyContacts?: string[];
    copingStrategies: string[];
  };
  timestamp: Date;
}

export interface CrisisResponse {
  immediateActions: string[];
  supportResources: string[];
  followUpPlan: string[];
  emergencyContacts?: string[];
  escalationRequired: boolean;
}

class AIErrorHandler {
  private readonly RETRY_DELAYS = [1000, 2000, 5000, 10000]; // Progressive delays in ms
  private readonly MAX_RETRIES = 3;

  private readonly FALLBACK_TEMPLATES = {
    motivation: {
      early: [
        "You're taking important steps in your recovery journey. Every day of progress builds strength for tomorrow.",
        "Recovery is a process, not a destination. Be patient with yourself as you build new, healthier habits.",
        "Your commitment to change shows incredible courage. Take it one moment at a time.",
      ],
      maintenance: [
        "You've built strong foundations in your recovery. Trust in the progress you've made.",
        "Consistency in your recovery practices is creating lasting positive changes in your life.",
        "Your dedication to maintaining healthy habits is inspiring. Keep moving forward.",
      ],
      challenge: [
        "Difficult moments are part of the recovery process. You have the tools to navigate through this.",
        "This challenging period will pass. Focus on the coping strategies that have worked for you before.",
        "Your resilience has brought you this far. Draw on that strength to overcome today's challenges.",
      ],
      growth: [
        "Your recovery journey has given you wisdom and strength. Use these gifts to continue growing.",
        "You've transformed challenges into opportunities for growth. Keep embracing positive change.",
        "Your progress in recovery is a testament to your determination and self-compassion.",
      ],
    },
    crisis: {
      immediate: [
        "Take three deep breaths. This difficult moment will pass. You are stronger than this urge.",
        "Stop what you're doing and change your environment. Go for a walk or call someone you trust.",
        "Remember your 'why' - the reasons you started this recovery journey. You've overcome challenges before.",
      ],
      coping: [
        "Use the 5-4-3-2-1 grounding technique: 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.",
        "Practice progressive muscle relaxation: tense and release each muscle group from your toes to your head.",
        "Engage in a healthy distraction: exercise, creative activity, or connecting with supportive people.",
      ],
      support: [
        "Reach out to your support network. You don't have to face this alone.",
        "Consider contacting a crisis helpline if you need immediate professional support.",
        "Remember that asking for help is a sign of strength, not weakness.",
      ],
    },
    milestone: {
      early: [
        "Congratulations on this important milestone! Every step forward in recovery deserves recognition.",
        "This achievement shows your commitment to positive change. You should be proud of your progress.",
        "Reaching this milestone proves that recovery is possible. Keep building on this success.",
      ],
      major: [
        "This is a significant achievement in your recovery journey! Your perseverance has paid off.",
        "You've reached an important milestone that many people struggle to achieve. Celebrate this victory!",
        "This milestone represents months of dedication and growth. You've truly transformed your life.",
      ],
    },
    insight: [
      "Self-awareness is the foundation of lasting change. The insights you're gaining will guide your continued growth.",
      "Understanding your patterns and triggers is a crucial step in building effective coping strategies.",
      "Your willingness to examine your thoughts and behaviors shows maturity and commitment to recovery.",
    ],
    education: [
      "Recovery involves rewiring neural pathways through consistent positive choices. Your brain is remarkably adaptable.",
      "Understanding the science behind addiction helps normalize the recovery process and reduces self-judgment.",
      "Mindfulness and self-compassion are evidence-based tools that support long-term recovery success.",
    ],
  };

  private readonly EMERGENCY_RESOURCES = [
    "National Suicide Prevention Lifeline: 988",
    "Crisis Text Line: Text HOME to 741741",
    "SAMHSA National Helpline: 1-800-662-4357",
    "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/",
  ];

  /**
   * Handle AI service errors with appropriate fallback responses
   */
  async handleAIServiceError(error: AIServiceError, context: RequestContext): Promise<FallbackResponse> {
    console.log(`AI Error Handler: Handling ${error.type} error for ${context.category} request`);

    switch (error.type) {
      case 'RATE_LIMIT_EXCEEDED':
        return await this.handleRateLimit(context);
      
      case 'SERVICE_UNAVAILABLE':
        return await this.handleServiceUnavailable(context);
      
      case 'INVALID_REQUEST':
        return await this.handleInvalidRequest(context);
      
      case 'AUTHENTICATION_FAILED':
        return await this.handleAuthFailure(context);
      
      case 'NETWORK_ERROR':
        return await this.handleNetworkError(context);
      
      default:
        return await this.handleUnknownError(context);
    }
  }

  /**
   * Handle crisis intervention errors with immediate response
   */
  async handleCrisisError(error: Error, crisisContext: CrisisContext): Promise<CrisisResponse> {
    console.error('AI Error Handler: Crisis intervention error:', error);
    
    // Crisis situations require immediate response regardless of AI availability
    const immediateResponse = await this.getImmediateCrisisSupport(crisisContext);
    
    // Log error for later analysis but don't block crisis response
    this.logCrisisError(error, crisisContext);
    
    return immediateResponse;
  }

  /**
   * Handle rate limit exceeded
   */
  private async handleRateLimit(context: RequestContext): Promise<FallbackResponse> {
    const retryAfter = this.calculateRetryDelay(context.retryCount);
    
    return {
      content: this.getFallbackContent(context),
      source: 'template',
      confidence: 0.8,
      shouldRetryLater: true,
      retryAfter,
    };
  }

  /**
   * Handle service unavailable
   */
  private async handleServiceUnavailable(context: RequestContext): Promise<FallbackResponse> {
    return {
      content: this.getFallbackContent(context),
      source: 'template',
      confidence: 0.8,
      shouldRetryLater: true,
      retryAfter: 300, // 5 minutes
    };
  }

  /**
   * Handle invalid request
   */
  private async handleInvalidRequest(context: RequestContext): Promise<FallbackResponse> {
    return {
      content: this.getFallbackContent(context),
      source: 'template',
      confidence: 0.7,
      shouldRetryLater: false,
    };
  }

  /**
   * Handle authentication failure
   */
  private async handleAuthFailure(context: RequestContext): Promise<FallbackResponse> {
    return {
      content: this.getFallbackContent(context),
      source: 'template',
      confidence: 0.7,
      shouldRetryLater: false,
    };
  }

  /**
   * Handle network error
   */
  private async handleNetworkError(context: RequestContext): Promise<FallbackResponse> {
    return {
      content: this.getFallbackContent(context),
      source: 'template',
      confidence: 0.8,
      shouldRetryLater: true,
      retryAfter: 60, // 1 minute
    };
  }

  /**
   * Handle unknown error
   */
  private async handleUnknownError(context: RequestContext): Promise<FallbackResponse> {
    return {
      content: this.getFallbackContent(context),
      source: 'template',
      confidence: 0.6,
      shouldRetryLater: context.retryCount < this.MAX_RETRIES,
      retryAfter: this.calculateRetryDelay(context.retryCount),
    };
  }

  /**
   * Get immediate crisis support
   */
  private async getImmediateCrisisSupport(context: CrisisContext): Promise<CrisisResponse> {
    const immediateActions = this.getImmediateCopingStrategies(context.triggerType);
    const supportResources = this.getEmergencyResources(context.severityLevel);
    const followUpPlan = this.createFollowUpPlan(context);
    const escalationRequired = context.severityLevel === 'critical';

    return {
      immediateActions,
      supportResources,
      followUpPlan,
      emergencyContacts: context.userProfile.emergencyContacts,
      escalationRequired,
    };
  }

  /**
   * Get immediate coping strategies based on trigger type
   */
  private getImmediateCopingStrategies(triggerType: string): string[] {
    const strategies = {
      stress: [
        "Take 5 deep breaths, counting to 4 on inhale and 6 on exhale",
        "Do 10 jumping jacks or push-ups to release physical tension",
        "Write down 3 things you're grateful for right now",
      ],
      loneliness: [
        "Call or text a trusted friend or family member",
        "Go to a public place like a coffee shop or library",
        "Engage in an online support community or forum",
      ],
      boredom: [
        "Start a creative project or hobby you enjoy",
        "Go for a walk or do some physical exercise",
        "Learn something new through an online course or video",
      ],
      default: [
        "Change your physical environment immediately",
        "Use the 5-4-3-2-1 grounding technique",
        "Engage in a healthy distraction activity",
      ],
    };

    return strategies[triggerType as keyof typeof strategies] || strategies.default;
  }

  /**
   * Get emergency resources based on severity
   */
  private getEmergencyResources(severityLevel: string): string[] {
    if (severityLevel === 'critical') {
      return [
        "Call 911 if you're in immediate danger",
        ...this.EMERGENCY_RESOURCES,
      ];
    }

    return this.EMERGENCY_RESOURCES;
  }

  /**
   * Create follow-up plan
   */
  private createFollowUpPlan(context: CrisisContext): string[] {
    return [
      "Check in with yourself in 30 minutes",
      "Review what triggered this crisis and update your prevention plan",
      "Schedule time with a counselor or support person within 24 hours",
      "Practice self-care activities for the rest of the day",
    ];
  }

  /**
   * Get fallback content based on context
   */
  private getFallbackContent(context: RequestContext): string {
    const { category, userStage } = context;

    if (category === 'crisis') {
      const crisisTemplates = this.FALLBACK_TEMPLATES.crisis;
      const templates = crisisTemplates.immediate;
      return templates[Math.floor(Math.random() * templates.length)];
    }

    if (category === 'motivation') {
      const motivationTemplates = this.FALLBACK_TEMPLATES.motivation;
      const stageTemplates = motivationTemplates[userStage as keyof typeof motivationTemplates] || motivationTemplates.early;
      return stageTemplates[Math.floor(Math.random() * stageTemplates.length)];
    }

    if (category === 'milestone') {
      const milestoneTemplates = this.FALLBACK_TEMPLATES.milestone;
      const templates = milestoneTemplates.early; // Default to early milestone templates
      return templates[Math.floor(Math.random() * templates.length)];
    }

    // Default fallback for other categories
    const defaultTemplates = this.FALLBACK_TEMPLATES[category] || this.FALLBACK_TEMPLATES.insight;
    return Array.isArray(defaultTemplates) 
      ? defaultTemplates[Math.floor(Math.random() * defaultTemplates.length)]
      : "Your recovery journey is unique and valuable. Keep moving forward with patience and self-compassion.";
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    if (retryCount >= this.RETRY_DELAYS.length) {
      return this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
    }
    return this.RETRY_DELAYS[retryCount];
  }

  /**
   * Log crisis error for analysis
   */
  private logCrisisError(error: Error, context: CrisisContext): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      context: {
        triggerType: context.triggerType,
        severityLevel: context.severityLevel,
        recoveryStage: context.userProfile.recoveryStage,
      },
    };

    console.error('Crisis Error Log:', JSON.stringify(errorLog));
    
    // In a production app, you would send this to your error tracking service
    // Example: Crashlytics.recordError(error);
  }

  /**
   * Create AI service error from generic error
   */
  createAIServiceError(error: any): AIServiceError {
    let errorType: AIServiceError['type'] = 'UNKNOWN_ERROR';
    let retryable = true;

    // Determine error type based on error message or code
    if (error.message?.includes('rate limit') || error.code === 429) {
      errorType = 'RATE_LIMIT_EXCEEDED';
    } else if (error.message?.includes('service unavailable') || error.code === 503) {
      errorType = 'SERVICE_UNAVAILABLE';
    } else if (error.message?.includes('invalid') || error.code === 400) {
      errorType = 'INVALID_REQUEST';
      retryable = false;
    } else if (error.message?.includes('auth') || error.code === 401 || error.code === 403) {
      errorType = 'AUTHENTICATION_FAILED';
      retryable = false;
    } else if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
      errorType = 'NETWORK_ERROR';
    }

    return {
      type: errorType,
      message: error.message || 'Unknown error occurred',
      code: error.code?.toString(),
      retryable,
      timestamp: new Date(),
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: AIServiceError, retryCount: number): boolean {
    return error.retryable && retryCount < this.MAX_RETRIES;
  }

  /**
   * Get retry delay for specific error type
   */
  getRetryDelay(error: AIServiceError, retryCount: number): number {
    if (error.type === 'RATE_LIMIT_EXCEEDED') {
      return Math.min(300000, this.calculateRetryDelay(retryCount) * 10); // Max 5 minutes
    }

    return this.calculateRetryDelay(retryCount);
  }
}

// Export singleton instance
export const aiErrorHandler = new AIErrorHandler();