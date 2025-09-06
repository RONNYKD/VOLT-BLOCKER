/**
 * Privacy-Compliant AI Manager - Enforces privacy compliance across all AI services
 * Acts as a middleware layer to ensure all AI operations meet privacy standards
 */
import { privacyValidator, PrivacyReport } from './privacy/PrivacyValidator';
import { dataAnonymizationService } from './DataAnonymizationService';
import { aiIntegrationService, AIRequest, AIResponse } from './AIIntegrationService';
import { recoveryCoachManager } from './recovery/RecoveryCoachManager';
import { personalizationEngine } from './recovery/PersonalizationEngine';
import { predictiveInterventionEngine } from './recovery/PredictiveInterventionEngine';
import { milestoneCelebrationService } from './recovery/MilestoneCelebrationService';
import { crisisDetector } from './crisis/CrisisDetector';
import { AIInteractionType } from './types';

export interface PrivacyCompliantRequest {
  originalRequest: any;
  userId?: string;
  interactionType: AIInteractionType;
  context?: any;
  privacyLevel: 'minimal' | 'standard' | 'high' | 'maximum';
  requireAnonymization?: boolean;
}

export interface PrivacyCompliantResponse {
  content: string;
  source: 'ai' | 'cache' | 'fallback';
  privacyCompliant: boolean;
  privacyReport: PrivacyReport;
  anonymizationApplied: boolean;
  confidence: number;
  responseTime: number;
  timestamp: Date;
}

export interface ServicePrivacyStatus {
  service: string;
  privacyCompliant: boolean;
  lastValidation: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violationCount: number;
  recommendations: string[];
}

export interface PrivacyMetrics {
  totalRequests: number;
  compliantRequests: number;
  anonymizedRequests: number;
  rejectedRequests: number;
  averageRiskScore: number;
  violationsByType: Record<string, number>;
  servicesStatus: ServicePrivacyStatus[];
}

class PrivacyCompliantAIManager {
  private privacyMetrics: PrivacyMetrics = {
    totalRequests: 0,
    compliantRequests: 0,
    anonymizedRequests: 0,
    rejectedRequests: 0,
    averageRiskScore: 0,
    violationsByType: {},
    servicesStatus: [],
  };

  private requestHistory: Map<string, PrivacyCompliantResponse[]> = new Map();

