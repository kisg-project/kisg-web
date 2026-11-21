-- Widget customer service "Jaka" (CLAUDE.md bagian 12), tahap 1: sesi, pesan, dan pemakaian token
-- harian untuk batas biaya. Semua tulisan lewat server (service role). Pengunjung tidak punya akses
-- langsung. Tim marketing dan owner bisa membaca transkrip (dipakai inbox chat di portal nanti).

create table public.chat_sessions (
  id uuid primary key,
  ip_hash text not null,
  page_path text check (page_path is null or length(page_path) <= 300),
  user_agent text check (user_agent is null or length(user_agent) <= 300),
  message_count integer not null default 0 check (message_count >= 0),
  lead_id uuid references public.leads (id) on delete set null,
  status text not null default 'aktif' check (status in ('aktif', 'diserahkan', 'selesai')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chat_sessions_last_message_at on public.chat_sessions (last_message_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(content) between 1 and 4000),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  created_at timestamptz not null default now()
);
create index chat_messages_session on public.chat_messages (session_id, created_at);

-- Pemakaian per hari (tanggal WIB) untuk batas biaya harian.
create table public.chat_usage_daily (
  usage_date date primary key,
  requests integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.chat_sessions for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.chat_usage_daily for each row execute function private.set_updated_at();

-- Tambah pemakaian secara atomik (beberapa percakapan bisa selesai bersamaan).
create or replace function public.chat_record_usage(p_input_tokens integer, p_output_tokens integer)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.chat_usage_daily (usage_date, requests, input_tokens, output_tokens)
  values (private.today_wib(), 1, greatest(p_input_tokens, 0), greatest(p_output_tokens, 0))
  on conflict (usage_date) do update
    set requests = public.chat_usage_daily.requests + 1,
        input_tokens = public.chat_usage_daily.input_tokens + excluded.input_tokens,
        output_tokens = public.chat_usage_daily.output_tokens + excluded.output_tokens;
$$;
revoke execute on function public.chat_record_usage(integer, integer) from public, anon, authenticated;
grant execute on function public.chat_record_usage(integer, integer) to service_role;

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_usage_daily enable row level security;

revoke all on public.chat_sessions, public.chat_messages, public.chat_usage_daily from anon, authenticated;
grant select on public.chat_sessions, public.chat_messages to authenticated;
grant select on public.chat_usage_daily to authenticated;
grant all on public.chat_sessions, public.chat_messages, public.chat_usage_daily to service_role;

create policy "chat: dibaca owner dan tim marketing"
  on public.chat_sessions for select to authenticated
  using (private.has_role('owner', 'admin', 'marketing_manager', 'marketing'));
create policy "pesan chat: dibaca owner dan tim marketing"
  on public.chat_messages for select to authenticated
  using (private.has_role('owner', 'admin', 'marketing_manager', 'marketing'));
create policy "pemakaian chat: dibaca owner"
  on public.chat_usage_daily for select to authenticated
  using (private.has_role('owner', 'admin'));
