/**
 * Privacy Validator - Advanced privacy validation and compliance checking
 * Ensures all data meets strict privacy standards before AI processing
 */
import CryptoJS from 'crypto-js';

export interface PrivacyValidationConfig {
  strictMode: boolean;
  allowedDataTypes: string[];
  maxDataSize: number;
  requireEncryption: boolean;
  logViolations: boolean;
}

export interface PrivacyViolation {
  type: 'PII_DETECTED' | 'SENSITIVE_CONTENT' | 'SIZE_EXCEEDED' | 'ENCRYPTION_REQUIRED' | 'FORBIDDEN_DATA_TYPE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  field?: string;
  value?: string;
  description: string;
  recommendation: string;
}

export interface PrivacyReport {
  isCompliant: boolean;
  riskScore: number; // 0-100
  violations: PrivacyViolation[];
  dataClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  processingRecommendation: 'ALLOW' | 'ANONYMIZE' | 'ENCRYPT' | 'REJECT';
  anonymizationRequired: boolean;
}

export interface DataClassificationResult {
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  confidence: number;
  reasons: string[];
  sensitiveFields: string[];
}

class PrivacyValidator {
  private config: PrivacyValidationConfig;

  // Enhanced PII patterns with more comprehensive detection
  private readonly ENHANCED_PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    macAddress: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g,
    url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
    name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
    address: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Ct|Court|Place|Pl)\b/gi,
    zipCode: /\b\d{5}(?:-\d{4})?\b/g,
    dateOfBirth: /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/g,
    bankAccount: /\b\d{8,17}\b/g,
    driverLicense: /\b[A-Z]{1,2}\d{6,8}\b/g,
  };

  // Sensitive recovery-related patterns
  private readonly SENSITIVE_RECOVERY_PATTERNS = {
    explicitContent: /\b(?:pornography|porn|adult content|explicit material|xxx|nsfw)\b/gi,
    addictionTerms: /\b(?:addiction|addicted|dependency|dependent|compulsive|compulsion)\b/gi,
    relapseTerms: /\b(?:relapse|relapsed|setback|failure|gave in|lost control)\b/gi,
    emotionalTerms: /\b(?:shame|guilt|worthless|hopeless|suicidal|self-harm|cutting)\b/gi,
    behavioralTerms: /\b(?:masturbation|self-pleasure|orgasm|climax|ejaculation)\b/gi,
    mentalHealthTerms: /\b(?:depression|anxiety|panic|bipolar|schizophrenia|ptsd)\b/gi,
  };

  // Location and temporal patterns that could identify users
  private readonly IDENTIFYING_PATTERNS = {
    specificLocations: /\b(?:home|work|school|office|bedroom|bathroom|living room)\s+(?:at|in|near)\s+\d+\s+[A-Za-z\s]+(?:Street|Ave|Road|Dr)\b/gi,
    timePatterns: /\b(?:every|daily|weekly)\s+(?:at|around)\s+\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\b/gi,
    routinePatterns: /\b(?:when I|after I|before I)\s+(?:wake up|go to bed|shower|eat|work|commute)\b/gi,
  };

  constructor(config?: Partial<PrivacyValidationConfig>) {
    this.config = {
      strictMode: true,
      allowedDataTypes: ['string', 'number', 'boolean'],
      maxDataSize: 50000, // 50KB
      requireEncryption: false,
      logViolations: true,
      ...config,
    };
  }

  /**
   * Comprehensive privacy validation
   */
  async validatePrivacy(data: any, context?: string): Promise<PrivacyReport> {
    try {
      const violations: PrivacyViolation[] = [];
      const dataString = JSON.stringify(data);
      
      // Check data size
      if (dataString.length > this.config.maxDataSize) {
        violations.push({
          type: 'SIZE_EXCEEDED',
          severity: 'MEDIUM',
          description: `Data size (${dataString.length} bytes) exceeds maximum allowed (${this.config.maxDataSize} bytes)`,
          recommendation: 'Reduce data size or split into smaller chunks',
        });
      }

      // Detect PII
      const piiViolations = this.detectPII(data);
      violations.push(...piiViolations);

      // Detect sensitive recovery content
      const sensitiveViolations = this.detectSensitiveContent(data);
      violations.push(...sensitiveViolations);

      // Detect identifying patterns
      const identifyingViolations = this.detectIdentifyingPatterns(data);
      violations.push(...identifyingViolations);

      // Classify data
      const classification = this.classifyData(data, violations);

      // Calculate risk score
      const riskScore = this.calculateRiskScore(violations, classification);

      // Determine processing recommendation
      const processingRecommendation = this.getProcessingRecommendation(riskScore, violations);

      // Log violations if enabled
      if (this.config.logViolations && violations.length > 0) {
        this.logPrivacyViolations(violations, context);
      }

      return {
        isCompliant: violations.filter(v => v.severity === 'HIGH' || v.severity === 'CRITICAL').length === 0,
        riskScore,
        violations,
        dataClassification: classification.classification,
        processingRecommendation,
        anonymizationRequired: processingRecommendation === 'ANONYMIZE',
      };
    } catch (error) {
      console.error('Privacy validation error:', error);
      return {
        isCompliant: false,
        riskScore: 100,
        violations: [{
          type: 'PII_DETECTED',
          severity: 'CRITICAL',
          description: 'Privacy validation failed',
          recommendation: 'Manual review required',
        }],
        dataClassification: 'RESTRICTED',
        processingRecommendation: 'REJECT',
        anonymizationRequired: true,
      };
    }
  }

  /**
   * Detect PII in data
   */
  private detectPII(data: any): PrivacyViolation[] {
    const violations: PrivacyViolation[] = [];
    const dataString = JSON.stringify(data);

    Object.entries(this.ENHANCED_PII_PATTERNS).forEach(([type, pattern]) => {
      const matches = dataString.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            type: 'PII_DETECTED',
            severity: this.getPIISeverity(type),
            field: type,
            value: this.maskValue(match),
            description: `${type.toUpperCase()} detected in data`,
            recommendation: `Remove or anonymize ${type} information`,
          });
        });
      }
    });

    return violations;
  }

  /**
   * Detect sensitive recovery content
   */
  private detectSensitiveContent(data: any): PrivacyViolation[] {
    const violations: PrivacyViolation[] = [];
    const dataString = JSON.stringify(data).toLowerCase();

    Object.entries(this.SENSITIVE_RECOVERY_PATTERNS).forEach(([category, pattern]) => {
      const matches = dataString.match(pattern);
      if (matches) {
        violations.push({
          type: 'SENSITIVE_CONTENT',
          severity: 'HIGH',
          field: category,
          description: `Sensitive ${category} content detected`,
          recommendation: `Encode or anonymize ${category} references`,
        });
      }
    });

    return violations;
  }

  /**
   * Detect identifying patterns
   */
  private detectIdentifyingPatterns(data: any): PrivacyViolation[] {
    const violations: PrivacyViolation[] = [];
    const dataString = JSON.stringify(data);

    Object.entries(this.IDENTIFYING_PATTERNS).forEach(([category, pattern]) => {
      const matches = dataString.match(pattern);
      if (matches) {
        violations.push({
          type: 'PII_DETECTED',
          severity: 'MEDIUM',
          field: category,
          description: `Potentially identifying ${category} pattern detected`,
          recommendation: `Generalize or remove specific ${category} references`,
        });
      }
    });

    return violations;
  }

  /**
   * Classify data sensitivity level
   */
  private classifyData(data: any, violations: PrivacyViolation[]): DataClassificationResult {
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL').length;
    const highViolations = violations.filter(v => v.severity === 'HIGH').length;
    const mediumViolations = violations.filter(v => v.severity === 'MEDIUM').length;

    let classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
    let confidence: number;
    const reasons: string[] = [];
    const sensitiveFields: string[] = [];

    if (criticalViolations > 0) {
      classification = 'RESTRICTED';
      confidence = 0.95;
      reasons.push('Contains critical PII or highly sensitive information');
      sensitiveFields.push(...violations.filter(v => v.severity === 'CRITICAL').map(v => v.field || 'unknown'));
    } else if (highViolations > 0) {
      classification = 'CONFIDENTIAL';
      confidence = 0.85;
      reasons.push('Contains sensitive recovery or personal information');
      sensitiveFields.push(...violations.filter(v => v.severity === 'HIGH').map(v => v.field || 'unknown'));
    } else if (mediumViolations > 0) {
      classification = 'INTERNAL';
      confidence = 0.75;
      reasons.push('Contains potentially identifying information');
      sensitiveFields.push(...violations.filter(v => v.severity === 'MEDIUM').map(v => v.field || 'unknown'));
    } else {
      classification = 'PUBLIC';
      confidence = 0.9;
      reasons.push('No sensitive information detected');
    }

    return {
      classification,
      confidence,
      reasons,
      sensitiveFields: [...new Set(sensitiveFields)], // Remove duplicates
    };
  }

  /**
   * Calculate risk score based on violations
   */
  private calculateRiskScore(violations: PrivacyViolation[], classification: DataClassificationResult): number {
    let score = 0;

    violations.forEach(violation => {
      switch (violation.severity) {
        case 'CRITICAL':
          score += 40;
          break;
        case 'HIGH':
          score += 25;
          break;
        case 'MEDIUM':
          score += 15;
          break;
        case 'LOW':
          score += 5;
          break;
      }
    });

    // Add classification-based score
    switch (classification.classification) {
      case 'RESTRICTED':
        score += 30;
        break;
      case 'CONFIDENTIAL':
        score += 20;
        break;
      case 'INTERNAL':
        score += 10;
        break;
      case 'PUBLIC':
        score += 0;
        break;
    }

    return Math.min(100, score);
  }

  /**
   * Get processing recommendation based on risk assessment
   */
  private getProcessingRecommendation(
    riskScore: number,
    violations: PrivacyViolation[]
  ): 'ALLOW' | 'ANONYMIZE' | 'ENCRYPT' | 'REJECT' {
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL').length;
    const highViolations = violations.filter(v => v.severity === 'HIGH').length;

    if (criticalViolations > 0 || riskScore >= 80) {
      return 'REJECT';
    } else if (highViolations > 0 || riskScore >= 50) {
      return 'ANONYMIZE';
    } else if (riskScore >= 25) {
      return 'ENCRYPT';
    } else {
      return 'ALLOW';
    }
  }

  /**
   * Get PII severity level
   */
  private getPIISeverity(piiType: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalPII = ['ssn', 'creditCard', 'bankAccount', 'driverLicense'];
    const highPII = ['email', 'phone', 'address', 'dateOfBirth'];
    const mediumPII = ['name', 'zipCode', 'ipAddress'];

    if (criticalPII.includes(piiType)) return 'CRITICAL';
    if (highPII.includes(piiType)) return 'HIGH';
    if (mediumPII.includes(piiType)) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Mask sensitive values for logging
   */
  private maskValue(value: string): string {
    if (value.length <= 4) return '****';
    return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
  }

  /**
   * Log privacy violations
   */
  private logPrivacyViolations(violations: PrivacyViolation[], context?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      context: context || 'unknown',
      violationCount: violations.length,
      severityBreakdown: {
        critical: violations.filter(v => v.severity === 'CRITICAL').length,
        high: violations.filter(v => v.severity === 'HIGH').length,
        medium: violations.filter(v => v.severity === 'MEDIUM').length,
        low: violations.filter(v => v.severity === 'LOW').length,
      },
      violationTypes: [...new Set(violations.map(v => v.type))],
    };

    console.warn('Privacy violations detected:', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Generate privacy compliance report
   */
  async generateComplianceReport(data: any): Promise<{
    summary: string;
    recommendations: string[];
    riskAssessment: string;
    nextSteps: string[];
  }> {
    const report = await this.validatePrivacy(data);

    const summary = `Data classification: ${report.dataClassification}, Risk score: ${report.riskScore}/100, Violations: ${report.violations.length}`;

    const recommendations = [
      ...new Set(report.violations.map(v => v.recommendation)),
    ];

    let riskAssessment: string;
    if (report.riskScore >= 80) {
      riskAssessment = 'HIGH RISK: Data contains critical privacy violations and should not be processed without significant anonymization.';
    } else if (report.riskScore >= 50) {
      riskAssessment = 'MEDIUM RISK: Data contains sensitive information that requires anonymization before processing.';
    } else if (report.riskScore >= 25) {
      riskAssessment = 'LOW RISK: Data contains some potentially sensitive information but can be processed with basic protection.';
    } else {
      riskAssessment = 'MINIMAL RISK: Data appears safe for processing with standard privacy measures.';
    }

    const nextSteps = [];
    switch (report.processingRecommendation) {
      case 'REJECT':
        nextSteps.push('Do not process this data', 'Implement additional anonymization', 'Consider manual review');
        break;
      case 'ANONYMIZE':
        nextSteps.push('Apply comprehensive anonymization', 'Remove or encode sensitive terms', 'Re-validate after anonymization');
        break;
      case 'ENCRYPT':
        nextSteps.push('Apply encryption before processing', 'Use secure transmission channels', 'Implement access controls');
        break;
      case 'ALLOW':
        nextSteps.push('Data can be processed with standard privacy measures', 'Monitor for any privacy issues', 'Regular compliance checks');
        break;
    }

    return {
      summary,
      recommendations,
      riskAssessment,
      nextSteps,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PrivacyValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): PrivacyValidationConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const privacyValidator = new PrivacyValidator();