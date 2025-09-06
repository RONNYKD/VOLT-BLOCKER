/**
 * Data Anonymization Service - Ensures user privacy by anonymizing sensitive data
 * before sending to AI services
 */
import CryptoJS from 'crypto-js';
import { privacyValidator } from './privacy/PrivacyValidator';
import { contextPreserver } from './privacy/ContextPreserver';

export interface AnonymizedData {
  processedContent: any;
  contextMarkers: string[];
  sensitivityLevel: 'low' | 'medium' | 'high';
  processingTimestamp: Date;
}

export interface RecoveryData {
  userId?: string;
  recoveryStage: string;
  daysSinceLastSetback: number;
  moodRating?: number;
  stressLevel?: number;
  triggerEvents?: string[];
  personalNotes?: string;
  email?: string;
  name?: string;
}

export interface EncodedContext {
  stage: string;
  progress: string;
  mood: string;
  risk_factors: string[];
  temporal_context: string;
}

export interface SafePrompt {
  prompt: string;
  contextMarkers: string[];
  sensitivityLevel: 'low' | 'medium' | 'high';
}

export interface PrivacyValidationResult {
  isValid: boolean;
  violations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

class DataAnonymizationService {
  private readonly PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Simple name pattern
    address: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/gi,
  };

  private readonly SENSITIVE_RECOVERY_TERMS = {
    // Map explicit terms to coded language
    'pornography': 'digital_content_category_a',
    'porn': 'digital_content_category_a',
    'adult content': 'digital_content_category_a',
    'explicit material': 'digital_content_category_a',
    'masturbation': 'behavioral_pattern_a',
    'self-pleasure': 'behavioral_pattern_a',
    'sex': 'intimate_behavior',
    'sexual': 'intimate_behavior',
    'addiction': 'dependency_pattern',
    'addicted': 'dependency_pattern',
    'relapse': 'setback_event',
    'relapsed': 'setback_event',
    'urges': 'impulse_event',
    'urge': 'impulse_event',
    'craving': 'impulse_event',
    'temptation': 'impulse_event',
    'trigger': 'risk_factor',
    'triggered': 'risk_factor',
    'shame': 'negative_emotion_a',
    'ashamed': 'negative_emotion_a',
    'guilt': 'negative_emotion_b',
    'guilty': 'negative_emotion_b',
    'depression': 'mood_state_low',
    'depressed': 'mood_state_low',
    'anxiety': 'stress_response_elevated',
    'anxious': 'stress_response_elevated',
    'stress': 'stress_response_elevated',
    'stressed': 'stress_response_elevated',
    'loneliness': 'social_isolation_factor',
    'lonely': 'social_isolation_factor',
    'isolated': 'social_isolation_factor',
    'worthless': 'negative_self_perception',
    'failure': 'negative_self_perception',
    'hopeless': 'negative_emotion_c',
    'despair': 'negative_emotion_c',
  };

  private readonly RECOVERY_STAGE_CODES = {
    'early': 'stage_alpha',
    'maintenance': 'stage_beta',
    'challenge': 'stage_gamma',
    'growth': 'stage_delta',
  };

  /**
   * Anonymize user data by removing PII and encoding sensitive content
   */
  async anonymizeUserData(rawData: any): Promise<AnonymizedData> {
    try {
      // First, validate privacy compliance
      const privacyReport = await privacyValidator.validatePrivacy(rawData);
      
      if (privacyReport.processingRecommendation === 'REJECT') {
        throw new Error('Data contains critical privacy violations and cannot be processed');
      }

      let processedContent = JSON.parse(JSON.stringify(rawData)); // Deep clone
      const contextMarkers: string[] = [];
      let sensitivityLevel: 'low' | 'medium' | 'high' = privacyReport.dataClassification === 'RESTRICTED' ? 'high' :
        privacyReport.dataClassification === 'CONFIDENTIAL' ? 'medium' : 'low';

      // Apply context preservation if needed
      if (privacyReport.processingRecommendation === 'ANONYMIZE') {
        const preservationResult = await contextPreserver.preserveContext(processedContent, sensitivityLevel);
        processedContent = preservationResult.anonymizedData;
        
        // Add context information to markers
        contextMarkers.push(...preservationResult.contextMaps.map(cm => `context_${cm.category}`));
        contextMarkers.push(`preservation_quality_${Math.round(preservationResult.qualityScore * 100)}`);
      }

      // Remove PII
      processedContent = this.stripPII(processedContent, contextMarkers);
      
      // Encode sensitive recovery terms
      processedContent = this.encodeSensitiveTerms(processedContent, contextMarkers);
      
      // Add privacy report markers
      contextMarkers.push(`privacy_risk_${privacyReport.riskScore}`);
      contextMarkers.push(`data_classification_${privacyReport.dataClassification.toLowerCase()}`);
      contextMarkers.push('recovery_context');

      return {
        processedContent,
        contextMarkers,
        sensitivityLevel,
        processingTimestamp: new Date(),
      };
    } catch (error) {
      console.error('Data Anonymization: Error processing data:', error);
      throw new Error('Failed to anonymize user data');
    }
  }

