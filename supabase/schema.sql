-- CVMatch Pro — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query → Run

-- ── PROFILES TABLE ────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  full_name text,
  subscription_tier text default 'free',
  analyses_count integer default 0,
  created_at timestamptz default now()
);

-- ── CV ANALYSES TABLE ──────────────────────────────────────────────────────
create table if not exists cv_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  job_title text,
  company text,
  original_score integer,
  optimized_score integer,
  cv_text text,
  job_description text,
  optimized_cv jsonb,
  suggestions jsonb,
  missing_keywords text[],
  matched_keywords text[],
  created_at timestamptz default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table cv_analyses enable row level security;

-- Users can only see/edit their own profile
create policy "Users manage own profile"
  on profiles for all
  using (auth.uid() = user_id);

-- Users can only see/edit their own analyses
create policy "Users manage own analyses"
  on cv_analyses for all
  using (auth.uid() = user_id);

-- ── AUTO-CREATE PROFILE ON REGISTER ───────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (user_id, full_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
