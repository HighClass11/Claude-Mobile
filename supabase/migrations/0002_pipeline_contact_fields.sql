-- Add direct contact fields to pipeline_records. Real CRM data (phone, email)
-- shouldn't be buried in the free-text notes column.

alter table pipeline_records
  add column phone text,
  add column email text;
