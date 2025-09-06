/**
 * Context Preserver - Maintains necessary context while anonymizing sensitive data
 * Ensures AI can still provide relevant responses after anonymization
 */

export interface ContextMap {
  originalTerm: string;
  anonymizedTerm: string;
  category: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  contextHints: string[];
}

export interface PreservationResult {
  anonymizedData: any;
  contextMaps: ContextMap[];
  preservedContext: Record<string, any>;
  qualityScore: number; // 0-1, how well context was preserved
}

export interface ContextualReplacement {
  pattern: RegExp;
  replacement: string;
  contextCategory: string;
  preserveContext: boolean;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

class ContextPreserver {
  // Contextual replacements that preserve meaning while anonymizing
  private readonly CONTEXTUAL_REPLACEMENTS: ContextualReplacement[] = [
    // Recovery stage context
    {
      pattern: /\b(?:I'm|I am)\s+(\d+)\s+days?\s+(?:clean|sober|free)\b/gi,
      replacement: 'I am in recovery_progress_marker days into my journey',
      contextCategory: 'recovery_progress',
      preserveContext: true,
      importance: 'critical',
    },
    {
      pattern: /\b(?:relapsed|had a setback|gave in|lost control)\s+(?:yesterday|today|last night|this morning)\b/gi,
      replacement: 'experienced a setback_event recently',
      contextCategory: 'recent_setback',
      preserveContext: true,
      importance: 'high',
    },
    
    // Emotional context
    {
      pattern: /\bI\s+(?:feel|felt|am feeling)\s+(ashamed|guilty|worthless|hopeless|depressed|anxious)\b/gi,
      replacement: 'I am experiencing negative_emotional_state',
      contextCategory: 'emotional_state',
      preserveContext: true,
      importance: 'high',
    },
    
    // Trigger context
    {
      pattern: /\b(?:when I|after I|before I)\s+(see|watch|look at|encounter)\s+(?:pornography|porn|adult content)\b/gi,
      replacement: 'when I encounter trigger_content_category_a',
      contextCategory: 'trigger_exposure',
      preserveContext: true,
      importance: 'critical',
    },
    
    // Time-based context
    {
      pattern: /\b(?:every|usually|often|always)\s+(?:at|around|during)\s+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))\b/gi,
      replacement: 'regularly during time_pattern_marker',
      contextCategory: 'temporal_pattern',
      preserveContext: true,
      importance: 'medium',
    },
    
    // Location context (generalized)
    {
      pattern: /\b(?:at home|in my room|in the bedroom|in the bathroom|at work|at school)\b/gi,
      replacement: 'in private_space_context',
      contextCategory: 'location_context',
      preserveContext: true,
      importance: 'medium',
    },
    
    // Relationship context
    {
      pattern: /\bmy\s+(wife|husband|girlfriend|boyfriend|partner|spouse)\b/gi,
      replacement: 'my significant_other',
      contextCategory: 'relationship_context',
      preserveContext: true,
      importance: 'medium',
    },
    
    // Coping strategy context
    {
      pattern: /\b(?:I tried|I used|I did)\s+(meditation|exercise|breathing|prayer|journaling|cold shower)\b/gi,
      replacement: 'I used coping_strategy_type',
      contextCategory: 'coping_strategy',
      preserveContext: true,
      importance: 'high',
    },
  ];

  // Context categories that should be preserved for AI understanding
  private readonly CONTEXT_CATEGORIES = {
    recovery_progress: {
      importance: 'critical',
      description: 'Recovery timeline and progress markers',
      preservationStrategy: 'encode_with_context',
    },
    emotional_state: {
      importance: 'high',
      description: 'User emotional and mental state',
      preservationStrategy: 'categorize_and_encode',
    },
    trigger_exposure: {
      importance: 'critical',
      description: 'Trigger events and exposure patterns',
      preservationStrategy: 'encode_with_context',
    },
    temporal_pattern: {
      importance: 'medium',
      description: 'Time-based patterns and routines',
      preservationStrategy: 'generalize_and_encode',
    },
    location_context: {
      importance: 'medium',
      description: 'Environmental and location context',
      preservationStrategy: 'generalize_and_encode',
    },
    relationship_context: {
      importance: 'medium',
      description: 'Social and relationship context',
      preservationStrategy: 'generalize_and_encode',
    },
    coping_strategy: {
      importance: 'high',
      description: 'Coping mechanisms and strategies used',
      preservationStrategy: 'categorize_and_encode',
    },
  };

