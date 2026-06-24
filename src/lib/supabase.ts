import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Check if keys are actually provided and are not placeholder template values
export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your-supabase-url' &&
  supabaseAnonKey !== 'your-supabase-anon-key' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

/**
 * SQL Schema for Supabase PostgreSQL Editor.
 * This is provided inside the app's dev panel/profile screen for copy-pasting.
 */
export const SUPABASE_SQL_SCHEMA = `-- APEX STRENGTH TRACKER - DATABASE SETUP
-- Execute this SQL script in your Supabase SQL Editor to initialize all tables!

-- 1. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    goal_weight NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Weight Logs Table
CREATE TABLE IF NOT EXISTS public.weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Exercises Table
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for built-in, UUID for custom
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Chest, Back, etc.
    is_custom BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Workout Splits Table
CREATE TABLE IF NOT EXISTS public.workout_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    days_count INTEGER DEFAULT 3 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Workout Plans Table
CREATE TABLE IF NOT EXISTS public.workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    split_id UUID REFERENCES public.workout_splits(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { exercise_id, sets_count }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Workout Sessions Table
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    notes TEXT,
    date DATE NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of TrackedExercise with nested TrackedSets
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

-- 8. Create Policies for User Profiles
CREATE POLICY "Allow individual read access" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow individual insert access" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow individual update access" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- 9. Create Policies for Weight Logs
CREATE POLICY "Allow individual access to weight logs" ON public.weight_logs
    FOR ALL USING (auth.uid() = user_id);

-- 10. Create Policies for Exercises
CREATE POLICY "Allow read access to built-in and user exercises" ON public.exercises
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Allow insert/update/delete of own exercises" ON public.exercises
    FOR ALL USING (auth.uid() = user_id);

-- 11. Create Policies for Workout Splits
CREATE POLICY "Allow individual access to splits" ON public.workout_splits
    FOR ALL USING (auth.uid() = user_id);

-- 12. Create Policies for Workout Plans
CREATE POLICY "Allow individual access to plans" ON public.workout_plans
    FOR ALL USING (auth.uid() = user_id);

-- 13. Create Policies for Workout Sessions
CREATE POLICY "Allow individual access to sessions" ON public.workout_sessions
    FOR ALL USING (auth.uid() = user_id);

-- 14. Real-time updates (Optional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.weight_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_sessions;
`;
