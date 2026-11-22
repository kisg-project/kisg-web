create type public.notification_kind as enum (
  'absen_luar_lokasi_diajukan',
  'absen_luar_lokasi_diputuskan',
  'sidik_jari_direset'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  body text not null default '',
  href text not null default '/portal',
  dedupe_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_title_length check (char_length(title) between 1 and 120),
  constraint notifications_body_length check (char_length(body) <= 400),
  constraint notifications_href_portal check (href = '/portal' or href like '/portal/%'),
  constraint notifications_dedupe unique (user_id, dedupe_key)
);

create index notifications_user_created on public.notifications (user_id, created_at desc);
create index notifications_user_unread on public.notifications (user_id) where read_at is null;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz,
  constraint push_subscriptions_endpoint_https check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  constraint push_subscriptions_keys_length check (char_length(p256dh) <= 200 and char_length(auth) <= 100),
  constraint push_subscriptions_agent_length check (user_agent is null or char_length(user_agent) <= 300)
);

create index push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
revoke all on public.notifications, public.push_subscriptions from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select, delete on public.push_subscriptions to authenticated;
grant all on public.notifications, public.push_subscriptions to service_role;

create policy "notifikasi: dibaca pemilik"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "notifikasi: ditandai dibaca oleh pemilik"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "langganan push: dibaca pemilik"
  on public.push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "langganan push: dihapus pemilik"
  on public.push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.notification_approvers(p_user uuid)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct r.user_id
  from public.user_roles r
  join public.profiles p on p.id = r.user_id and p.is_active and p.deleted_at is null
  where r.user_id <> p_user
    and (
      r.role in ('owner', 'admin')
      or (
        r.role in ('marketing_manager', 'site_manager')
        and exists (
          select 1
          from public.team_members a
          join public.team_members b on b.team_id = a.team_id
          where a.user_id = r.user_id and b.user_id = p_user
        )
      )
    );
$$;

revoke all on function public.notification_approvers(uuid) from public, anon, authenticated;
grant execute on function public.notification_approvers(uuid) to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
