/**
 * AI Rehabilitation System - Type Definitions
 * Comprehensive type definitions for recovery data models
 */

// Recovery Stage Types
export type RecoveryStage = 'early' | 'maintenance' | 'challenge' | 'growth';

// Milestone Types
export type MilestoneType = 'recovery' | 'behavioral' | 'personal_growth' | 'community';
export type MilestoneSignificance = 'minor' | 'major' | 'major_breakthrough';

// Risk Assessment Types
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type TriggerType = 'stress' | 'loneliness' | 'boredom' | 'anxiety' | 'depression' | 'anger' | 'fatigue' | 'custom';

// AI Interaction Types
export type AIInteractionType = 'daily_motivation' | 'crisis_intervention' | 'milestone_celebration' | 'insight_generation' | 'education';

// User Recovery Profile
export interface UserRecoveryProfile {
  id: string;
  user_id: string;
  recovery_start_date: string; // ISO date string
  current_stage: RecoveryStage;
  days_since_last_setback: number;
  total_recovery_days: number;
  personal_triggers: TriggerType[];
  coping_strategies: string[];
  support_contacts: string[]; // Phone numbers or contact IDs
  recovery_goals: string[];
  privacy_settings: RecoveryPrivacySettings;
  ai_coaching_enabled: boolean;
  crisis_intervention_enabled: boolean;
  milestone_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Privacy Settings for Recovery Data
export interface RecoveryPrivacySettings {
  share_progress_anonymously: boolean;
  allow_ai_analysis: boolean;
  data_retention_days: number;
  emergency_contact_access: boolean;
}

// Daily Check-in Data
export interface DailyCheckIn {
  id: string;
  user_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  mood_rating: number; // 1-10 scale
  energy_level: number; // 1-10 scale
  stress_level: number; // 1-10 scale
  sleep_quality: number; // 1-10 scale
  trigger_events: TriggerEvent[];
  coping_strategies_used: string[];
  focus_sessions_completed: number;
  productive_hours: number;
  notes?: string;
  ai_coach_interactions: number;
  reflection_completed: boolean;
  gratitude_entries: string[];
  created_at: string;
  updated_at: string;
}

// Trigger Event
export interface TriggerEvent {
  type: TriggerType;
  intensity: number; // 1-10 scale
  duration_minutes: number;
  context: string;
  coping_response: string;
  outcome: 'managed' | 'partial' | 'overwhelmed';
  timestamp: string;
}

// Milestone Achievement Record
export interface MilestoneRecord {
  id: string;
  user_id: string;
  milestone_type: MilestoneType;
  title: string;
  description: string;
  achievement_date: string;
  days_to_achieve: number;
  significance: MilestoneSignificance;
  celebration_viewed: boolean;
  celebration_content?: string; // AI-generated celebration message
  personal_reflection?: string;
  next_goal_set?: string;
  significance_rating: number; // 1-10 scale
  shared_anonymously: boolean;
  created_at: string;
  updated_at: string;
}

// AI Interaction Log
export interface AIInteractionLog {
  id: string;
  user_id: string;
  interaction_type: AIInteractionType;
  anonymized_prompt: string;
  ai_response: string;
  user_feedback?: 'helpful' | 'not_helpful' | 'very_helpful';
  response_source: 'ai' | 'cache' | 'fallback';
  confidence_score: number;
  processing_time_ms: number;
  cache_hit: boolean;
  privacy_level: 'low' | 'medium' | 'high';
  context_markers: string[];
  created_at: string;
}

// Risk Assessment Record
export interface RiskAssessmentRecord {
  id: string;
  user_id: string;
  assessment_date: string;
  overall_risk_score: number; // 0-100 scale
  risk_factors: RiskFactor[];
  protective_factors: string[];
  intervention_triggered: boolean;
  intervention_type?: string;
  intervention_content?: string;
  outcome?: 'successful' | 'partial' | 'unsuccessful';
  follow_up_required: boolean;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

// Risk Factor
export interface RiskFactor {
  type: TriggerType;
  severity: RiskLevel;
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  recent_occurrences: number;
  trend: 'improving' | 'stable' | 'worsening';
  mitigation_strategies: string[];
}

// Recovery Insight
export interface RecoveryInsight {
  id: string;
  user_id: string;
  insight_type: 'progress' | 'behavioral' | 'educational' | 'recommendation';
  title: string;
  description: string;
  supporting_data: any; // JSON data supporting the insight
  confidence_level: number; // 0-1 scale
  actionable: boolean;
  action_items?: string[];
  generated_by: 'ai' | 'system' | 'manual';
  viewed: boolean;
  helpful_rating?: number; // 1-5 scale
  created_at: string;
  expires_at?: string;
}

// Recovery Goal
export interface RecoveryGoal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'short_term' | 'medium_term' | 'long_term';
  target_date?: string;
  progress_percentage: number;
  milestones: string[];
  completed_milestones: string[];
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

// Coping Strategy
export interface CopingStrategy {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: 'breathing' | 'physical' | 'mental' | 'social' | 'creative' | 'spiritual';
  effectiveness_rating: number; // 1-10 scale
  usage_count: number;
  last_used: string;
  trigger_types: TriggerType[];
  time_required_minutes: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  success_rate: number; // 0-100 percentage
  notes?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

// Recovery Statistics (computed/aggregated data)
export interface RecoveryStats {
  user_id: string;
  current_streak_days: number;
  longest_streak_days: number;
  total_recovery_days: number;
  total_setbacks: number;
  average_mood_rating: number;
  average_stress_level: number;
  most_effective_coping_strategies: string[];
  common_trigger_patterns: TriggerType[];
  milestone_count_by_type: Record<MilestoneType, number>;
  weekly_progress_trend: 'improving' | 'stable' | 'declining';
  monthly_focus_hours: number;
  ai_interaction_count: number;
  last_updated: string;
}

// Crisis Intervention Record
export interface CrisisInterventionRecord {
  id: string;
  user_id: string;
  trigger_type: TriggerType;
  severity_level: RiskLevel;
  intervention_timestamp: string;
  intervention_content: string;
  coping_strategies_suggested: string[];
  emergency_resources_provided: string[];
  user_response?: 'helped' | 'partially_helped' | 'not_helped';
  follow_up_scheduled: boolean;
  follow_up_completed: boolean;
  escalation_required: boolean;
  resolution_time_minutes?: number;
  created_at: string;
  updated_at: string;
}

// Educational Content
export interface EducationalContent {
  id: string;
  title: string;
  content: string;
  category: 'addiction_science' | 'cbt_techniques' | 'mindfulness' | 'neuroplasticity' | 'recovery_stages';
  recovery_stage: RecoveryStage[];
  reading_time_minutes: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  created_at: string;
  updated_at: string;
}

// User Educational Progress
export interface UserEducationalProgress {
  id: string;
  user_id: string;
  content_id: string;
  started_at: string;
  completed_at?: string;
  progress_percentage: number;
  time_spent_minutes: number;
  helpful_rating?: number; // 1-5 scale
  notes?: string;
  bookmarked: boolean;
}

// Database Schema Types for Supabase
export interface RecoveryDatabase {
  public: {
    Tables: {
      user_recovery_profiles: {
        Row: UserRecoveryProfile;
        Insert: Omit<UserRecoveryProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserRecoveryProfile, 'id' | 'created_at'>>;
      };
      daily_check_ins: {
        Row: DailyCheckIn;
        Insert: Omit<DailyCheckIn, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DailyCheckIn, 'id' | 'created_at'>>;
      };
      milestone_records: {
        Row: MilestoneRecord;
        Insert: Omit<MilestoneRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MilestoneRecord, 'id' | 'created_at'>>;
      };
      ai_interaction_logs: {
        Row: AIInteractionLog;
        Insert: Omit<AIInteractionLog, 'id' | 'created_at'>;
        Update: Partial<Omit<AIInteractionLog, 'id' | 'created_at'>>;
      };
      risk_assessment_records: {
        Row: RiskAssessmentRecord;
        Insert: Omit<RiskAssessmentRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RiskAssessmentRecord, 'id' | 'created_at'>>;
      };
      recovery_insights: {
        Row: RecoveryInsight;
        Insert: Omit<RecoveryInsight, 'id' | 'created_at'>;
        Update: Partial<Omit<RecoveryInsight, 'id' | 'created_at'>>;
      };
      recovery_goals: {
        Row: RecoveryGoal;
        Insert: Omit<RecoveryGoal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RecoveryGoal, 'id' | 'created_at'>>;
      };
      coping_strategies: {
        Row: CopingStrategy;
        Insert: Omit<CopingStrategy, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CopingStrategy, 'id' | 'created_at'>>;
      };
      crisis_intervention_records: {
        Row: CrisisInterventionRecord;
        Insert: Omit<CrisisInterventionRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CrisisInterventionRecord, 'id' | 'created_at'>>;
      };
      educational_content: {
        Row: EducationalContent;
        Insert: Omit<EducationalContent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<EducationalContent, 'id' | 'created_at'>>;
      };
      user_educational_progress: {
        Row: UserEducationalProgress;
        Insert: Omit<UserEducationalProgress, 'id'>;
        Update: Partial<Omit<UserEducationalProgress, 'id'>>;
      };
    };
  };
}