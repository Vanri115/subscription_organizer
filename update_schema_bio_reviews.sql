-- Add 'bio' column to profiles
alter table public.profiles 
add column if not exists bio text;

-- Ensure RLS allows reading profiles
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );

-- Ensure RLS allows updating own profile
drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Fix Reviews RLS just in case
drop policy if exists "Reviews are viewable by everyone." on reviews;
create policy "Reviews are viewable by everyone." on reviews for select using ( true );

drop policy if exists "Users can create/update their own reviews." on reviews;
create policy "Users can create/update their own reviews." on reviews for all using ( auth.uid() = user_id );
