-- Rate limit: jendela dimulai saat percobaan pertama, bukan di batas jam tetap.
-- Jendela tetap (versi 20261120000300) mengizinkan 2x batas di sekitar pergantian jendela, dan
-- membuat hasil bergantung pada jam (penguncian bisa terpotong di tengah). Signature sama, jadi
-- pemanggil (src/lib/security/rate-limit.ts) tidak berubah. Perubahan ini aman untuk rollback:
-- tabel tidak berubah, hanya isi fungsi.

create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  -- Serialkan per kunci supaya dua percobaan bersamaan tidak membuat dua jendela.
  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));

  select rl.window_start, rl.count
    into v_window_start, v_count
  from public.rate_limits rl
  where rl.key = p_key
    and rl.window_start > now() - make_interval(secs => p_window_seconds)
  order by rl.window_start desc
  limit 1;

  if v_window_start is null then
    -- Jendela lama untuk kunci ini sudah tidak dipakai.
    delete from public.rate_limits rl where rl.key = p_key;
    insert into public.rate_limits (key, window_start, count) values (p_key, now(), 1);
    return 1 <= p_max;
  end if;

  update public.rate_limits rl
  set count = rl.count + 1
  where rl.key = p_key and rl.window_start = v_window_start
  returning rl.count into v_count;
  return v_count <= p_max;
end;
$$;

revoke execute on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
