-- Create profiles table to store additional user information
-- This table links to auth.users and stores profile data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER CHECK (age >= 18 AND age <= 80),
  gender TEXT,
  fitness_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Enable all operations for users" ON public.users;
DROP POLICY IF EXISTS "Enable all operations for goals" ON public.goals;
DROP POLICY IF EXISTS "Enable all operations for activities" ON public.activities;

-- Make user_id NOT NULL on goals and activities (critical for security)
ALTER TABLE public.goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.activities ALTER COLUMN user_id SET NOT NULL;

-- Create secure RLS policies for goals
CREATE POLICY "Users can manage their own goals"
  ON public.goals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create secure RLS policies for activities
CREATE POLICY "Users can manage their own activities"
  ON public.activities
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for users table to use auth.uid()
CREATE POLICY "Users can view their own user record"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own user record"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own user record"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger for updating updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();