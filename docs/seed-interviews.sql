-- Seed fake interviews for testing the history list + readiness trend.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.
-- 1) Replace YOUR_EMAIL_HERE with the email you signed up with.
-- Inserts 8 interviews spread ~every 4 days over the last month, with an
-- improving readiness score so the trend line slopes up.

insert into public.interviews
  (user_id, created_at, mode, role, interview_type, transcript, report, readiness_score)
select
  u.id,
  now() - make_interval(days => g.n * 4),
  case when g.n % 2 = 0 then 'text' else 'avatar' end,
  'Senior Backend Engineer',
  'behavioral',
  '[]'::jsonb,
  jsonb_build_object(
    'perQuestion', '[]'::jsonb,
    'overall', jsonb_build_object(
      'readinessScore', sc.score,
      'verdict', 'Seed data for testing.',
      'topStrengths', jsonb_build_array('Seed strength'),
      'topFixes', jsonb_build_array('Seed fix')
    )
  ),
  sc.score
from generate_series(0, 7) as g(n)
cross join lateral (
  -- newest (n=0) high, oldest (n=7) low, with a little noise
  select least(98, greatest(20, 50 + (7 - g.n) * 6 + (random() * 8 - 4)::int)) as score
) sc
cross join (select id from auth.users where email = 'YOUR_EMAIL_HERE') u;


-- ---------------------------------------------------------------------------
-- CLEANUP — remove the seed rows when you're done (run this on its own):
-- delete from public.interviews
-- where report -> 'overall' ->> 'verdict' = 'Seed data for testing.';
