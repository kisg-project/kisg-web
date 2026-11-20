-- Rate limit dengan jendela yang dimulai saat percobaan pertama (migrasi 20261121000100).
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select ok(public.rate_limit_hit('uji:a', 60, 2), 'percobaan pertama lolos');
select ok(public.rate_limit_hit('uji:a', 60, 2), 'percobaan kedua lolos');
select ok(not public.rate_limit_hit('uji:a', 60, 2), 'percobaan ketiga melewati batas');
select ok(public.rate_limit_hit('uji:b', 60, 2), 'kunci lain dihitung terpisah');

-- Jendela kedaluwarsa: penghitung mulai dari awal dan baris lama dihapus.
update public.rate_limits set window_start = now() - interval '61 seconds' where key = 'uji:a';
select ok(public.rate_limit_hit('uji:a', 60, 2), 'jendela baru setelah jendela lama habis');
select is(
  (select count(*)::int from public.rate_limits where key = 'uji:a'),
  1,
  'hanya satu jendela per kunci'
);

select * from finish();
rollback;
