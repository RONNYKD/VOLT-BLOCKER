/**
 * AI Services - Main export file for all AI-related services
 */

export { aiIntegrationService } from './AIIntegrationService';
export type { AIServiceConfig, AIRequest, AIResponse, CachedResponse } from './AIIntegrationService';

export { dataAnonymizationService } from './DataAnonymizationService';
export type { 
  AnonymizedData, 
  RecoveryData, 
  EncodedContext, 
  SafePrompt, 
  PrivacyValidationResult 
} from './DataAnonymizationService';

export { secureKeyManager } from './SecureKeyManager';
export type { KeyManagerConfig, StoredKey } from './SecureKeyManager';

export { aiErrorHandler } from './AIErrorHandler';
export type { 
  AIServiceError, 
  RequestContext, 
  FallbackResponse, 
  CrisisContext, 
  CrisisResponse 
} from './AIErrorHandler';

// Repositories
export * from './repositories';

// Recovery Coach System
export { recoveryCoachManager } from './recovery/RecoveryCoachManager';
export { recoveryStageTracker } from './recovery/RecoveryStageTracker';
export { personalizationEngine } from './recovery/PersonalizationEngine';
export { predictiveInterventionEngine } from './recovery/PredictiveInterventionEngine';
export { milestoneCelebrationService } from './recovery/MilestoneCelebrationService';

// Crisis Detection and Intervention
export { crisisDetector } from './crisis/CrisisDetector';
export { crisisInterventionSystem } from './crisis/CrisisInterventionSystem';

// Privacy-Compliant AI Manager
export { privacyCompliantAIManager } from './PrivacyCompliantAIManager';

// Types
export * from './types';

/**
 * Initialize all AI services
 */
export const initializeAIServices = async (): Promise<boolean> => {
  try {
    console.log('Initializing AI services...');
    
    // Get API key from secure storage
    const apiKey = await secureKeyManager.getGeminiKey();
    
    if (!apiKey) {
      console.warn('No API key found. AI services will use fallback responses only.');
      return false;
    }

    // Initialize AI integration service
    const initialized = await aiIntegrationService.initialize(apiKey);
    
    if (initialized) {
      console.log('AI services initialized successfully');
      return true;
    } else {
      console.error('Failed to initialize AI services');
      return false;
    }
  } catch (error) {
    console.error('Error initializing AI services:', error);
    return false;
  }
};

/**
 * Check if AI services are available
 */
export const areAIServicesAvailable = (): boolean => {
  return aiIntegrationService.isAvailable();
};

/**
 * Get AI services status
 */
export const getAIServicesStatus = () => {
  return {
    aiService: aiIntegrationService.getStatus(),
    keyManager: {
      hasKey: secureKeyManager.hasGeminiKey(),
      biometricAvailable: secureKeyManager.isBiometricAvailable(),
    },
  };
};