  /**
   * Encode recovery-specific data with coded language
   */
  async encodeRecoveryContext(recoveryData: RecoveryData): Promise<EncodedContext> {
    try {
      const encoded: EncodedContext = {
        stage: this.RECOVERY_STAGE_CODES[recoveryData.recoveryStage as keyof typeof this.RECOVERY_STAGE_CODES] || 'stage_unknown',
        progress: this.encodeProgressMetric(recoveryData.daysSinceLastSetback),
        mood: this.encodeMoodLevel(recoveryData.moodRating),
        risk_factors: this.encodeRiskFactors(recoveryData.triggerEvents || []),
        temporal_context: this.encodeTimeContext(),
      };

      return encoded;
    } catch (error) {
      console.error('Data Anonymization: Error encoding recovery context:', error);
      throw new Error('Failed to encode recovery context');
    }
  }

  /**
   * Create a safe prompt for AI processing
   */
  async createSafePrompt(userInput: string, context: any): Promise<SafePrompt> {
    try {
      let prompt = userInput;
      const contextMarkers: string[] = [];

      // Remove PII from prompt
      prompt = this.stripPIIFromText(prompt, contextMarkers);
      
      // Encode sensitive terms
      prompt = this.encodeSensitiveTermsInText(prompt, contextMarkers);
      
      // Add context safely
      if (context) {
        const anonymizedContext = await this.anonymizeUserData(context);
        prompt += `\n\nContext: ${JSON.stringify(anonymizedContext.processedContent)}`;
        contextMarkers.push(...anonymizedContext.contextMarkers);
      }

      const sensitivityLevel = this.calculateSensitivityLevel(contextMarkers);

      return {
        prompt,
        contextMarkers,
        sensitivityLevel,
      };
    } catch (error) {
      console.error('Data Anonymization: Error creating safe prompt:', error);
      throw new Error('Failed to create safe prompt');
    }
  }

  /**
   * Validate that data meets privacy compliance standards
   */
  async validatePrivacyCompliance(data: any): Promise<PrivacyValidationResult> {
    try {
      // Use the enhanced privacy validator
      const privacyReport = await privacyValidator.validatePrivacy(data);
      
      return {
        isValid: privacyReport.isCompliant,
        violations: privacyReport.violations.map(v => v.description),
        riskLevel: privacyReport.riskScore >= 80 ? 'high' : 
                  privacyReport.riskScore >= 50 ? 'medium' : 'low',
        recommendations: privacyReport.violations.map(v => v.recommendation),
      };
    } catch (error) {
      console.error('Data Anonymization: Error validating privacy compliance:', error);
      return {
        isValid: false,
        violations: ['Privacy validation process failed'],
        riskLevel: 'high',
        recommendations: ['Manual review required', 'Check data format and content'],
      };
    }
  }

  /**
   * Strip PII from data object
   */
  private stripPII(data: any, contextMarkers: string[]): any {
    if (typeof data === 'string') {
      return this.stripPIIFromText(data, contextMarkers);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.stripPII(item, contextMarkers));
    }

