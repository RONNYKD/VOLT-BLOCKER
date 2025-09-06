-- AI Rehabilitation System Database Schema
-- This migration creates all tables needed for the AI rehabilitation features

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE recovery_stage AS ENUM ('early', 'maintenance', 'challenge', 'growth');
CREATE TYPE milestone_type AS ENUM ('recovery', 'behavioral', 'personal_growth', 'community');
CREATE TYPE milestone_significance AS ENUM ('minor', 'major', 'major_breakthrough');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE trigger_type AS ENUM ('stress', 'loneliness', 'boredom', 'anxiety', 'depression', 'anger', 'fatigue', 'custom');
CREATE TYPE ai_interaction_type AS ENUM ('daily_motivation', 'crisis_intervention', 'milestone_celebration', 'insight_generation', 'education');
CREATE TYPE intervention_outcome AS ENUM ('successful', 'partial', 'unsuccessful');
CREATE TYPE user_feedback AS ENUM ('helpful', 'not_helpful', 'very_helpful');
CREATE TYPE response_source AS ENUM ('ai', 'cache', 'fallback');
CREATE TYPE privacy_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE insight_type AS ENUM ('progress', 'behavioral', 'educational', 'recommendation');
CREATE TYPE goal_category AS ENUM ('short_term', 'medium_term', 'long_term');
CREATE TYPE goal_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE coping_category AS ENUM ('breathing', 'physical', 'mental', 'social', 'creative', 'spiritual');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE trigger_outcome AS ENUM ('managed', 'partial', 'overwhelmed');
CREATE TYPE frequency_type AS ENUM ('rare', 'occasional', 'frequent', 'constant');
CREATE TYPE trend_type AS ENUM ('improving', 'stable', 'worsening');
CREATE TYPE content_category AS ENUM ('addiction_science', 'cbt_techniques', 'mindfulness', 'neuroplasticity', 'recovery_stages');
CREATE TYPE content_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');

-- User Recovery Profiles Table
CREATE TABLE user_recovery_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recovery_start_date DATE NOT NULL,
    current_stage recovery_stage NOT NULL DEFAULT 'early',
    days_since_last_setback INTEGER NOT NULL DEFAULT 0,
    total_recovery_days INTEGER NOT NULL DEFAULT 0,
    personal_triggers trigger_type[] DEFAULT '{}',
    coping_strategies TEXT[] DEFAULT '{}',
    support_contacts TEXT[] DEFAULT '{}',
    recovery_goals TEXT[] DEFAULT '{}',
    privacy_settings JSONB NOT NULL DEFAULT '{
        "share_progress_anonymously": false,
        "allow_ai_analysis": true,
        "data_retention_days": 365,
        "emergency_contact_access": true
    }',
    ai_coaching_enabled BOOLEAN NOT NULL DEFAULT true,
    crisis_intervention_enabled BOOLEAN NOT NULL DEFAULT true,
    milestone_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_recovery_profile UNIQUE (user_id),
    CONSTRAINT valid_days_since_setback CHECK (days_since_last_setback >= 0),
    CONSTRAINT valid_total_recovery_days CHECK (total_recovery_days >= 0)
);

-- Daily Check-ins Table
CREATE TABLE daily_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood_rating INTEGER NOT NULL CHECK (mood_rating >= 1 AND mood_rating <= 10),
    energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 10),
    stress_level INTEGER NOT NULL CHECK (stress_level >= 1 AND stress_level <= 10),
    sleep_quality INTEGER NOT NULL CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    trigger_events JSONB DEFAULT '[]',
    coping_strategies_used TEXT[] DEFAULT '{}',
    focus_sessions_completed INTEGER DEFAULT 0,
    productive_hours DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    ai_coach_interactions INTEGER DEFAULT 0,
    reflection_completed BOOLEAN DEFAULT false,
    gratitude_entries TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_daily_checkin UNIQUE (user_id, date),
    CONSTRAINT valid_focus_sessions CHECK (focus_sessions_completed >= 0),
    CONSTRAINT valid_productive_hours CHECK (productive_hours >= 0 AND productive_hours <= 24),
    CONSTRAINT valid_ai_interactions CHECK (ai_coach_interactions >= 0)
);

