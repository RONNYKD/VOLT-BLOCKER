/**
 * Privacy System - Main export file for all privacy-related components
 */

export { privacyValidator } from './PrivacyValidator';
export type { 
  PrivacyValidationConfig, 
  PrivacyViolation, 
  PrivacyReport, 
  DataClassificationResult 
} from './PrivacyValidator';

export { contextPreserver } from './ContextPreserver';
export type { 
  ContextMap, 
  PreservationResult, 
  ContextualReplacement 
} from './ContextPreserver';

/**
 * Initialize privacy system with recommended settings
 */
export const initializePrivacySystem = (config?: {
  strictMode?: boolean;
  maxDataSize?: number;
  logViolations?: boolean;
}) => {
  if (config) {
    privacyValidator.updateConfig(config);
  }
  
  console.log('✅ Privacy system initialized with enhanced protection');
};

/**
 * Quick privacy check for data
 */
export const quickPrivacyCheck = async (data: any): Promise<{
  safe: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}> => {
  try {
    const report = await privacyValidator.validatePrivacy(data);
    
    return {
      safe: report.isCompliant,
      riskLevel: report.riskScore >= 80 ? 'high' : 
                report.riskScore >= 50 ? 'medium' : 'low',
      recommendation: report.processingRecommendation,
    };
  } catch (error) {
    return {
      safe: false,
      riskLevel: 'high',
      recommendation: 'REJECT',
    };
  }
};