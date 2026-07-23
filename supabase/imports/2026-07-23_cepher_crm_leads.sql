-- One-time import of the "Cepher CRM Leads" Google Sheet (6 contacts) into
-- ShaneOS's pipeline_records + matching appointments.
--
-- IMPORTANT: replace the email address below with the exact email you use to
-- log into ShaneOS, BEFORE running this. The SQL Editor runs as an admin role
-- with no logged-in user, so owner_user_id can't default to auth.uid() here —
-- it has to be looked up explicitly, or every row would violate the
-- not-null constraint.
--
-- Run this AFTER 0002_pipeline_contact_fields.sql has been applied (it adds
-- the phone/email columns this script writes to).

do $$
declare
  me uuid := (select id from auth.users where email = 'REPLACE_WITH_YOUR_LOGIN_EMAIL' limit 1);
begin
  if me is null then
    raise exception 'No auth user found for that email — check the email address at the top of this script.';
  end if;

  insert into pipeline_records
    (owner_user_id, name, stage, lead_source, phone, email, last_meaningful_interaction, next_action, due_date, owner, notes)
  values
    (me, 'Memo Zapata', 'Appointment Scheduled', 'Facebook', '(904) 515-8822', 'emillz87@gmail.com',
     '2026-07-14 21:37:18-04', 'Confirm appointment date and time', null,
     'Shane', 'He DM''d from Facebook from a video I posted. Classification: Qualified Lead.'),

    (me, 'Amber Sparks', 'Appointment Scheduled', 'Calendly', null, 'ambersparks1031@gmail.com',
     '2026-07-14 22:15:19-04', 'Prepare for Initial Consultation (Discovery) call', '2026-07-19',
     'Shane', 'Booked via Calendly: Initial Consultation — Sun, Jul 19 at 3:00 PM. Classification: Qualified Lead.'),

    (me, 'Jocelyn Ward', 'Appointment Offered', 'Calendly', '(386) 972-6090', 'ramos.jocelyn.96@gmail.com',
     '2026-07-14 22:15:19-04', 'Confirm the offered appointment time (Sun, Jul 19 at 1:15 PM)', '2026-07-19',
     'Shane', 'Offered via Calendly: Initial Consultation — Sun, Jul 19 at 1:15 PM. Classification: Qualified Lead. State: Florida.'),

    (me, 'Laivory Swain', 'Appointment Scheduled', 'Facebook', '904-775-6820', 'swainlaivory8@gmail.com',
     '2026-07-18 00:00:00-04', 'Log outcome from the Jul 17 Discovery meeting and confirm next step', '2026-07-23',
     'Shane', 'Reconnected through Facebook after engaging with an "I quit my job" Reel. Prospect shared that if something happened to him today, he still has things he needs to get in order and doesn''t feel his children would be financially secure. Explained the Family Protection Discovery process; prospect agreed to move forward and accepted a Discovery Meeting for Fri Jul 17 at 6:15 PM. Classification: Qualified Lead. Temperature: Warm. NOTE: this meeting has already passed with no outcome logged in the old CRM — needs follow-up.'),

    (me, 'Taleesa Billings', 'Appointment Scheduled', 'Calendly', null, 'taleesa.billings@yahoo.com',
     '2026-07-17 18:27:33-04', 'Prepare for Initial Consultation (Discovery) call', '2026-07-30',
     'Shane', 'Booked via Calendly: Initial Consultation — Thu, Jul 30 at 12:00 PM. Classification: Qualified Lead.'),

    (me, 'Jakiarra', 'Appointment Scheduled', 'Instagram', null, 'jakiarra07@gmail.com',
     '2026-07-21 15:39:43-04', 'Prepare for today''s Initial Consultation (Discovery) call', '2026-07-23',
     'Shane', 'Booked via Calendly: Initial Consultation — Thu, Jul 23 at 12:00 PM. Originated via Instagram outbound DM. Classification: Qualified Lead. Temperature: Warm. State: Florida.');

  -- Matching appointments for the contacts with a confirmed date/time.
  insert into appointments (owner_user_id, pipeline_record_id, title, type, status, scheduled_at, duration_minutes)
  select me, pr.id, 'Amber Sparks — Initial Consultation', 'Discovery', 'scheduled', '2026-07-19 15:00:00-04', 30
  from pipeline_records pr where pr.owner_user_id = me and pr.name = 'Amber Sparks';

  insert into appointments (owner_user_id, pipeline_record_id, title, type, status, scheduled_at, duration_minutes)
  select me, pr.id, 'Taleesa Billings — Initial Consultation', 'Discovery', 'scheduled', '2026-07-30 12:00:00-04', 30
  from pipeline_records pr where pr.owner_user_id = me and pr.name = 'Taleesa Billings';

  insert into appointments (owner_user_id, pipeline_record_id, title, type, status, scheduled_at, duration_minutes)
  select me, pr.id, 'Jakiarra — Initial Consultation', 'Discovery', 'scheduled', '2026-07-23 12:00:00-04', 30
  from pipeline_records pr where pr.owner_user_id = me and pr.name = 'Jakiarra';

  -- Laivory's meeting already happened (Jul 17) with no outcome recorded in the
  -- old CRM, so it's logged as completed but flagged via the pipeline record's
  -- next action above rather than left as a phantom future appointment.
  insert into appointments (owner_user_id, pipeline_record_id, title, type, status, scheduled_at, duration_minutes)
  select me, pr.id, 'Laivory Swain — Discovery Meeting', 'Discovery', 'completed', '2026-07-17 18:15:00-04', 30
  from pipeline_records pr where pr.owner_user_id = me and pr.name = 'Laivory Swain';
end $$;
