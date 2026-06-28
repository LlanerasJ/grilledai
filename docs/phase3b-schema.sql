-- Phase 3b — interviews table + row-level security.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists public.interviews (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  created_at      timestamptz not null default now(),
  mode            text not null default 'text',          -- 'text' | 'avatar'
  role            text,
  interview_type  text,
  jd              text,
  resume          text,
  transcript      jsonb not null,                         -- [{ speaker, content }]
  report          jsonb not null,                         -- EvaluationReport
  delivery        jsonb,                                  -- DeliveryStats | null
  readiness_score int                                     -- denormalized for trends
);

-- Each user can only see/insert/delete their own rows.
alter table public.interviews enable row level security;

create policy "Users can view their own interviews"
  on public.interviews for select
  using (auth.uid() = user_id);

create policy "Users can insert their own interviews"
  on public.interviews for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own interviews"
  on public.interviews for delete
  using (auth.uid() = user_id);

-- Fast "my interviews, newest first" lookups.
create index if not exists interviews_user_created_idx
  on public.interviews (user_id, created_at desc);
