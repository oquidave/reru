-- Automatically create a profiles row with role 'client' whenever a new auth
-- user is created. This covers all creation paths: email/password signup,
-- invite, OAuth, and manual creation via the Supabase dashboard.
--
-- To promote a user to admin after creation:
--   UPDATE profiles SET role = 'admin' WHERE user_id = '<uuid>';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, full_name)
  VALUES (
    NEW.id,
    'client',
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
