-- Apply AI Rehabilitation System Migration to Supabase
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/uikrxtokvqelmndkinuc/sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE recovery_stage AS ENUM ('early', 'maintenance', 'challenge', 'growth');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE milestone_type AS ENUM ('recovery', 'behavioral', 'personal_growth', 'community');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE milestone_significance AS ENUM ('minor', 'major', 'major_breakthrough');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trigger_type AS ENUM ('stress', 'loneliness', 'boredom', 'anxiety', 'depression', 'anger', 'fatigue', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ai_interaction_type AS ENUM ('daily_motivation', 'crisis_intervention', 'milestone_celebration', 'insight_generation', 'education');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User Recovery Profiles Table
CREATE TABLE IF NOT EXISTS user_recovery_profiles (
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

-- Milestone Records Table
CREATE TABLE IF NOT EXISTS milestone_records (
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

-- Daily Check-ins Table
CREATE TABLE IF NOT EXISTS daily_check_ins (
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

-- AI Interaction Logs Table
CREATE TABLE IF NOT EXISTS ai_interaction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type ai_interaction_type NOT NULL,
    anonymized_prompt TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    user_feedback VARCHAR(20) CHECK (user_feedback IN ('helpful', 'not_helpful', 'very_helpful')),
    response_source VARCHAR(20) NOT NULL CHECK (response_source IN ('ai', 'cache', 'fallback')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processing_time_ms INTEGER NOT NULL,
    cache_hit BOOLEAN NOT NULL DEFAULT false,
    privacy_level VARCHAR(10) NOT NULL CHECK (privacy_level IN ('low', 'medium', 'high')),
    context_markers TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_processing_time CHECK (processing_time_ms >= 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_recovery_profiles_user_id ON user_recovery_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_milestone_records_user_id ON milestone_records(user_id);
CREATE INDEX IF NOT EXISTS idx_milestone_records_date ON milestone_records(achievement_date);
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_id ON daily_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_date ON daily_check_ins(date);
CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_user_id ON ai_interaction_logs(user_id);

-- Create updated_at triggers for tables that need them
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_user_recovery_profiles_updated_at ON user_recovery_profiles;
CREATE TRIGGER update_user_recovery_profiles_updated_at 
    BEFORE UPDATE ON user_recovery_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestone_records_updated_at ON milestone_records;
CREATE TRIGGER update_milestone_records_updated_at 
    BEFORE UPDATE ON milestone_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_check_ins_updated_at ON daily_check_ins;
CREATE TRIGGER update_daily_check_ins_updated_at 
    BEFORE UPDATE ON daily_check_ins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE user_recovery_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interaction_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user data (users can only access their own data)
DROP POLICY IF EXISTS "Users can view their own recovery profile" ON user_recovery_profiles;
CREATE POLICY "Users can view their own recovery profile" ON user_recovery_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recovery profile" ON user_recovery_profiles;
CREATE POLICY "Users can insert their own recovery profile" ON user_recovery_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recovery profile" ON user_recovery_profiles;
CREATE POLICY "Users can update their own recovery profile" ON user_recovery_profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own milestones" ON milestone_records;
CREATE POLICY "Users can view their own milestones" ON milestone_records FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own milestones" ON milestone_records;
CREATE POLICY "Users can insert their own milestones" ON milestone_records FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own milestones" ON milestone_records;
CREATE POLICY "Users can update their own milestones" ON milestone_records FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own check-ins" ON daily_check_ins;
CREATE POLICY "Users can view their own check-ins" ON daily_check_ins FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own check-ins" ON daily_check_ins;
CREATE POLICY "Users can insert their own check-ins" ON daily_check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own check-ins" ON daily_check_ins;
CREATE POLICY "Users can update their own check-ins" ON daily_check_ins FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own AI interactions" ON ai_interaction_logs;
CREATE POLICY "Users can view their own AI interactions" ON ai_interaction_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own AI interactions" ON ai_interaction_logs;
CREATE POLICY "Users can insert their own AI interactions" ON ai_interaction_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert some sample data for testing (optional)
-- You can uncomment these lines if you want to test with sample data

/*
-- Sample recovery profile (replace with your actual user ID)
INSERT INTO user_recovery_profiles (
    user_id, 
    recovery_start_date, 
    current_stage, 
    days_since_last_setback, 
    total_recovery_days,
    personal_triggers,
    coping_strategies
) VALUES (
    auth.uid(), -- This will use the current authenticated user
    CURRENT_DATE - INTERVAL '30 days',
    'maintenance',
    30,
    45,
    ARRAY['stress', 'anxiety']::trigger_type[],
    ARRAY['meditation', 'exercise', 'journaling']
) ON CONFLICT (user_id) DO NOTHING;

-- Sample milestones
INSERT INTO milestone_records (
    user_id,
    milestone_type,
    title,
    description,
    achievement_date,
    days_to_achieve,
    significance
) VALUES 
(
    auth.uid(),
    'recovery',
    '7 Days Clean',
    'Successfully completed your first week of recovery',
    CURRENT_DATE - INTERVAL '23 days',
    7,
    'major'
),
(
    auth.uid(),
    'recovery',
    '30 Days Clean',
    'Reached an important milestone - 30 days of recovery',
    CURRENT_DATE,
    30,
    'major_breakthrough'
),
(
    auth.uid(),
    'behavioral',
    'Consistent Check-ins',
    'Completed daily check-ins for 14 consecutive days',
    CURRENT_DATE - INTERVAL '5 days',
    14,
    'minor'
) ON CONFLICT DO NOTHING;
*/

-- Verify the tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('user_recovery_profiles', 'milestone_records', 'daily_check_ins', 'ai_interaction_logs')
ORDER BY tablename;

-- Show a success message
SELECT 'AI Rehabilitation System tables created successfully!' as status;