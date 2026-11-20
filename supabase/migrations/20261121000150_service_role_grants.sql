-- Hak service_role di schema public.
-- Project Supabase baru tidak lagi memberi hak otomatis ke tabel yang dibuat lewat migrasi (Data API
-- tidak mengekspos tabel baru secara default). Supabase lokal dan CI masih memberinya, sehingga
-- perbedaan ini baru terlihat di production: kode server yang memakai secret key (bootstrap admin,
-- pembuatan akun, lead dari form) ditolak dengan "permission denied".
-- service_role melewati RLS dan hanya dipakai di server (CLAUDE.md bagian 8). anon dan authenticated
-- tetap memakai grant eksplisit di setiap migrasi.

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant execute on functions to service_role;
