-- Add 'is_public' column to profiles
alter table public.profiles 
add column if not exists is_public boolean default false;

-- USER SUBSCRIPTIONS TABLE (Cloud Sync)
create table if not exists public.user_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  service_id text not null,
  name_custom text, -- If custom service
  price numeric not null,
  currency text not null,
  cycle text not null, -- 'monthly' or 'yearly'
  category text,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.user_subscriptions enable row level security;

-- Policies for User Subscriptions

-- 1. Users can manage their own subscriptions
create policy "Users can manage own subscriptions"
  on user_subscriptions for all
  using ( auth.uid() = user_id );

-- 2. Public can view subscriptions IF the owner's profile is public
create policy "Public view if profile is public"
  on user_subscriptions for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = user_subscriptions.user_id
      and profiles.is_public = true
    )
  );
