-- Optional demo data for local development.
-- Run after signing up a user locally, with that user's uid substituted below:
--   psql "$DATABASE_URL" -v owner="'<your-auth-uid>'" -f supabase/seed.sql

begin;

insert into pipeline_records (owner_user_id, name, stage, lead_source, last_meaningful_interaction, next_action, due_date, expected_revenue, notes)
values
  (:owner, 'Marcus Webb', 'Recommendation', 'Referral', now() - interval '2 days', 'Prepare recommendation deck', current_date, 4200, 'Wants disability + life combo'),
  (:owner, 'Priya Anand', 'Application', 'Facebook Ad', now() - interval '1 day', 'Submit application to carrier', current_date, 3100, 'Approved for standard rate'),
  (:owner, 'Diane Ortiz', 'Underwriting', 'Referral', now() - interval '5 days', 'Follow up with underwriter', current_date + 2, 2800, null),
  (:owner, 'Tom Reilly', 'New Lead', 'YouTube', now() - interval '3 days', null, null, null, 'Booked a call, no next action set yet'),
  (:owner, 'Angela Cho', 'Client', 'Referral', now() - interval '30 days', 'Schedule annual review', current_date + 14, 0, 'Great client, refers often');

insert into tasks (owner_user_id, title, category, subcategory, status, is_revenue_task, expected_revenue, due_date, pinned_as_one_thing)
values
  (:owner, 'Call Marcus to confirm recommendation meeting', 'revenue_now', 'Revenue-producing follow-up', 'not_started', true, 4200, current_date, true),
  (:owner, 'Submit Priya''s application', 'revenue_now', 'Applications waiting to be submitted', 'not_started', true, 3100, current_date, false),
  (:owner, 'Review carousel draft', 'marketing', 'Review carousel', 'not_started', false, null, current_date + 1, false),
  (:owner, 'Quarterly licensing renewal', 'ceo', 'Licensing', 'not_started', false, null, current_date + 20, false);

insert into appointments (owner_user_id, title, type, status, scheduled_at, duration_minutes, prep_checklist)
values
  (:owner, 'Marcus Webb — Recommendation Meeting', 'Recommendation', 'scheduled', now() + interval '3 hours', 45,
    '[{"label":"Print recommendation deck","done":false},{"label":"Confirm illustration numbers","done":true}]'::jsonb),
  (:owner, 'Angela Cho — Annual Review', 'Annual Review', 'scheduled', now() + interval '1 day', 30, '[]'::jsonb);

insert into waiting_items (owner_user_id, title, waiting_on, status)
values
  (:owner, 'Underwriting decision on Diane Ortiz', 'Carrier', 'waiting'),
  (:owner, 'Signed application from Priya', 'Client', 'waiting');

insert into campaigns (owner_user_id, title, action, status, due_date)
values
  (:owner, 'Approve this week''s YouTube video', 'approve', 'pending', current_date + 1),
  (:owner, 'Film Reel — "3 mistakes new parents make with life insurance"', 'film', 'pending', current_date + 2);

insert into projects (owner_user_id, title, category, status, next_step)
values
  (:owner, 'Renew state licensing for 2 new states', 'Licensing', 'in_progress', 'Submit paperwork to state board'),
  (:owner, 'Hire a part-time client services coordinator', 'Hiring', 'not_started', 'Write job description');

insert into ideas (owner_user_id, content, status)
values
  (:owner, 'Offer a "family protection audit" as a lead magnet', 'new'),
  (:owner, 'Partner with a local CPA firm for referrals', 'new');

insert into revenue_goals (owner_user_id, month, monthly_goal)
values (:owner, date_trunc('month', current_date), 40000)
on conflict (owner_user_id, month) do update set monthly_goal = excluded.monthly_goal;

insert into revenue_entries (owner_user_id, amount, description, recorded_at)
values
  (:owner, 3100, 'Priya Anand — policy delivered', current_date - 5),
  (:owner, 2800, 'Client renewal commission', current_date - 10);

commit;
