/**
 * AI Service Tester - Comprehensive testing and validation of AI services
 * Tests API connectivity, response quality, and fallback mechanisms
 */
import { aiIntegrationService } from '../AIIntegrationService';
import { aiSetupService } from '../setup/AISetupService';
import { dataAnonymizationService } from '../DataAnonymizationService';
import { aiErrorHandler } from '../AIErrorHandler';

export interface AITestResult {
  testName: string;
  success: boolean;
  duration: number;
  response?: any;
  error?: string;
  details?: any;
}

export interface AIServiceHealthCheck {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  apiKeyStatus: 'valid' | 'invalid' | 'missing';
  serviceStatus: 'available' | 'unavailable' | 'rate_limited';
  fallbackStatus: 'working' | 'failed';
  cacheStatus: 'working' | 'failed';
  anonymizationStatus: 'working' | 'failed';
  tests: AITestResult[];
  recommendations: string[];
}

class AIServiceTester {
  /**
   * Run comprehensive AI service health check
   */
  async runHealthCheck(): Promise<AIServiceHealthCheck> {
    console.log('🔍 Running AI service health check...');
    
    const tests: AITestResult[] = [];
    const recommendations: string[] = [];

    // Test 1: API Key Configuration
    const apiKeyTest = await this.testAPIKeyConfiguration();
    tests.push(apiKeyTest);

    // Test 2: Service Initialization
    const initTest = await this.testServiceInitialization();
    tests.push(initTest);

    // Test 3: Basic AI Response
    const basicResponseTest = await this.testBasicAIResponse();
    tests.push(basicResponseTest);

    // Test 4: Data Anonymization
    const anonymizationTest = await this.testDataAnonymization();
    tests.push(anonymizationTest);

    // Test 5: Fallback System
    const fallbackTest = await this.testFallbackSystem();
    tests.push(fallbackTest);

    // Test 6: Cache System
    const cacheTest = await this.testCacheSystem();
    tests.push(cacheTest);

    // Test 7: Error Handling
    const errorHandlingTest = await this.testErrorHandling();
    tests.push(errorHandlingTest);

    // Analyze results
    const analysis = this.analyzeTestResults(tests);
    
    // Generate recommendations
    if (!apiKeyTest.success) {
      recommendations.push('Configure valid Gemini API key');
    }
    if (!initTest.success) {
      recommendations.push('Check AI service initialization');
    }
    if (!basicResponseTest.success) {
      recommendations.push('Verify API connectivity and quotas');
    }
    if (!anonymizationTest.success) {
      recommendations.push('Review data anonymization configuration');
    }
    if (!fallbackTest.success) {
      recommendations.push('Check fallback response templates');
    }

    return {
      overall: analysis.overall,
      apiKeyStatus: apiKeyTest.success ? 'valid' : 'invalid',
      serviceStatus: basicResponseTest.success ? 'available' : 'unavailable',
      fallbackStatus: fallbackTest.success ? 'working' : 'failed',
      cacheStatus: cacheTest.success ? 'working' : 'failed',
      anonymizationStatus: anonymizationTest.success ? 'working' : 'failed',
      tests,
      recommendations,
    };
  }

