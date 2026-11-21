-- Role khusus panel CMS (keputusan owner, 21 November 2026). Akun CMS hanya untuk cms.kisgroup.co.id,
-- tidak bisa masuk portal karyawan. Nilai enum baru dipakai di migrasi berikutnya, karena nilai enum
-- yang ditambahkan belum bisa dipakai di transaksi yang sama.
alter type public.app_role add value if not exists 'cms';
