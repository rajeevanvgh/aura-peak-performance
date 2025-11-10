-- Drop the redundant users table since we have profiles
DROP TABLE IF EXISTS public.users CASCADE;

-- Update profiles table to include email
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, age, gender, fitness_level)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    (NEW.raw_user_meta_data->>'age')::integer,
    NEW.raw_user_meta_data->>'gender',
    NEW.raw_user_meta_data->>'fitness_level'
  );
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();