-- Milestone Records Table
CREATE TABLE milestone_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_type milestone_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    achievement_date DATE NOT NULL,
    days_to_achieve INTEGER NOT NULL,
    significance milestone_significance NOT NULL,
    celebration_viewed BOOLEAN DEFAULT false,
    celebration_content TEXT,
    personal_reflection TEXT,
    next_goal_set TEXT,
    significance_rating INTEGER CHECK (significance_rating >= 1 AND significance_rating <= 10),
    shared_anonymously BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_days_to_achieve CHECK (days_to_achieve >= 0)
);

-- AI Interaction Logs Table
CREATE TABLE ai_interaction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type ai_interaction_type NOT NULL,
    anonymized_prompt TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    user_feedback user_feedback,
    response_source response_source NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processing_time_ms INTEGER NOT NULL,
    cache_hit BOOLEAN NOT NULL DEFAULT false,
    privacy_level privacy_level NOT NULL,
    context_markers TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_processing_time CHECK (processing_time_ms >= 0)
);

-- Risk Assessment Records Table
CREATE TABLE risk_assessment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    overall_risk_score INTEGER NOT NULL CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
    risk_factors JSONB NOT NULL DEFAULT '[]',
    protective_factors TEXT[] DEFAULT '{}',
    intervention_triggered BOOLEAN DEFAULT false,
    intervention_type VARCHAR(100),
    intervention_content TEXT,
    outcome intervention_outcome,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recovery Insights Table
CREATE TABLE recovery_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type insight_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    supporting_data JSONB DEFAULT '{}',
    confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
    actionable BOOLEAN DEFAULT false,
    action_items TEXT[],
    generated_by VARCHAR(20) NOT NULL CHECK (generated_by IN ('ai', 'system', 'manual')),
    viewed BOOLEAN DEFAULT false,
    helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Recovery Goals Table
CREATE TABLE recovery_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category goal_category NOT NULL,
    target_date DATE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    milestones TEXT[] DEFAULT '{}',
    completed_milestones TEXT[] DEFAULT '{}',
    status goal_status DEFAULT 'active',
    priority priority_level DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coping Strategies Table
CREATE TABLE coping_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category coping_category NOT NULL,
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    trigger_types trigger_type[] DEFAULT '{}',
    time_required_minutes INTEGER CHECK (time_required_minutes > 0),
    difficulty_level difficulty_level DEFAULT 'medium',
    success_rate INTEGER DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_usage_count CHECK (usage_count >= 0)
);

