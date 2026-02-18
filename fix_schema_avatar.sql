-- Add 'avatar_url' column to profiles
alter table public.profiles 
add column if not exists avatar_url text;

-- Re-run bio addition just in case
alter table public.profiles 
add column if not exists bio text;

-- Force cache refresh for schema (sometimes needed in Supabase dashboard)
notify pgrst, 'reload schema';
