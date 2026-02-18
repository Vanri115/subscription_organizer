-- FIX REVIEWS FOREIGN KEY
-- Run this in Supabase SQL Editor

-- 1. Explicitly drop any existing incorrect FKs if necessary (optional, but good for cleanup if named similarly)
-- alter table public.reviews drop constraint if exists reviews_user_id_fkey;

-- 2. Add the correct Foreign Key to PROFILES
-- We use a do-block to avoid errors if it already exists, or just try straightforwardly.
do $$
begin
  -- Check if the constraint 'reviews_user_id_fkey_profiles' exists
  if not exists (select 1 from information_schema.table_constraints where constraint_name = 'reviews_user_id_fkey_profiles') then
    
    -- If 'user_id' strictly references 'auth.users' only, we might need to drop that constraint first 
    -- OR we can just add a second FK if the DB allows (Postgres usually allows multiple FKs on same column).
    -- ideally, we want it to point to profiles.

    -- Attempt to add the constraint
    alter table public.reviews
    add constraint reviews_user_id_fkey_profiles
    foreign key (user_id)
    references public.profiles(id)
    on delete cascade;

  end if;
end
$$;

-- 3. Force schema reload
notify pgrst, 'reload schema';