-- Crisis Intervention Records Table
CREATE TABLE crisis_intervention_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_type trigger_type NOT NULL,
    severity_level risk_level NOT NULL,
    intervention_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    intervention_content TEXT NOT NULL,
    coping_strategies_suggested TEXT[] DEFAULT '{}',
    emergency_resources_provided TEXT[] DEFAULT '{}',
    user_response VARCHAR(20) CHECK (user_response IN ('helped', 'partially_helped', 'not_helped')),
    follow_up_scheduled BOOLEAN DEFAULT false,
    follow_up_completed BOOLEAN DEFAULT false,
    escalation_required BOOLEAN DEFAULT false,
    resolution_time_minutes INTEGER CHECK (resolution_time_minutes > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Educational Content Table
CREATE TABLE educational_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category content_category NOT NULL,
    recovery_stage recovery_stage[] DEFAULT '{}',
    reading_time_minutes INTEGER NOT NULL CHECK (reading_time_minutes > 0),
    difficulty_level content_difficulty DEFAULT 'beginner',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Educational Progress Table
CREATE TABLE user_educational_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES educational_content(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    time_spent_minutes INTEGER DEFAULT 0 CHECK (time_spent_minutes >= 0),
    helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
    notes TEXT,
    bookmarked BOOLEAN DEFAULT false,
    
    -- Constraints
    CONSTRAINT unique_user_content_progress UNIQUE (user_id, content_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_recovery_profiles_user_id ON user_recovery_profiles(user_id);
CREATE INDEX idx_user_recovery_profiles_stage ON user_recovery_profiles(current_stage);

CREATE INDEX idx_daily_check_ins_user_id ON daily_check_ins(user_id);
CREATE INDEX idx_daily_check_ins_date ON daily_check_ins(date);
CREATE INDEX idx_daily_check_ins_user_date ON daily_check_ins(user_id, date);

CREATE INDEX idx_milestone_records_user_id ON milestone_records(user_id);
CREATE INDEX idx_milestone_records_type ON milestone_records(milestone_type);
CREATE INDEX idx_milestone_records_date ON milestone_records(achievement_date);

CREATE INDEX idx_ai_interaction_logs_user_id ON ai_interaction_logs(user_id);
CREATE INDEX idx_ai_interaction_logs_type ON ai_interaction_logs(interaction_type);
CREATE INDEX idx_ai_interaction_logs_created_at ON ai_interaction_logs(created_at);

CREATE INDEX idx_risk_assessment_records_user_id ON risk_assessment_records(user_id);
CREATE INDEX idx_risk_assessment_records_date ON risk_assessment_records(assessment_date);
CREATE INDEX idx_risk_assessment_records_risk_score ON risk_assessment_records(overall_risk_score);

CREATE INDEX idx_recovery_insights_user_id ON recovery_insights(user_id);
CREATE INDEX idx_recovery_insights_type ON recovery_insights(insight_type);
CREATE INDEX idx_recovery_insights_viewed ON recovery_insights(viewed);

CREATE INDEX idx_recovery_goals_user_id ON recovery_goals(user_id);
CREATE INDEX idx_recovery_goals_status ON recovery_goals(status);
CREATE INDEX idx_recovery_goals_category ON recovery_goals(category);

CREATE INDEX idx_coping_strategies_user_id ON coping_strategies(user_id);
CREATE INDEX idx_coping_strategies_category ON coping_strategies(category);
CREATE INDEX idx_coping_strategies_effectiveness ON coping_strategies(effectiveness_rating);

CREATE INDEX idx_crisis_intervention_records_user_id ON crisis_intervention_records(user_id);
CREATE INDEX idx_crisis_intervention_records_timestamp ON crisis_intervention_records(intervention_timestamp);
CREATE INDEX idx_crisis_intervention_records_severity ON crisis_intervention_records(severity_level);

CREATE INDEX idx_educational_content_category ON educational_content(category);
CREATE INDEX idx_educational_content_difficulty ON educational_content(difficulty_level);

CREATE INDEX idx_user_educational_progress_user_id ON user_educational_progress(user_id);
CREATE INDEX idx_user_educational_progress_content_id ON user_educational_progress(content_id);

-- Create updated_at triggers for tables that need them
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_recovery_profiles_updated_at BEFORE UPDATE ON user_recovery_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_check_ins_updated_at BEFORE UPDATE ON daily_check_ins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milestone_records_updated_at BEFORE UPDATE ON milestone_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_assessment_records_updated_at BEFORE UPDATE ON risk_assessment_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recovery_goals_updated_at BEFORE UPDATE ON recovery_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coping_strategies_updated_at BEFORE UPDATE ON coping_strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crisis_intervention_records_updated_at BEFORE UPDATE ON crisis_intervention_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_educational_content_updated_at BEFORE UPDATE ON educational_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE user_recovery_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coping_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_intervention_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_educational_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user data (users can only access their own data)
CREATE POLICY "Users can view their own recovery profile" ON user_recovery_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recovery profile" ON user_recovery_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recovery profile" ON user_recovery_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own check-ins" ON daily_check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own check-ins" ON daily_check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own check-ins" ON daily_check_ins FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own milestones" ON milestone_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own milestones" ON milestone_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own milestones" ON milestone_records FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI interactions" ON ai_interaction_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI interactions" ON ai_interaction_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own risk assessments" ON risk_assessment_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own risk assessments" ON risk_assessment_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own risk assessments" ON risk_assessment_records FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own insights" ON recovery_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own insights" ON recovery_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insights" ON recovery_insights FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own goals" ON recovery_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON recovery_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON recovery_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own coping strategies" ON coping_strategies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own coping strategies" ON coping_strategies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own coping strategies" ON coping_strategies FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own crisis records" ON crisis_intervention_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own crisis records" ON crisis_intervention_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own crisis records" ON crisis_intervention_records FOR UPDATE USING (auth.uid() = user_id);

-- Educational content is public (read-only for users)
CREATE POLICY "Anyone can view educational content" ON educational_content FOR SELECT USING (true);

CREATE POLICY "Users can view their own educational progress" ON user_educational_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own educational progress" ON user_educational_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own educational progress" ON user_educational_progress FOR UPDATE USING (auth.uid() = user_id);

-- Create a view for recovery statistics (computed data)
CREATE OR REPLACE VIEW recovery_statistics AS
SELECT 
    urp.user_id,
    urp.days_since_last_setback as current_streak_days,
    urp.total_recovery_days,
    COALESCE(MAX(mr.days_to_achieve), 0) as longest_streak_days,
    COUNT(DISTINCT CASE WHEN mr.milestone_type = 'recovery' THEN mr.id END) as recovery_milestones,
    COUNT(DISTINCT CASE WHEN mr.milestone_type = 'behavioral' THEN mr.id END) as behavioral_milestones,
    COUNT(DISTINCT CASE WHEN mr.milestone_type = 'personal_growth' THEN mr.id END) as personal_growth_milestones,
    COUNT(DISTINCT CASE WHEN mr.milestone_type = 'community' THEN mr.id END) as community_milestones,
    ROUND(AVG(dci.mood_rating), 2) as average_mood_rating,
    ROUND(AVG(dci.stress_level), 2) as average_stress_level,
    SUM(dci.focus_sessions_completed) as total_focus_sessions,
    SUM(dci.productive_hours) as total_productive_hours,
    COUNT(DISTINCT ail.id) as ai_interaction_count,
    COUNT(DISTINCT cir.id) as crisis_intervention_count,
    urp.updated_at as last_updated
FROM user_recovery_profiles urp
LEFT JOIN milestone_records mr ON urp.user_id = mr.user_id
LEFT JOIN daily_check_ins dci ON urp.user_id = dci.user_id AND dci.date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN ai_interaction_logs ail ON urp.user_id = ail.user_id AND ail.created_at >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN crisis_intervention_records cir ON urp.user_id = cir.user_id AND cir.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY urp.user_id, urp.days_since_last_setback, urp.total_recovery_days, urp.updated_at;

-- Grant access to the view
CREATE POLICY "Users can view their own recovery statistics" ON recovery_statistics FOR SELECT USING (auth.uid() = user_id);

-- Insert some default educational content
INSERT INTO educational_content (title, content, category, recovery_stage, reading_time_minutes, difficulty_level, tags) VALUES
('Understanding Addiction: The Science Behind Recovery', 'Addiction is a complex brain disorder that affects the reward, motivation, and memory systems...', 'addiction_science', '{early,maintenance,challenge,growth}', 15, 'beginner', '{addiction,neuroscience,recovery}'),
('Cognitive Behavioral Therapy Techniques for Recovery', 'CBT is an evidence-based approach that helps identify and change negative thought patterns...', 'cbt_techniques', '{early,maintenance,challenge}', 20, 'intermediate', '{cbt,therapy,techniques}'),
('Mindfulness and Recovery: Present Moment Awareness', 'Mindfulness practices can significantly support recovery by increasing self-awareness...', 'mindfulness', '{maintenance,challenge,growth}', 12, 'beginner', '{mindfulness,meditation,awareness}'),
('Neuroplasticity: How Your Brain Heals and Adapts', 'The brain''s ability to reorganize and form new neural connections is fundamental to recovery...', 'neuroplasticity', '{early,maintenance,growth}', 18, 'intermediate', '{neuroplasticity,brain,healing}'),
('Understanding Recovery Stages and What to Expect', 'Recovery is a journey with distinct stages, each with its own challenges and opportunities...', 'recovery_stages', '{early}', 10, 'beginner', '{stages,expectations,journey}');

COMMENT ON TABLE user_recovery_profiles IS 'Core recovery profile data for each user';
COMMENT ON TABLE daily_check_ins IS 'Daily wellness and recovery check-in data';
COMMENT ON TABLE milestone_records IS 'Achievement and milestone tracking';
COMMENT ON TABLE ai_interaction_logs IS 'Log of all AI coaching interactions';
COMMENT ON TABLE risk_assessment_records IS 'Risk assessment and intervention tracking';
COMMENT ON TABLE recovery_insights IS 'AI-generated and system insights for users';
COMMENT ON TABLE recovery_goals IS 'User-defined recovery goals and progress';
COMMENT ON TABLE coping_strategies IS 'Personal coping strategies and their effectiveness';
COMMENT ON TABLE crisis_intervention_records IS 'Crisis intervention events and outcomes';
COMMENT ON TABLE educational_content IS 'Recovery education content library';
COMMENT ON TABLE user_educational_progress IS 'User progress through educational content';