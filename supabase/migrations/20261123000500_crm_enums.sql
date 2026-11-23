alter type public.notification_kind add value if not exists 'lead_baru';
alter type public.notification_kind add value if not exists 'lead_antrean';
alter type public.notification_kind add value if not exists 'lead_sla_lewat';

create type public.lead_assignment_reason as enum (
  'giliran',
  'manual',
  'sla_lewat',
  'tanpa_marketing',
  'dibuat_sendiri'
);