  /**
   * Preserve context while anonymizing data
   */
  async preserveContext(data: any, sensitivityLevel: 'low' | 'medium' | 'high' = 'medium'): Promise<PreservationResult> {
    try {
      const contextMaps: ContextMap[] = [];
      const preservedContext: Record<string, any> = {};
      let anonymizedData = JSON.parse(JSON.stringify(data)); // Deep clone

      // Apply contextual replacements
      if (typeof anonymizedData === 'string') {
        const result = this.applyContextualReplacements(anonymizedData, contextMaps, preservedContext);
        anonymizedData = result.text;
      } else if (typeof anonymizedData === 'object') {
        anonymizedData = this.processObjectRecursively(anonymizedData, contextMaps, preservedContext);
      }

      // Extract additional context markers
      this.extractContextMarkers(data, preservedContext);

      // Calculate quality score
      const qualityScore = this.calculatePreservationQuality(contextMaps, preservedContext);

      return {
        anonymizedData,
        contextMaps,
        preservedContext,
        qualityScore,
      };
    } catch (error) {
      console.error('Context preservation error:', error);
      return {
        anonymizedData: data,
        contextMaps: [],
        preservedContext: {},
        qualityScore: 0,
      };
    }
  }

  /**
   * Apply contextual replacements to text
   */
  private applyContextualReplacements(
    text: string,
    contextMaps: ContextMap[],
    preservedContext: Record<string, any>
  ): { text: string; contextMaps: ContextMap[] } {
    let processedText = text;

    this.CONTEXTUAL_REPLACEMENTS.forEach(replacement => {
      const matches = text.match(replacement.pattern);
      if (matches) {
        matches.forEach((match, index) => {
          const contextKey = `${replacement.contextCategory}_${index}`;
          
          // Create context map
          const contextMap: ContextMap = {
            originalTerm: match,
            anonymizedTerm: replacement.replacement,
            category: replacement.contextCategory,
            importance: replacement.importance,
            contextHints: this.generateContextHints(match, replacement.contextCategory),
          };
          
          contextMaps.push(contextMap);

          // Preserve context if needed
          if (replacement.preserveContext) {
            preservedContext[contextKey] = {
              category: replacement.contextCategory,
              originalContext: match,
              importance: replacement.importance,
              hints: contextMap.contextHints,
            };
          }

          // Replace in text
          processedText = processedText.replace(match, replacement.replacement);
        });
      }
    });

    return { text: processedText, contextMaps };
  }

  /**
   * Process object recursively
   */
  private processObjectRecursively(
    obj: any,
    contextMaps: ContextMap[],
    preservedContext: Record<string, any>
  ): any {
    if (typeof obj === 'string') {
      const result = this.applyContextualReplacements(obj, contextMaps, preservedContext);
      return result.text;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.processObjectRecursively(item, contextMaps, preservedContext));
    }

    if (typeof obj === 'object' && obj !== null) {
      const processed: any = {};
      Object.entries(obj).forEach(([key, value]) => {
        processed[key] = this.processObjectRecursively(value, contextMaps, preservedContext);
      });
      return processed;
    }