  /**
   * Process AI request with privacy compliance validation
   */
  async processPrivacyCompliantRequest(request: PrivacyCompliantRequest): Promise<PrivacyCompliantResponse> {
    const startTime = Date.now();

    try {
      console.log(`🔒 Processing privacy-compliant ${request.interactionType} request`);
      
      this.privacyMetrics.totalRequests++;

      // Step 1: Validate privacy compliance of input data
      const privacyReport = await this.validateRequestPrivacy(request);

      // Step 2: Handle non-compliant data based on report
      const processedRequest = await this.handlePrivacyCompliance(request, privacyReport);

      // Step 3: Route to appropriate service with anonymized data
      const response = await this.routeToAIService(processedRequest, request.interactionType);

      // Step 4: Validate response privacy compliance
      const responsePrivacyReport = await this.validateResponsePrivacy(response.content);

      // Step 5: Create compliant response
      const compliantResponse: PrivacyCompliantResponse = {
        content: response.content,
        source: response.source,
        privacyCompliant: responsePrivacyReport.isCompliant && privacyReport.isCompliant,
        privacyReport,
        anonymizationApplied: privacyReport.anonymizationRequired,
        confidence: response.confidence,
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
      };

      // Update metrics
      this.updatePrivacyMetrics(privacyReport, responsePrivacyReport);

      // Store in history for auditing
      this.storeRequestHistory(request.userId, compliantResponse);

      console.log(`✅ Privacy-compliant response generated (Risk: ${privacyReport.riskScore}/100)`);
      return compliantResponse;

    } catch (error) {
      console.error('Privacy-Compliant AI Manager: Error processing request:', error);
      
      this.privacyMetrics.rejectedRequests++;
      
      return {
        content: 'I apologize, but I cannot process your request at this time due to privacy and safety protocols. Please try rephrasing your message or contact support if you continue experiencing issues.',
        source: 'fallback',
        privacyCompliant: false,
        privacyReport: {
          isCompliant: false,
          riskScore: 100,
          violations: [{
            type: 'PII_DETECTED',
            severity: 'CRITICAL',
            description: 'Request processing failed privacy validation',
            recommendation: 'Manual review required',
          }],
          dataClassification: 'RESTRICTED',
          processingRecommendation: 'REJECT',
          anonymizationRequired: true,
        },
        anonymizationApplied: false,
        confidence: 0.3,
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Validate privacy compliance of incoming request
   */
  private async validateRequestPrivacy(request: PrivacyCompliantRequest): Promise<PrivacyReport> {
    try {
      const validationData = {
        request: request.originalRequest,
        context: request.context,
        userId: request.userId ? 'USER_ID_PRESENT' : 'ANONYMOUS', // Don't include actual user ID in validation
      };

      return await privacyValidator.validatePrivacy(
        validationData,
        `${request.interactionType}_request`
      );
    } catch (error) {
      console.error('Privacy validation failed:', error);
      
      // Return restrictive report on validation failure
      return {
        isCompliant: false,
        riskScore: 100,
        violations: [{
          type: 'PII_DETECTED',
          severity: 'CRITICAL',
          description: 'Privacy validation process failed',
          recommendation: 'Manual review and system check required',
        }],
        dataClassification: 'RESTRICTED',
        processingRecommendation: 'REJECT',
        anonymizationRequired: true,
      };
    }
  }

  /**
   * Handle privacy compliance based on validation report
   */
  private async handlePrivacyCompliance(
    request: PrivacyCompliantRequest,
    privacyReport: PrivacyReport
  ): Promise<any> {
    switch (privacyReport.processingRecommendation) {
      case 'REJECT':
        console.warn('🚫 Request rejected due to critical privacy violations');
        throw new Error('Request contains critical privacy violations and cannot be processed');

      case 'ANONYMIZE':
        console.log('🔄 Applying anonymization to request data');
        this.privacyMetrics.anonymizedRequests++;
        
        const anonymizedData = await dataAnonymizationService.anonymizeUserData(request.originalRequest);
        
        return {
          ...request.originalRequest,
          ...anonymizedData.processedContent,
          _privacyProcessed: true,
          _sensitivityLevel: anonymizedData.sensitivityLevel,
        };

      case 'ENCRYPT':
        console.log('🔐 Request flagged for encryption (proceeding with extra caution)');
        // For now, we'll treat ENCRYPT the same as ALLOW but log it
        // In a full implementation, this would apply additional encryption
        return request.originalRequest;

      case 'ALLOW':
        console.log('✅ Request approved for standard processing');
        this.privacyMetrics.compliantRequests++;
        return request.originalRequest;

      default:
        throw new Error(`Unknown processing recommendation: ${privacyReport.processingRecommendation}`);
    }
  }

  /**
   * Route request to appropriate AI service
   */
  private async routeToAIService(
    processedRequest: any,
    interactionType: AIInteractionType
  ): Promise<{ content: string; source: string; confidence: number }> {
    switch (interactionType) {
      case 'general_support':
      case 'motivational_boost':
      case 'coping_guidance':
      case 'milestone_celebration':
      case 'progress_insight':
        return await recoveryCoachManager.generateContextualResponse(
          'anonymous_user', // Don't pass actual user ID to AI service
          processedRequest.prompt || JSON.stringify(processedRequest),
          interactionType
        );

      case 'crisis_intervention':
        // For crisis intervention, use both crisis detector and recovery coach
        try {
          await crisisDetector.detectCrisis(processedRequest);
          return await recoveryCoachManager.generateContextualResponse(
            'anonymous_user',
            processedRequest.prompt || JSON.stringify(processedRequest),
            interactionType
          );
        } catch (error) {
          console.error('Crisis intervention error:', error);
          return {
            content: 'I understand you may be going through a difficult time right now. Please remember that you are not alone, and there are people who want to help. If you are in immediate danger, please contact emergency services or a crisis hotline.',
            source: 'fallback',
            confidence: 0.9,
          };
        }

      case 'educational_content':
        // Create AI request for educational content
        const eduRequest: AIRequest = {
          prompt: processedRequest.prompt || 'Provide educational recovery content',
          category: 'education',
          context: processedRequest.context,
        };
        
        const eduResponse = await aiIntegrationService.generateResponse(eduRequest);
        return {
          content: eduResponse.content,
          source: eduResponse.source,
          confidence: eduResponse.confidence,
        };

      case 'resource_recommendation':
        const resourceRequest: AIRequest = {
          prompt: processedRequest.prompt || 'Recommend recovery resources',
          category: 'insight',
          context: processedRequest.context,
        };
        
        const resourceResponse = await aiIntegrationService.generateResponse(resourceRequest);
        return {
          content: resourceResponse.content,
          source: resourceResponse.source,
          confidence: resourceResponse.confidence,
        };

      default:
        console.warn(`Unknown interaction type: ${interactionType}, using fallback`);
        return {
          content: 'I\'m here to support you in your recovery journey. How can I help you today?',
          source: 'fallback',
          confidence: 0.7,
        };
    }
  }

  /**
   * Validate privacy compliance of AI response
   */
  private async validateResponsePrivacy(responseContent: string): Promise<PrivacyReport> {
    try {
      return await privacyValidator.validatePrivacy(
        { response: responseContent },
        'ai_response'
      );
    } catch (error) {
      console.error('Response privacy validation failed:', error);
      
      // Return cautious report on validation failure
      return {
        isCompliant: false,
        riskScore: 50,
        violations: [{
          type: 'PII_DETECTED',
          severity: 'MEDIUM',
          description: 'Response privacy validation process failed',
          recommendation: 'Review response content manually',
        }],
        dataClassification: 'CONFIDENTIAL',
        processingRecommendation: 'ANONYMIZE',
        anonymizationRequired: true,
      };
    }
  }

  /**
   * Update privacy metrics
   */
  private updatePrivacyMetrics(requestReport: PrivacyReport, responseReport: PrivacyReport): void {
    // Update average risk score
    const totalRiskScore = (this.privacyMetrics.averageRiskScore * (this.privacyMetrics.totalRequests - 1)) + requestReport.riskScore;
    this.privacyMetrics.averageRiskScore = totalRiskScore / this.privacyMetrics.totalRequests;

    // Count violations by type
    [...requestReport.violations, ...responseReport.violations].forEach(violation => {
      this.privacyMetrics.violationsByType[violation.type] = 
        (this.privacyMetrics.violationsByType[violation.type] || 0) + 1;
    });
  }

  /**
   * Store request history for auditing
   */
  private storeRequestHistory(userId: string | undefined, response: PrivacyCompliantResponse): void {
    const userKey = userId || 'anonymous';
    const userHistory = this.requestHistory.get(userKey) || [];
    
    userHistory.push(response);
    
    // Keep only last 100 requests per user
    if (userHistory.length > 100) {
      userHistory.splice(0, userHistory.length - 100);
    }
    
    this.requestHistory.set(userKey, userHistory);
  }

  /**
   * Get privacy metrics and status
   */
  getPrivacyMetrics(): PrivacyMetrics {
    return { ...this.privacyMetrics };
  }

  /**
   * Generate comprehensive privacy audit report
   */
  async generatePrivacyAuditReport(): Promise<{
    overview: {
      totalRequests: number;
      complianceRate: number;
      averageRiskScore: number;
      criticalViolations: number;
    };
    riskAssessment: string;
    recommendations: string[];
    serviceCompliance: ServicePrivacyStatus[];
    trends: {
      riskTrend: 'improving' | 'stable' | 'declining';
      commonViolations: string[];
      highRiskPatterns: string[];
    };
  }> {
    const metrics = this.getPrivacyMetrics();
    const complianceRate = (metrics.compliantRequests / Math.max(metrics.totalRequests, 1)) * 100;
    
    // Generate risk assessment
    let riskAssessment: string;
    if (metrics.averageRiskScore >= 70) {
      riskAssessment = 'HIGH RISK: Frequent privacy violations detected. Immediate attention required.';
    } else if (metrics.averageRiskScore >= 40) {
      riskAssessment = 'MODERATE RISK: Some privacy concerns identified. Enhanced monitoring recommended.';
    } else if (metrics.averageRiskScore >= 20) {
      riskAssessment = 'LOW RISK: Minor privacy issues detected. Standard monitoring sufficient.';
    } else {
      riskAssessment = 'MINIMAL RISK: Privacy compliance is excellent. Continue current practices.';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (complianceRate < 90) {
      recommendations.push('Implement additional input validation and sanitization');
    }
    
    if (metrics.rejectedRequests > metrics.totalRequests * 0.1) {
      recommendations.push('Review and optimize privacy validation rules to reduce false positives');
    }
    
    if (metrics.averageRiskScore > 30) {
      recommendations.push('Enhance data anonymization techniques');
      recommendations.push('Implement stricter PII detection patterns');
    }
    
    if (Object.keys(metrics.violationsByType).length > 5) {
      recommendations.push('Focus on addressing the most common violation types');
    }

    // Get common violations
    const violationEntries = Object.entries(metrics.violationsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const commonViolations = violationEntries.map(([type]) => type);
    const highRiskPatterns = violationEntries
      .filter(([, count]) => count > metrics.totalRequests * 0.05)
      .map(([type]) => `High frequency of ${type} violations`);

    return {
      overview: {
        totalRequests: metrics.totalRequests,
        complianceRate: Math.round(complianceRate * 100) / 100,
        averageRiskScore: Math.round(metrics.averageRiskScore * 100) / 100,
        criticalViolations: metrics.violationsByType['PII_DETECTED'] || 0,
      },
      riskAssessment,
      recommendations,
      serviceCompliance: metrics.servicesStatus,
      trends: {
        riskTrend: this.analyzeRiskTrend(),
        commonViolations,
        highRiskPatterns,
      },
    };
  }

  /**
   * Analyze risk trend from recent requests
   */
  private analyzeRiskTrend(): 'improving' | 'stable' | 'declining' {
    // In a full implementation, this would analyze historical data
    // For now, return stable
    return 'stable';
  }

  /**
   * Enable/disable strict privacy mode
   */
  setStrictPrivacyMode(enabled: boolean): void {
    privacyValidator.updateConfig({ strictMode: enabled });
    console.log(`Strict privacy mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clear privacy metrics (for testing or reset)
   */
  resetPrivacyMetrics(): void {
    this.privacyMetrics = {
      totalRequests: 0,
      compliantRequests: 0,
      anonymizedRequests: 0,
      rejectedRequests: 0,
      averageRiskScore: 0,
      violationsByType: {},
      servicesStatus: [],
    };
    
    this.requestHistory.clear();
    console.log('Privacy metrics reset');
  }

  /**
   * Get request history for audit purposes (anonymized)
   */
  getAnononymizedRequestHistory(limit: number = 50): Array<{
    timestamp: Date;
    privacyCompliant: boolean;
    riskScore: number;
    anonymizationApplied: boolean;
    source: string;
    violationCount: number;
  }> {
    const allRequests: PrivacyCompliantResponse[] = [];
    
    for (const userHistory of this.requestHistory.values()) {
      allRequests.push(...userHistory);
    }
    
    return allRequests
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
      .map(request => ({
        timestamp: request.timestamp,
        privacyCompliant: request.privacyCompliant,
        riskScore: request.privacyReport.riskScore,
        anonymizationApplied: request.anonymizationApplied,
        source: request.source,
        violationCount: request.privacyReport.violations.length,
      }));
  }

  /**
   * Test privacy compliance with sample data
   */
  async testPrivacyCompliance(testData: any): Promise<{
    passed: boolean;
    report: PrivacyReport;
    recommendations: string[];
  }> {
    try {
      const report = await privacyValidator.validatePrivacy(testData, 'compliance_test');
      
      return {
        passed: report.isCompliant,
        report,
        recommendations: report.violations.map(v => v.recommendation),
      };
    } catch (error) {
      console.error('Privacy compliance test failed:', error);
      
      return {
        passed: false,
        report: {
          isCompliant: false,
          riskScore: 100,
          violations: [{
            type: 'PII_DETECTED',
            severity: 'CRITICAL',
            description: 'Privacy compliance test failed',
            recommendation: 'Review test data and validation process',
          }],
          dataClassification: 'RESTRICTED',
          processingRecommendation: 'REJECT',
          anonymizationRequired: true,
        },
        recommendations: ['Review test data and validation process'],
      };
    }
  }
}

// Export singleton instance
export const privacyCompliantAIManager = new PrivacyCompliantAIManager();
