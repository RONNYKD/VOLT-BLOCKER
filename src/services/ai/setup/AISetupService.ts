/**
 * AI Setup Service - Handles initial setup and configuration of AI services
 * Includes secure API key storage and service initialization
 */
import { secureKeyManager } from '../SecureKeyManager';
import { aiIntegrationService } from '../AIIntegrationService';

export interface AISetupResult {
  success: boolean;
  message: string;
  keyStored?: boolean;
  serviceInitialized?: boolean;
  error?: any;
}

class AISetupService {
  private readonly GEMINI_API_KEY = 'AIzaSyBHtdH70hGlembHa8g1I6L2xp_yVKZrXew';

  /**
   * Initialize AI services with secure key storage
   */
  async initializeAIServices(): Promise<AISetupResult> {
    try {
      console.log('🔐 Setting up AI services with secure key storage...');

      // Store API key securely
      const keyStored = await secureKeyManager.storeGeminiKey(this.GEMINI_API_KEY);
      
      if (!keyStored) {
        return {
          success: false,
          message: 'Failed to store API key securely',
          keyStored: false,
          serviceInitialized: false,
        };
      }

      console.log('✅ API key stored securely in device keychain');

      // Initialize AI integration service
      const serviceInitialized = await aiIntegrationService.initialize(this.GEMINI_API_KEY);

      if (!serviceInitialized) {
        return {
          success: false,
          message: 'Failed to initialize AI integration service',
          keyStored: true,
          serviceInitialized: false,
        };
      }

      console.log('✅ AI integration service initialized successfully');

      return {
        success: true,
        message: 'AI services initialized successfully',
        keyStored: true,
        serviceInitialized: true,
      };
    } catch (error) {
      console.error('❌ Error initializing AI services:', error);
      return {
        success: false,
        message: 'Error during AI services initialization',
        error,
      };
    }
  }

  /**
   * Check if AI services are properly configured
   */
  async checkAIConfiguration(): Promise<{
    hasApiKey: boolean;
    keyValid: boolean;
    serviceReady: boolean;
    status: string;
  }> {
    try {
      // Check if API key exists
      const hasApiKey = await secureKeyManager.hasGeminiKey();
      
      if (!hasApiKey) {
        return {
          hasApiKey: false,
          keyValid: false,
          serviceReady: false,
          status: 'No API key found',
        };
      }

      // Validate key format
      const keyValidation = await secureKeyManager.testKeyFormat(this.GEMINI_API_KEY);
      
      if (!keyValidation.valid) {
        return {
          hasApiKey: true,
          keyValid: false,
          serviceReady: false,
          status: keyValidation.reason || 'Invalid API key format',
        };
      }

      // Check service status
      const serviceReady = aiIntegrationService.isAvailable();

      return {
        hasApiKey: true,
        keyValid: true,
        serviceReady,
        status: serviceReady ? 'AI services ready' : 'AI services not initialized',
      };
    } catch (error) {
      console.error('Error checking AI configuration:', error);
      return {
        hasApiKey: false,
        keyValid: false,
        serviceReady: false,
        status: 'Error checking configuration',
      };
    }
  }

  /**
   * Get masked API key for display purposes
   */
  async getMaskedApiKey(): Promise<string> {
    try {
      const apiKey = await secureKeyManager.getGeminiKey();
      if (!apiKey) {
        return 'No API key stored';
      }
      return secureKeyManager.maskApiKey(apiKey);
    } catch (error) {
      console.error('Error getting masked API key:', error);
      return 'Error retrieving key';
    }
  }

  /**
   * Reset AI configuration (for testing or troubleshooting)
   */
  async resetAIConfiguration(): Promise<boolean> {
    try {
      console.log('🔄 Resetting AI configuration...');
      
      const cleared = await secureKeyManager.clearAllKeys();
      
      if (cleared) {
        console.log('✅ AI configuration reset successfully');
      } else {
        console.log('⚠️ Failed to clear all keys');
      }

      return cleared;
    } catch (error) {
      console.error('❌ Error resetting AI configuration:', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiSetupService = new AISetupService();