-- ShaneOS — CEO Operating System
-- Initial schema: core entities, enums, RLS.
--
-- Design note: "Clients" and "Pipeline" from the product spec are modeled as a
-- single table (`pipeline_records`) whose `stage` enum runs from New Lead all
-- the way through Client / Annual Review. A "client" is simply a pipeline
-- record whose stage has reached Client or Annual Review — this avoids
-- duplicating the same person/record across two tables and two UIs.

-- ============================================================================
-- Enums
-- ============================================================================

create type pipeline_stage as enum (
  'New Lead',
  'Conversation Started',
  'Qualified',
  'Appointment Offered',
  'Appointment Scheduled',
  'Appointment Confirmed',
  'Discovery Completed',
  'Fact Finder Complete',
  'Recommendation',
  'Decision Pending',
  'Application',
  'Underwriting',
  'Approved',
  'Policy Delivered',
  'Annual Review',
  'Client'
);

create type task_category as enum (
  'revenue_now',
  'revenue_pipeline',
  'marketing',
  'ceo'
);

create type task_status as enum (
  'not_started',
  'in_progress',
  'waiting',
  'done'
);

create type appointment_type as enum (
  'Discovery',
  'Recommendation',
  'FPR',
  'Annual Review',
  'Client Service'
);

create type appointment_status as enum (
  'scheduled',
  'completed',
  'canceled',
  'no_show'
);

create type campaign_action as enum (
  'approve',
  'film',
  'record',
  'teach',
  'review',
  'plan'
);

create type campaign_status as enum (
  'pending',
  'in_progress',
  'done'
);

create type project_category as enum (
  'Licensing',
  'Technology',
  'Partnerships',
  'Business Development',
  'Systems',
  'Hiring',
  'Finance'
);

create type project_status as enum (
  'not_started',
  'in_progress',
  'waiting',
  'done'
);

create type idea_status as enum (
  'new',
  'reviewed',
  'archived',
  'promoted'
);

create type waiting_on_party as enum (
  'Shane',
  'Jori',
  'Client',
  'Carrier',
  'Marketing',
  'Operations',
  'DM'
);

create type waiting_status as enum (
  'waiting',
  'done'
);

-- ============================================================================
-- profiles — one row per authenticated user
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are self-owned" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================================
-- pipeline_records — leads, prospects, and clients across the full lifecycle
-- ============================================================================

