/**
 * AI Initializer - Comprehensive initialization and validation of AI services
 * Handles setup, testing, and configuration of the entire AI rehabilitation system
 */
import { aiSetupService } from '../setup/AISetupService';
import { aiServiceTester } from '../testing/AIServiceTester';
import { initializePrivacySystem } from '../privacy';
import { migrationRunner } from '../database/MigrationRunner';

export interface InitializationResult {
  success: boolean;
  message: string;
  steps: InitializationStep[];
  healthCheck?: any;
  recommendations: string[];
  readyForProduction: boolean;
}

export interface InitializationStep {
  name: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
}

class AIInitializer {
  /**
   * Complete AI system initialization
   */
  async initializeAISystem(): Promise<InitializationResult> {
    console.log('🚀 Starting AI Rehabilitation System initialization...');
    
    const steps: InitializationStep[] = [];
    const recommendations: string[] = [];
    let overallSuccess = true;

    // Step 1: Initialize Privacy System
    const privacyStep = await this.initializePrivacySystem();
    steps.push(privacyStep);
    if (!privacyStep.success) overallSuccess = false;

    // Step 2: Check Database Schema
    const databaseStep = await this.checkDatabaseSchema();
    steps.push(databaseStep);
    if (!databaseStep.success) {
      recommendations.push('Run database migrations to set up AI rehabilitation schema');
    }

    // Step 3: Setup AI Services
    const setupStep = await this.setupAIServices();
    steps.push(setupStep);
    if (!setupStep.success) {
      overallSuccess = false;
      recommendations.push('Configure valid Gemini API key');
    }

    // Step 4: Run Health Check
    let healthCheck = null;
    if (setupStep.success) {
      const healthStep = await this.runHealthCheck();
      steps.push(healthStep);
      healthCheck = healthStep.details;
      
      if (!healthStep.success) {
        recommendations.push('Review AI service health check results');
      }
    }

    // Step 5: Test Recovery Features
    const recoveryTestStep = await this.testRecoveryFeatures();
    steps.push(recoveryTestStep);
    if (!recoveryTestStep.success) {
      recommendations.push('Review recovery-specific AI functionality');
    }

    // Determine production readiness
    const readyForProduction = overallSuccess && 
                              setupStep.success && 
                              privacyStep.success &&
                              (healthCheck?.overall === 'healthy' || healthCheck?.overall === 'degraded');

    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);

