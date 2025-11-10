-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  age INTEGER,
  gender TEXT,
  fitness_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value NUMERIC NOT NULL,
  duration INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_activities_goal_id ON public.activities(goal_id);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (open for now - will be restricted with auth later)
CREATE POLICY "Enable all operations for users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);