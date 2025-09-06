/**
 * Recovery Coach System - Main exports
 * Comprehensive AI-powered recovery coaching system
 */

export { recoveryCoachManager } from './RecoveryCoachManager';
export { recoveryStageTracker } from './RecoveryStageTracker';
export { personalizationEngine } from './PersonalizationEngine';
export { predictiveInterventionEngine } from './PredictiveInterventionEngine';

export type {
  RecoveryCoachContext,
  MotivationMessage,
  CopingStrategy,
} from './RecoveryCoachManager';

export type {
  StageTransition,
  StageMetrics,
  RecoveryProgression,
} from './RecoveryStageTracker';

export type {
  PersonalizationProfile,
  ResponsePattern,
  LearningPreference,
  EngagementMetrics,
  PersonalizedContent,
} from './PersonalizationEngine';

export type {
  RiskPrediction,
  RiskFactor,
  InterventionRecommendation,
  PredictivePattern,
  InterventionType,
  InterventionExecution,
} from './PredictiveInterventionEngine';
