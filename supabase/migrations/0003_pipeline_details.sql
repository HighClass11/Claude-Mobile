-- Rich per-stage CRM tracking data (Discovery, Briefing, Recommendation,
-- Application/Underwriting, Policy, Family Protection, Annual Review,
-- Recovery). Kept as a single jsonb blob rather than ~90 dedicated columns —
-- this data is reference/context for staying up to date, not input to the
-- priority engine (which runs off the core columns + stage), so a flexible
-- shape is a better fit than a rigid one that has to be migrated every time
-- Shane's tracking process changes.
alter table pipeline_records
  add column details jsonb not null default '{}'::jsonb;
