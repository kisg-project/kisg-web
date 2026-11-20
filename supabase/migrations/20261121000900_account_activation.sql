-- Aktivasi akun dari undangan (keputusan owner, 20 November 2026): karyawan membuat password, unggah
-- foto profil, dan mengisi nomor HP sebelum memakai portal. Foto profil wajib untuk semua akun.
-- Kolom diisi server (service role) saat undangan dan aktivasi, tidak bisa diubah pemilik akun.

alter table public.profiles
  add column invited_at timestamptz,
  add column invited_by uuid references auth.users (id),
  add column activated_at timestamptz,
  add column needs_password boolean not null default false;

-- Akun yang sudah ada dianggap sudah aktif dan sudah punya password. Mereka tetap diminta
-- melengkapi foto profil dan nomor HP karena kolom itu masih kosong.
update public.profiles set activated_at = created_at where activated_at is null;

comment on column public.profiles.activated_at is 'Waktu karyawan menyelesaikan halaman aktivasi (password, foto, nomor HP).';
comment on column public.profiles.needs_password is 'true untuk akun undangan yang belum membuat password.';
