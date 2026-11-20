-- Jenjang lowongan untuk halaman karir (keputusan owner, 20 November 2026). Kolom boleh kosong
-- (pola expand): lowongan lama tanpa jenjang tetap tampil di daftar semua lowongan.
-- Nilai enum sama dengan src/config/careers.ts.

create type public.career_level as enum ('berpengalaman', 'lulusan_baru', 'lapangan', 'magang');

alter table public.careers add column level public.career_level;

create index careers_level_idx on public.careers (level) where deleted_at is null;