    return obj;
  }

  /**
   * Generate context hints for better AI understanding
   */
  private generateContextHints(originalText: string, category: string): string[] {
    const hints: string[] = [];

    switch (category) {
      case 'recovery_progress':
        hints.push('recovery_timeline', 'progress_marker', 'milestone_context');
        if (originalText.includes('days')) {
          hints.push('daily_tracking', 'streak_context');
        }
        break;

      case 'emotional_state':
        hints.push('mood_context', 'emotional_wellbeing', 'mental_state');
        if (originalText.toLowerCase().includes('feel')) {
          hints.push('current_emotion', 'subjective_experience');
        }
        break;

      case 'trigger_exposure':
        hints.push('risk_situation', 'exposure_event', 'vulnerability_context');
        if (originalText.includes('when') || originalText.includes('after')) {
          hints.push('temporal_trigger', 'situational_context');
        }
        break;

      case 'temporal_pattern':
        hints.push('routine_context', 'time_based_pattern', 'behavioral_schedule');
        break;

      case 'location_context':
        hints.push('environmental_factor', 'privacy_context', 'situational_setting');
        break;

      case 'relationship_context':
        hints.push('social_context', 'interpersonal_factor', 'support_system');
        break;

      case 'coping_strategy':
        hints.push('intervention_method', 'self_care_action', 'recovery_tool');
        break;

      default:
        hints.push('general_context');
    }

    return hints;
  }

  /**
   * Extract additional context markers
   */
  private extractContextMarkers(data: any, preservedContext: Record<string, any>): void {
    const dataString = JSON.stringify(data).toLowerCase();

    // Recovery stage indicators
    if (dataString.includes('early') || dataString.includes('beginning') || dataString.includes('start')) {
      preservedContext.recovery_stage_indicator = 'early_stage';
    } else if (dataString.includes('maintenance') || dataString.includes('stable') || dataString.includes('consistent')) {
      preservedContext.recovery_stage_indicator = 'maintenance_stage';
    } else if (dataString.includes('challenge') || dataString.includes('difficult') || dataString.includes('struggle')) {
      preservedContext.recovery_stage_indicator = 'challenge_stage';
    } else if (dataString.includes('growth') || dataString.includes('progress') || dataString.includes('improvement')) {
      preservedContext.recovery_stage_indicator = 'growth_stage';
    }

    // Urgency indicators
    if (dataString.includes('urgent') || dataString.includes('emergency') || dataString.includes('crisis')) {
      preservedContext.urgency_level = 'high';
    } else if (dataString.includes('soon') || dataString.includes('quickly') || dataString.includes('asap')) {
      preservedContext.urgency_level = 'medium';
    } else {
      preservedContext.urgency_level = 'low';
    }

    // Support seeking indicators
    if (dataString.includes('help') || dataString.includes('support') || dataString.includes('advice')) {
      preservedContext.support_seeking = true;
    }

    // Success indicators
    if (dataString.includes('success') || dataString.includes('achievement') || dataString.includes('milestone')) {
      preservedContext.success_context = true;
    }

    // Setback indicators
    if (dataString.includes('setback') || dataString.includes('relapse') || dataString.includes('failure')) {
      preservedContext.setback_context = true;
    }
  }

  /**
   * Calculate preservation quality score
   */
  private calculatePreservationQuality(
    contextMaps: ContextMap[],
    preservedContext: Record<string, any>
  ): number {
    let score = 0.5; // Base score

    // Add points for preserved context maps
    const criticalMaps = contextMaps.filter(m => m.importance === 'critical').length;
    const highMaps = contextMaps.filter(m => m.importance === 'high').length;
    const mediumMaps = contextMaps.filter(m => m.importance === 'medium').length;

    score += criticalMaps * 0.15;
    score += highMaps * 0.1;
    score += mediumMaps * 0.05;

    // Add points for preserved context markers
    const contextKeys = Object.keys(preservedContext);
    score += Math.min(0.3, contextKeys.length * 0.05);

    // Ensure score is between 0 and 1
    return Math.min(1, Math.max(0, score));
  }

  /**
   * Reconstruct context for AI prompt enhancement
   */
  reconstructContextForAI(
    anonymizedData: any,
    contextMaps: ContextMap[],
    preservedContext: Record<string, any>
  ): string {
    const contextParts: string[] = [];

    // Add recovery stage context
    if (preservedContext.recovery_stage_indicator) {
      contextParts.push(`User is in ${preservedContext.recovery_stage_indicator} of recovery`);
    }

    // Add urgency context
    if (preservedContext.urgency_level) {
      contextParts.push(`Request urgency: ${preservedContext.urgency_level}`);
    }

    // Add emotional context
    const emotionalMaps = contextMaps.filter(m => m.category === 'emotional_state');
    if (emotionalMaps.length > 0) {
      contextParts.push('User is experiencing emotional challenges');
    }

    // Add trigger context
    const triggerMaps = contextMaps.filter(m => m.category === 'trigger_exposure');
    if (triggerMaps.length > 0) {
      contextParts.push('User has encountered trigger situations');
    }

    // Add coping strategy context
    const copingMaps = contextMaps.filter(m => m.category === 'coping_strategy');
    if (copingMaps.length > 0) {
      contextParts.push('User is actively using coping strategies');
    }

    // Add success/setback context
    if (preservedContext.success_context) {
      contextParts.push('User is experiencing success in recovery');
    }
    if (preservedContext.setback_context) {
      contextParts.push('User has experienced recent setbacks');
    }

    return contextParts.length > 0 
      ? `Context: ${contextParts.join('; ')}`
      : 'Context: General recovery support request';
  }

  /**
   * Validate context preservation quality
   */
  validatePreservation(result: PreservationResult): {
    isAcceptable: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check quality score
    if (result.qualityScore < 0.3) {
      issues.push('Low context preservation quality');
      recommendations.push('Review anonymization strategy to preserve more context');
    }

    // Check for critical context loss
    const criticalMaps = result.contextMaps.filter(m => m.importance === 'critical');
    if (criticalMaps.length === 0 && Object.keys(result.preservedContext).length === 0) {
      issues.push('No critical context preserved');
      recommendations.push('Ensure critical recovery context is maintained');
    }

    // Check for over-anonymization
    if (typeof result.anonymizedData === 'string' && result.anonymizedData.length < 10) {
      issues.push('Possible over-anonymization');
      recommendations.push('Balance privacy with context preservation');
    }

    return {
      isAcceptable: issues.length === 0 || result.qualityScore >= 0.5,
      issues,
      recommendations,
    };
  }
}

// Export singleton instance
export const contextPreserver = new ContextPreserver();