  /**
   * Test API key configuration
   */
  private async testAPIKeyConfiguration(): Promise<AITestResult> {
    const startTime = Date.now();
    
    try {
      const config = await aiSetupService.checkAIConfiguration();
      const duration = Date.now() - startTime;

      return {
        testName: 'API Key Configuration',
        success: config.hasApiKey && config.keyValid,
        duration,
        details: {
          hasApiKey: config.hasApiKey,
          keyValid: config.keyValid,
          status: config.status,
        },
      };
    } catch (error) {
      return {
        testName: 'API Key Configuration',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Test service initialization
   */
  private async testServiceInitialization(): Promise<AITestResult> {
    const startTime = Date.now();
    
    try {
      const result = await aiSetupService.initializeAIServices();
      const duration = Date.now() - startTime;

      return {
        testName: 'Service Initialization',
        success: result.success,
        duration,
        details: {
          keyStored: result.keyStored,
          serviceInitialized: result.serviceInitialized,
          message: result.message,
        },
      };
    } catch (error) {
      return {
        testName: 'Service Initialization',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Test basic AI response
   */
  private async testBasicAIResponse(): Promise<AITestResult> {
    const startTime = Date.now();
    
    try {
      const testRequest = {
        prompt: 'Provide a brief, supportive message for someone in recovery.',
        context: { stage: 'stage_alpha', mood: 'mood_positive' },
        category: 'motivation' as const,
      };

      const response = await aiIntegrationService.generateResponse(testRequest);
      const duration = Date.now() - startTime;

      const success = response.content.length > 10 && response.source === 'ai';

      return {
        testName: 'Basic AI Response',
        success,
        duration,
        response: {
          source: response.source,
          contentLength: response.content.length,
          confidence: response.confidence,
          cached: response.cached,
        },
        details: {
          responseTime: response.responseTime,
          timestamp: response.timestamp,
        },
      };
    } catch (error) {
      return {
        testName: 'Basic AI Response',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Test data anonymization
   */
  private async testDataAnonymization(): Promise<AITestResult> {
    const startTime = Date.now();
    
    try {
      const sensitiveData = {
        email: 'test@example.com',
        notes: 'I struggled with pornography addiction and had a relapse yesterday',
        mood: 3,
      };

      const anonymized = await dataAnonymizationService.anonymizeUserData(sensitiveData);
      const duration = Date.now() - startTime;

      const success = !JSON.stringify(anonymized.processedContent).includes('test@example.com') &&
                     !JSON.stringify(anonymized.processedContent).includes('pornography');

      return {
        testName: 'Data Anonymization',
        success,
        duration,
        details: {
          sensitivityLevel: anonymized.sensitivityLevel,
          contextMarkers: anonymized.contextMarkers,
          originalSize: JSON.stringify(sensitiveData).length,
          anonymizedSize: JSON.stringify(anonymized.processedContent).length,
        },
      };
    } catch (error) {
      return {
        testName: 'Data Anonymization',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Test fallback system
   */
  private async testFallbackSystem(): Promise<AITestResult> {
    const startTime = Date.now();
    
    try {
      // Simulate AI service failure
      const mockError = aiErrorHandler.createAIServiceError({
        message: 'Service unavailable',
        code: 503,
      });

      const context = {
        category: 'motivation' as const,
        userStage: 'early',
        urgency: 'medium' as const,
        retryCount: 0,
      };

      const fallbackResponse = await aiErrorHandler.handleAIServiceError(mockError, context);
      const duration = Date.now() - startTime;

      const success = fallbackResponse.content.length > 10 && 
                     fallbackResponse.source === 'template';

      return {
        testName: 'Fallback System',
        success,
        duration,
        response: {
          source: fallbackResponse.source,
          contentLength: fallbackResponse.content.length,
          confidence: fallbackResponse.confidence,
          shouldRetryLater: fallbackResponse.shouldRetryLater,
        },
      };
    } catch (error) {
      return {
        testName: 'Fallback System',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Test cache system
   */
  private async testCacheSystem(): Promise<AITestResult> {
    const startTime = Date.now();
    
    try {
      // Clear cache first
      await aiIntegrationService.clearCache();

      const testRequest = {
        prompt: 'Test cache functionality with this unique prompt',
        context: { test: true },
        category: 'motivation' as const,
      };

      // First request (should not be cached)
      const response1 = await aiIntegrationService.generateResponse(testRequest);
      
      // Second request (should be cached if AI is working)
      const response2 = await aiIntegrationService.generateResponse(testRequest);
      
      const duration = Date.now() - startTime;

      // If AI is working, second response should be cached
      // If AI is not working, both will be fallback responses
      const success = response1.source !== 'cache' && 
                     (response2.cached || response2.source === 'fallback');

      return {
        testName: 'Cache System',
        success,
        duration,
        details: {
          firstResponse: {
            source: response1.source,
            cached: response1.cached,
          },
          secondResponse: {
            source: response2.source,
            cached: response2.cached,
          },
        },
      };
    } catch (error) {
      return {
        testName: 'Cache System',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<AITestResult> {
    const startTime = Date.now();
    
    try {
      // Test various error scenarios
      const errors = [
        { message: 'Rate limit exceeded', code: 429 },
        { message: 'Invalid request', code: 400 },
        { message: 'Unauthorized', code: 401 },
        { message: 'Network error', code: 'NETWORK_ERROR' },
      ];

      const results = [];
      
      for (const errorData of errors) {
        const aiError = aiErrorHandler.createAIServiceError(errorData);
        const context = {
          category: 'motivation' as const,
          userStage: 'early',
          urgency: 'medium' as const,
          retryCount: 0,
        };

        const response = await aiErrorHandler.handleAIServiceError(aiError, context);
        results.push({
          errorType: aiError.type,
          handled: response.content.length > 0,
          retryable: aiErrorHandler.isRetryable(aiError, 0),
        });
      }

      const duration = Date.now() - startTime;
      const success = results.every(r => r.handled);

      return {
        testName: 'Error Handling',
        success,
        duration,
        details: { errorTests: results },
      };
    } catch (error) {
      return {
        testName: 'Error Handling',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Analyze test results to determine overall health
   */
  private analyzeTestResults(tests: AITestResult[]): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    successRate: number;
    criticalFailures: string[];
  } {
    const successCount = tests.filter(t => t.success).length;
    const successRate = successCount / tests.length;
    
    const criticalTests = ['API Key Configuration', 'Service Initialization', 'Fallback System'];
    const criticalFailures = tests
      .filter(t => criticalTests.includes(t.testName) && !t.success)
      .map(t => t.testName);

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    
    if (criticalFailures.length > 0) {
      overall = 'unhealthy';
    } else if (successRate < 0.8) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      successRate,
      criticalFailures,
    };
  }

  /**
   * Test specific AI functionality
   */
  async testRecoveryCoaching(): Promise<AITestResult> {
    const startTime = Date.now();
    
    try {
      const recoveryScenarios = [
        {
          prompt: 'User is experiencing urges and needs immediate support',
          category: 'crisis' as const,
          expected: ['support', 'coping', 'strategies'],
        },
        {
          prompt: 'User completed 30 days of recovery',
          category: 'milestone' as const,
          expected: ['congratulations', 'achievement', 'progress'],
        },
        {
          prompt: 'User needs daily motivation',
          category: 'motivation' as const,
          expected: ['recovery', 'strength', 'journey'],
        },
      ];

      const results = [];
      
      for (const scenario of recoveryScenarios) {
        const anonymized = await dataAnonymizationService.createSafePrompt(
          scenario.prompt,
          { stage: 'stage_alpha' }
        );

        const response = await aiIntegrationService.generateResponse({
          prompt: anonymized.prompt,
          category: scenario.category,
        });

        const containsExpected = scenario.expected.some(keyword => 
          response.content.toLowerCase().includes(keyword)
        );

        results.push({
          scenario: scenario.category,
          success: response.content.length > 20 && containsExpected,
          responseLength: response.content.length,
          source: response.source,
        });
      }

      const duration = Date.now() - startTime;
      const success = results.every(r => r.success);

      return {
        testName: 'Recovery Coaching',
        success,
        duration,
        details: { scenarios: results },
      };
    } catch (error) {
      return {
        testName: 'Recovery Coaching',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Generate health report
   */
  generateHealthReport(healthCheck: AIServiceHealthCheck): string {
    const { overall, tests, recommendations } = healthCheck;
    
    let report = `# AI Service Health Report\n\n`;
    report += `**Overall Status:** ${overall.toUpperCase()}\n\n`;
    
    report += `## Service Status\n`;
    report += `- API Key: ${healthCheck.apiKeyStatus}\n`;
    report += `- AI Service: ${healthCheck.serviceStatus}\n`;
    report += `- Fallback System: ${healthCheck.fallbackStatus}\n`;
    report += `- Cache System: ${healthCheck.cacheStatus}\n`;
    report += `- Anonymization: ${healthCheck.anonymizationStatus}\n\n`;
    
    report += `## Test Results\n`;
    tests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      report += `${status} **${test.testName}** (${test.duration}ms)\n`;
      if (test.error) {
        report += `   Error: ${test.error}\n`;
      }
    });
    
    if (recommendations.length > 0) {
      report += `\n## Recommendations\n`;
      recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
    }
    
    return report;
  }
}

// Export singleton instance
export const aiServiceTester = new AIServiceTester();