-- Fase 2a: extension, schema private, dan enum dasar (docs/data-model.md bagian 2).
-- Nilai enum harus sama dengan src/config (roles.ts, units.ts). Dicek unit test.

create extension if not exists pgcrypto with schema extensions;

-- Schema untuk fungsi helper RLS. Tidak diekspos lewat API.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, anon, service_role, supabase_auth_admin;

create type public.app_role as enum (
  'owner',
  'admin',
  'marketing_manager',
  'marketing',
  'site_manager',
  'site_supervisor',
  'finance'
);

create type public.project_status as enum ('segera', 'tersedia', 'sold_out');

create type public.unit_status as enum ('tersedia', 'hold', 'booking', 'terjual');

create type public.content_status as enum ('draft', 'terjadwal', 'terbit', 'arsip');

create type public.team_kind as enum ('marketing', 'lapangan');

create type public.project_role as enum ('supervisor', 'manager', 'marketing');

create type public.work_location_kind as enum ('kantor', 'proyek');

create type public.audit_action as enum ('insert', 'update', 'delete', 'soft_delete');
