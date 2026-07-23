-- Lets external integrations (the Calendly-fed Apps Script CRM, and any
-- future source) upsert the same lead repeatedly without creating
-- duplicates. NULLs don't conflict with each other in a unique index, so
-- manually-created records (external_id null) are unaffected.
alter table pipeline_records
  add column external_id text;

create unique index pipeline_records_owner_external_id_key
  on pipeline_records (owner_user_id, external_id);