    if (typeof data === 'object' && data !== null) {
      const cleaned: any = {};
      
      Object.entries(data).forEach(([key, value]) => {
        // Skip known PII fields
        if (['email', 'phone', 'ssn', 'creditCard', 'userId', 'name', 'address'].includes(key)) {
          contextMarkers.push(`removed_${key}`);
          cleaned[key] = `[${key.toUpperCase()}_REMOVED]`;
        } else {
          cleaned[key] = this.stripPII(value, contextMarkers);
        }
      });

      return cleaned;
    }

    return data;
  }

  /**
   * Strip PII from text
   */
  private stripPIIFromText(text: string, contextMarkers: string[]): string {
    let cleanedText = text;

    Object.entries(this.PII_PATTERNS).forEach(([type, pattern]) => {
      if (pattern.test(cleanedText)) {
        cleanedText = cleanedText.replace(pattern, `[${type.toUpperCase()}_REMOVED]`);
        contextMarkers.push(`removed_${type}`);
      }
    });

    return cleanedText;
  }

  /**
   * Encode sensitive terms in data
   */
  private encodeSensitiveTerms(data: any, contextMarkers: string[]): any {
    if (typeof data === 'string') {
      return this.encodeSensitiveTermsInText(data, contextMarkers);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.encodeSensitiveTerms(item, contextMarkers));
    }

    if (typeof data === 'object' && data !== null) {
      const encoded: any = {};
      
      Object.entries(data).forEach(([key, value]) => {
        encoded[key] = this.encodeSensitiveTerms(value, contextMarkers);
      });

      return encoded;
    }

    return data;
  }

  /**
   * Encode sensitive terms in text
   */
  private encodeSensitiveTermsInText(text: string, contextMarkers: string[]): string {
    let encodedText = text;

    Object.entries(this.SENSITIVE_RECOVERY_TERMS).forEach(([term, code]) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(encodedText)) {
        encodedText = encodedText.replace(regex, code);
        contextMarkers.push(`encoded_${term}`);
      }
    });

    return encodedText;
  }

  /**
   * Encode progress metric
   */
  private encodeProgressMetric(days: number): string {
    if (days < 7) return 'progress_early';
    if (days < 30) return 'progress_building';
    if (days < 90) return 'progress_established';
    return 'progress_advanced';
  }

  /**
   * Encode mood level
   */
  private encodeMoodLevel(mood?: number): string {
    if (!mood) return 'mood_unknown';
    if (mood <= 3) return 'mood_low';
    if (mood <= 6) return 'mood_moderate';
    return 'mood_positive';
  }

  /**
   * Encode risk factors
   */
  private encodeRiskFactors(triggers: string[]): string[] {
    return triggers.map(trigger => {
      const lowerTrigger = trigger.toLowerCase();
      const encoded = this.SENSITIVE_RECOVERY_TERMS[lowerTrigger];
      return encoded || `risk_factor_${CryptoJS.SHA256(trigger).toString().substring(0, 8)}`;
    });
  }

  /**
   * Encode time context
   */
  private encodeTimeContext(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'time_early_morning';
    if (hour < 12) return 'time_morning';
    if (hour < 18) return 'time_afternoon';
    return 'time_evening';
  }

  /**
   * Calculate sensitivity level based on context markers
   */
  private calculateSensitivityLevel(contextMarkers: string[]): 'low' | 'medium' | 'high' {
    const highRiskMarkers = contextMarkers.filter(marker => 
      marker.includes('removed_') || marker.includes('encoded_')
    );

    if (highRiskMarkers.length > 3) return 'high';
    if (highRiskMarkers.length > 0) return 'medium';
    return 'low';
  }

  /**
   * Generate anonymized user ID for tracking without PII
   */
  generateAnonymousId(userId: string): string {
    return CryptoJS.SHA256(userId + 'recovery_salt').toString().substring(0, 16);
  }

  /**
   * Check if text contains sensitive information
   */
  containsSensitiveInfo(text: string): boolean {
    const textLower = text.toLowerCase();
    
    // Check for PII patterns
    const hasPII = Object.values(this.PII_PATTERNS).some(pattern => pattern.test(text));
    
    // Check for sensitive terms
    const hasSensitiveTerms = Object.keys(this.SENSITIVE_RECOVERY_TERMS)
      .some(term => textLower.includes(term));

    return hasPII || hasSensitiveTerms;
  }
}

// Export singleton instance
export const dataAnonymizationService = new DataAnonymizationService();