create table pipeline_records (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  stage pipeline_stage not null default 'New Lead',
  lead_source text,
  last_meaningful_interaction timestamptz,
  next_action text,
  due_date date,
  expected_revenue numeric(12, 2),
  owner text not null default 'Shane',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pipeline_records_owner_idx on pipeline_records (owner_user_id);
create index pipeline_records_stage_idx on pipeline_records (owner_user_id, stage);
create index pipeline_records_due_date_idx on pipeline_records (owner_user_id, due_date);

alter table pipeline_records enable row level security;

create policy "pipeline_records are owner-only" on pipeline_records
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

-- ============================================================================
-- tasks — the universal work item, ranked into the Priority 1-4 hierarchy
-- ============================================================================

create table tasks (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  description text,
  category task_category not null default 'revenue_now',
  subcategory text,
  status task_status not null default 'not_started',
  is_revenue_task boolean not null default false,
  expected_revenue numeric(12, 2),
  due_date date,
  pinned_as_one_thing boolean not null default false,
  pipeline_record_id uuid references pipeline_records (id) on delete set null,
  appointment_id uuid,
  campaign_id uuid,
  project_id uuid,
  resume_completed text,
  resume_current_step text,
  resume_next_step text,
  resume_waiting_on text,
  resume_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index tasks_owner_idx on tasks (owner_user_id);
create index tasks_category_idx on tasks (owner_user_id, category, status);
create index tasks_due_date_idx on tasks (owner_user_id, due_date);
create index tasks_pinned_idx on tasks (owner_user_id, pinned_as_one_thing);

alter table tasks enable row level security;

create policy "tasks are owner-only" on tasks
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

-- ============================================================================
-- appointments
-- ============================================================================

create table appointments (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  pipeline_record_id uuid references pipeline_records (id) on delete set null,
  title text not null,
  type appointment_type not null default 'Discovery',
  status appointment_status not null default 'scheduled',
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30,
  prep_checklist jsonb not null default '[]'::jsonb,
  meeting_notes text,
  outcome text,
  next_action text,
  next_action_due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index appointments_owner_idx on appointments (owner_user_id);
create index appointments_scheduled_idx on appointments (owner_user_id, scheduled_at);

alter table appointments enable row level security;

create policy "appointments are owner-only" on appointments
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

alter table tasks
  add constraint tasks_appointment_id_fkey
  foreign key (appointment_id) references appointments (id) on delete set null;

-- ============================================================================
-- campaigns — Shane's marketing responsibilities only (not Jori's work)
-- ============================================================================

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  action campaign_action not null default 'approve',
  status campaign_status not null default 'pending',
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_owner_idx on campaigns (owner_user_id);
create index campaigns_status_idx on campaigns (owner_user_id, status);

alter table campaigns enable row level security;

create policy "campaigns are owner-only" on campaigns
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

alter table tasks
  add constraint tasks_campaign_id_fkey
  foreign key (campaign_id) references campaigns (id) on delete set null;

-- ============================================================================
-- projects — CEO projects, separate from daily tasks
-- ============================================================================

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  category project_category not null default 'Systems',
  status project_status not null default 'not_started',
  next_step text,
  resume_completed text,
  resume_current_step text,
  resume_next_step text,
  resume_waiting_on text,
  resume_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_owner_idx on projects (owner_user_id);
create index projects_status_idx on projects (owner_user_id, status);

alter table projects enable row level security;

create policy "projects are owner-only" on projects
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

alter table tasks
  add constraint tasks_project_id_fkey
  foreign key (project_id) references projects (id) on delete set null;

-- ============================================================================
-- ideas — the parking lot, reviewed weekly, never interrupts active work
-- ============================================================================

create table ideas (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  content text not null,
  category text,
  status idea_status not null default 'new',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index ideas_owner_idx on ideas (owner_user_id);
create index ideas_status_idx on ideas (owner_user_id, status);

alter table ideas enable row level security;

create policy "ideas are owner-only" on ideas
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

-- ============================================================================
-- waiting_items — nothing disappears until resolved
-- ============================================================================

create table waiting_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  waiting_on waiting_on_party not null,
  status waiting_status not null default 'waiting',
  related_type text,
  related_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index waiting_items_owner_idx on waiting_items (owner_user_id);
create index waiting_items_status_idx on waiting_items (owner_user_id, status, waiting_on);

alter table waiting_items enable row level security;

create policy "waiting_items are owner-only" on waiting_items
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

-- ============================================================================
-- revenue — monthly goals + logged revenue events for the Revenue Command Center
-- ============================================================================

create table revenue_goals (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  month date not null,
  monthly_goal numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, month)
);

alter table revenue_goals enable row level security;

create policy "revenue_goals are owner-only" on revenue_goals
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

create table revenue_entries (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  pipeline_record_id uuid references pipeline_records (id) on delete set null,
  amount numeric(12, 2) not null,
  description text,
  recorded_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index revenue_entries_owner_idx on revenue_entries (owner_user_id, recorded_at);

alter table revenue_entries enable row level security;

create policy "revenue_entries are owner-only" on revenue_entries
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

-- ============================================================================
-- daily_scorecards — completed nightly
-- ============================================================================

create table daily_scorecards (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null default current_date,
  revenue numeric(12, 2) not null default 0,
  calls integer not null default 0,
  texts integer not null default 0,
  dms integer not null default 0,
  appointments integer not null default 0,
  applications integer not null default 0,
  policies integer not null default 0,
  content_created integer not null default 0,
  biggest_win text,
  biggest_obstacle text,
  where_i_stopped text,
  tomorrows_one_thing text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id, date)
);

alter table daily_scorecards enable row level security;

create policy "daily_scorecards are owner-only" on daily_scorecards
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

-- ============================================================================
-- settings — one row per user
-- ============================================================================

create table settings (
  owner_user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  monthly_revenue_goal numeric(12, 2) not null default 0,
  avg_case_value numeric(12, 2) not null default 0,
  -- References a WorkItem.id (e.g. "task:<uuid>", "pipeline:<uuid>") rather than
  -- a single table's primary key, since Shane can pin any kind of work item as
  -- Today's One Thing, not just a task row.
  pinned_one_thing_work_item_id text,
  theme text not null default 'light',
  notification_prefs jsonb not null default '{
    "appointment_starting_soon": true,
    "application_overdue": true,
    "revenue_task_overdue": true,
    "client_waiting": true,
    "recommendation_needed": true
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table settings enable row level security;

create policy "settings are owner-only" on settings
  for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

-- Auto-create default settings row on signup.
create function handle_new_user_settings()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.settings (owner_user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created_settings
  after insert on auth.users
  for each row execute procedure handle_new_user_settings();

-- ============================================================================
-- updated_at maintenance
-- ============================================================================

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on profiles for each row execute procedure set_updated_at();
create trigger set_updated_at before update on pipeline_records for each row execute procedure set_updated_at();
create trigger set_updated_at before update on tasks for each row execute procedure set_updated_at();
create trigger set_updated_at before update on appointments for each row execute procedure set_updated_at();
create trigger set_updated_at before update on campaigns for each row execute procedure set_updated_at();
create trigger set_updated_at before update on projects for each row execute procedure set_updated_at();
create trigger set_updated_at before update on waiting_items for each row execute procedure set_updated_at();
create trigger set_updated_at before update on revenue_goals for each row execute procedure set_updated_at();
create trigger set_updated_at before update on daily_scorecards for each row execute procedure set_updated_at();
create trigger set_updated_at before update on settings for each row execute procedure set_updated_at();
