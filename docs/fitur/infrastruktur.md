# Infrastruktur dan rilis

## Keputusan owner
- Fase 0: semua paket gratis (GitHub, Vercel Hobby, Supabase Free). Vercel Hobby untuk website komersial tetap dipakai, risikonya diterima owner.
- Fase 2: tanpa staging. Setiap merge ke `main` langsung tayang. Backup terjadwal tidak dipakai.
- 21 November 2026: domain terhubung, DNS di Cloudflare tanpa proxy.
- 22 November 2026: repo publik sementara supaya GitHub Actions gratis tanpa batas, dikembalikan ke privat setelah aplikasi selesai. Selama publik, tidak boleh ada secret atau data pribadi di repo.
- 22 November 2026: mode darurat saat kuota Actions habis (lihat `CLAUDE.md` bagian 10).
- 23 November 2026: fungsi server di wilayah Singapura (`sin1`).
- Detail alur CI dan deploy di [`../ci-cd.md`](../ci-cd.md).

## Cakupan
- [x] Workflow `ci`, `db`, `security`, `deploy-production`, `release`, `e2e-weekly`, `keepalive`, `vercel-cleanup`, `preview`
- [x] Deploy production otomatis setelah migrasi, wilayah `sin1`
- [x] `scripts/merge-pr.sh`, hook Husky, cek akun
- [x] Retry `supabase start` di CI
- [x] Pembersihan kode, skrip, dan dependency yang tidak dipakai (23 November 2026)
- [ ] Cari penyebab `e2e-weekly` yang gagal pada 22 November 2026 dan perbaiki
- [ ] `preview.yml` dengan Lighthouse dan smoke test (preview otomatis Vercel sedang dimatikan untuk hemat kuota)
- [ ] Sentry di production
- [ ] Hapus deployment staging lama di Vercel
- [ ] Pemantauan kuota database 500 MB dan storage 1 GB, masa simpan data yang bisa diatur
- [ ] Audit route dan server action: setiap route tercakup minimal satu skenario E2E
- [ ] Cek bundle client tidak berisi secret
- [ ] Seluruh suite lolos 3 kali berturut-turut tanpa retry
- [ ] Tutorial owner: Brevo, DNS Cloudflare, Turnstile, domain Vercel, email routing
- [ ] Kembalikan repo ke privat setelah semua fitur selesai

## Anggaran menit GitHub Actions
Saat repo privat, kuota 2.000 menit per bulan. Perkiraan dan pengamannya:

| Workflow | Menit per run | Run per bulan | Total |
|---|---|---|---|
| `ci.yml` per PR | 32 | 30 | 960 |
| `ci.yml` saat merge ke `main` | 10 | 15 | 150 |
| `db.yml` | 10 | 10 | 100 |
| `e2e-weekly.yml` | 75 | 4 | 300 |
| Lainnya | | | 200 |
| **Total** | | | **sekitar 1.710** |

Pengaman: `concurrency`, filter `paths`, push digabung, E2E per PR cukup Chromium, tiga browser hanya di PR berlabel `e2e:full` dan run mingguan.

## Risiko teknis
- Vercel Hobby melarang pemakaian komersial. Kalau ditegur, project bisa dinonaktifkan.
- Supabase Free tanpa backup otomatis. Data yang terhapus tidak bisa dikembalikan.
- Project Supabase Free dijeda kalau 7 hari tidak aktif, dijaga `keepalive.yml`.