    return {
      success: overallSuccess,
      message: overallSuccess 
        ? `AI Rehabilitation System initialized successfully in ${totalDuration}ms`
        : 'AI Rehabilitation System initialization completed with issues',
      steps,
      healthCheck,
      recommendations,
      readyForProduction,
    };
  }

  /**
   * Initialize privacy system
   */
  private async initializePrivacySystem(): Promise<InitializationStep> {
    const startTime = Date.now();
    
    try {
      initializePrivacySystem({
        strictMode: true,
        maxDataSize: 50000,
        logViolations: false, // Disable in production
      });

      return {
        name: 'Privacy System Initialization',
        success: true,
        duration: Date.now() - startTime,
        details: {
          strictMode: true,
          maxDataSize: 50000,
        },
      };
    } catch (error) {
      return {
        name: 'Privacy System Initialization',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Check database schema status
   */
  private async checkDatabaseSchema(): Promise<InitializationStep> {
    const startTime = Date.now();
    
    try {
      const schemaStatus = await migrationRunner.checkSchemaStatus();
      
      return {
        name: 'Database Schema Check',
        success: schemaStatus.tablesExist,
        duration: Date.now() - startTime,
        details: {
          tablesExist: schemaStatus.tablesExist,
          missingTables: schemaStatus.missingTables,
          migrationTableExists: schemaStatus.migrationTableExists,
        },
      };
    } catch (error) {
      return {
        name: 'Database Schema Check',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Setup AI services
   */
  private async setupAIServices(): Promise<InitializationStep> {
    const startTime = Date.now();
    
    try {
      const result = await aiSetupService.initializeAIServices();
      
      return {
        name: 'AI Services Setup',
        success: result.success,
        duration: Date.now() - startTime,
        details: {
          keyStored: result.keyStored,
          serviceInitialized: result.serviceInitialized,
          message: result.message,
        },
        error: result.success ? undefined : result.message,
      };
    } catch (error) {
      return {
        name: 'AI Services Setup',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Run comprehensive health check
   */
  private async runHealthCheck(): Promise<InitializationStep> {
    const startTime = Date.now();
    
    try {
      const healthCheck = await aiServiceTester.runHealthCheck();
      
      return {
        name: 'AI Services Health Check',
        success: healthCheck.overall !== 'unhealthy',
        duration: Date.now() - startTime,
        details: healthCheck,
      };
    } catch (error) {
      return {
        name: 'AI Services Health Check',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Test recovery-specific features
   */
  private async testRecoveryFeatures(): Promise<InitializationStep> {
    const startTime = Date.now();
    
    try {
      const recoveryTest = await aiServiceTester.testRecoveryCoaching();
      
      return {
        name: 'Recovery Features Test',
        success: recoveryTest.success,
        duration: Date.now() - startTime,
        details: recoveryTest.details,
        error: recoveryTest.error,
      };
    } catch (error) {
      return {
        name: 'Recovery Features Test',
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
    }
  }

  /**
   * Quick initialization check
   */
  async quickCheck(): Promise<{
    initialized: boolean;
    apiKeyConfigured: boolean;
    servicesReady: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check API key
      const config = await aiSetupService.checkAIConfiguration();
      const apiKeyConfigured = config.hasApiKey && config.keyValid;
      
      if (!apiKeyConfigured) {
        issues.push('API key not configured or invalid');
      }

      // Check service status
      const servicesReady = config.serviceReady;
      
      if (!servicesReady && apiKeyConfigured) {
        issues.push('AI services not initialized');
      }

      const initialized = apiKeyConfigured && servicesReady;

      return {
        initialized,
        apiKeyConfigured,
        servicesReady,
        issues,
      };
    } catch (error) {
      issues.push(`Initialization check failed: ${error}`);
      return {
        initialized: false,
        apiKeyConfigured: false,
        servicesReady: false,
        issues,
      };
    }
  }

  /**
   * Generate initialization report
   */
  generateInitializationReport(result: InitializationResult): string {
    let report = `# AI Rehabilitation System Initialization Report\n\n`;
    
    report += `**Status:** ${result.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
    report += `**Production Ready:** ${result.readyForProduction ? '✅ YES' : '❌ NO'}\n`;
    report += `**Message:** ${result.message}\n\n`;

    report += `## Initialization Steps\n`;
    result.steps.forEach(step => {
      const status = step.success ? '✅' : '❌';
      report += `${status} **${step.name}** (${step.duration}ms)\n`;
      if (step.error) {
        report += `   Error: ${step.error}\n`;
      }
    });

    if (result.healthCheck) {
      report += `\n## Health Check Summary\n`;
      report += `- Overall Status: ${result.healthCheck.overall}\n`;
      report += `- API Key: ${result.healthCheck.apiKeyStatus}\n`;
      report += `- AI Service: ${result.healthCheck.serviceStatus}\n`;
      report += `- Fallback System: ${result.healthCheck.fallbackStatus}\n`;
    }

    if (result.recommendations.length > 0) {
      report += `\n## Recommendations\n`;
      result.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
    }

    return report;
  }

  /**
   * Reset and reinitialize system
   */
  async resetAndReinitialize(): Promise<InitializationResult> {
    console.log('🔄 Resetting AI system...');
    
    try {
      // Reset AI configuration
      await aiSetupService.resetAIConfiguration();
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reinitialize
      return await this.initializeAISystem();
    } catch (error) {
      return {
        success: false,
        message: `Reset and reinitialization failed: ${error}`,
        steps: [],
        recommendations: ['Manual system reset may be required'],
        readyForProduction: false,
      };
    }
  }
}

// Export singleton instance
export const aiInitializer = new AIInitializer();