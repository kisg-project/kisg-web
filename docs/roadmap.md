# Roadmap Fase 1 sampai 9

Disusun di Fase 0. Setiap fase selesai kalau semua skenario E2E fase itu di `docs/e2e-coverage.md` lolos di CI, PR sudah di-merge ke `main`, dan owner sudah mengecek di production. Tanpa staging sejak Fase 2 (keputusan owner).

Kondisi yang memengaruhi semua fase:
- E2E, Supabase lokal, dan `next build` hanya jalan di CI (laptop RAM 4 GB). Di laptop cukup `pnpm verify:quick`.
- Semua layanan paket gratis (CLAUDE.md bagian 10). Cron lewat `pg_cron`, tanpa branch protection, kuota menit Actions terbatas.
- Perkiraan jumlah file mencakup kode, test, migrasi, dan dokumen.

## Ringkasan

| Fase | Isi | Perkiraan file | Risiko utama | Data owner yang menahan |
|---|---|---|---|---|
| 1 | Fondasi: Next.js, tooling, token desain, komponen dasar, infrastruktur E2E, CI/CD | 110 sampai 140 | Kompatibilitas versi terbaru, kuota Actions | Akun Sentry, project Vercel |
| 2 | Database, auth, RBAC, storage | 60 sampai 80 | Generate types tanpa Supabase lokal di laptop, konfigurasi hook auth | Daftar karyawan dan role, Brevo, Cloudflare |
| 3 | Website corporate | 80 sampai 100 | Lighthouse 95 di mobile, data proyek belum ada | Data proyek, foto, harga, konten |
| 4 | Panel admin CMS | 90 sampai 120 | Editor siteplan, editor rich text, dependency baru | Siteplan SVG, daftar kavling |
| 5 | Landing page builder + tracking Meta | 50 sampai 70 | Consent dan dedup event, A/B tetap statis | Akun Meta Business, Pixel |
| 6 | CRM + sinkronisasi Meta | 90 sampai 110 | Booking bersamaan, review App Meta untuk Lead Ads | Struktur tim, aturan lead, Meta App |
| 7 | Widget customer service (Gemini) | 60 sampai 80 | Biaya dan kuota Gemini, prompt injection | API key Gemini, FAQ, jam kerja |
| 8 | PWA laporan kinerja | 110 sampai 140 | Batasan iOS, kuota Storage 1 GB | WBS, KPI, penugasan lapangan |
| 9 | Hardening dan rilis | 20 sampai 40 | Ketentuan Vercel Hobby, tanpa backup otomatis | Akses DNS domain |

## Fase 1: Fondasi

Tujuan: proyek Next.js yang siap dipakai semua fase, dengan pipeline CI yang benar-benar memblokir kesalahan.

Isi:
- Next.js App Router, TypeScript strict, Tailwind v4 dengan token dari `docs/brand.md`, shadcn/ui dan komponen dasar.
- Tooling: ESLint, Prettier, Husky (`pre-commit`, `commit-msg`, `pre-push` dengan cek akun dan tolak push ke `main`).
- Skrip: `check:copy`, `verify:quick`, `verify:full`, dan `scripts/merge-pr.sh`.
- Env schema, security headers, helper format (rupiah, tanggal WIB, nomor HP).
- Modul kompresi gambar `src/lib/image/` beserta unit test-nya. Modul ini dibuat sekarang karena dipakai di Fase 3, 4, dan 8.
- Playwright (3 profil browser), axe, mock jaringan.
- Workflow `ci`, `security`, `preview`, `deploy-db`, `deploy-production`, `release`, `e2e-weekly`, `backup`. Job yang butuh Supabase di-skip sampai Fase 2.
- Project Vercel, halaman `/dev/ui`.

Risiko teknis:
- Next.js, Tailwind, dan shadcn versi terbaru bisa punya perubahan API. Mitigasi: baca dokumentasi versi terpasang lewat context7 sebelum menulis pola kode.
- pnpm 12 di laptop. Versi pnpm dikunci lewat `packageManager` di `package.json` supaya CI memakai versi yang sama.
- Hook Husky harus jalan di Git Bash Windows dan Linux CI. Semua skrip memakai LF (`.gitattributes` sudah ada).
- Tanpa branch protection, pengaman merge bergantung pada `scripts/merge-pr.sh` dan aturan izin. Diuji dengan PR yang sengaja gagal.
- Membuat project Vercel dan menghubungkan repo adalah aksi eksternal, jadi perlu persetujuan owner.

## Fase 2: Database, auth, RBAC

Tujuan: semua tabel inti, RLS, auth portal, dan storage sesuai `docs/data-model.md`.

Risiko teknis:
- `database.types.ts` biasanya di-generate dari Supabase lokal. Karena laptop tidak menjalankan Docker, job `db.yml` yang men-generate types di CI lalu mengunggahnya sebagai artifact. Kalau berbeda, CI gagal dan menampilkan diff. File diperbarui dengan mengambil artifact itu (`gh run download`).
- Custom Access Token Hook harus aktif di lokal CI (`config.toml`) dan di production. Pengaktifan remote lewat Supabase Management API dari workflow, bukan klik di dashboard.
- Policy RLS yang memanggil fungsi per baris bisa lambat. Fungsi helper dibuat `stable` dan dibungkus `(select ...)` supaya dievaluasi sekali per query.
- Email undangan dan lupa password dikirim dari `notifikasi@kisgroup.co.id` lewat SMTP Brevo, butuh domain terautentikasi di Brevo (DNS di Cloudflare).

## Fase 3: Website corporate

Risiko teknis:
- Lighthouse 95 mobile dengan hero carousel dan banyak foto. Mitigasi:
  - slide pertama sebagai LCP dengan `priority`
  - slide berikutnya lazy
  - tanpa library carousel berat
- Data asli proyek sebagian besar belum ada. Halaman tetap dibangun dengan placeholder berlabel, dan visual regression diambil ulang setelah data masuk.
- Turnstile dan CSP: domain Cloudflare harus masuk CSP tanpa melonggarkan aturan lain.

## Fase 4: Panel admin CMS

Risiko teknis:
- Editor siteplan: memetakan elemen SVG ke kavling. Kalau owner hanya punya PDF atau gambar, siteplan perlu digambar ulang jadi SVG. Ini pekerjaan desain di luar kode.
- Dependency baru yang akan diminta persetujuannya di fase ini:
  - editor rich text (kandidat Tiptap)
  - drag-and-drop urutan (kandidat dnd-kit)
  - crop gambar
- Revalidasi tag harus tepat. Konten yang salah tag tidak muncul di website sampai deploy berikutnya. E2E memeriksa setiap jenis konten langsung tampil setelah publish.

## Fase 5: Landing page builder + tracking Meta

Risiko teknis:
- Dedup Pixel dan CAPI gagal kalau `event_id` tidak sama persis. E2E mencegat request Pixel dan payload CAPI lalu membandingkannya.
- Ad blocker memblokir Pixel. CAPI tetap mengirim event server untuk pengunjung yang sudah memberi consent.
- A/B variant lewat rewrite di `proxy.ts` harus tetap menyajikan halaman statis supaya Lighthouse tidak turun.

## Fase 6: CRM + sinkronisasi Meta

Risiko teknis:
- Booking bersamaan: diuji dengan dua browser context paralel. Penguncian baris di fungsi `book_unit()`.
- Lead Ads webhook butuh Meta App dengan izin `leads_retrieval`. Ini biasanya perlu verifikasi bisnis dan App Review, yang bisa makan waktu berminggu-minggu. Pengajuan sebaiknya dimulai sejak Fase 3.
- Realtime Supabase Free dibatasi jumlah koneksi bersamaan. Cukup untuk tim kecil, dipantau di Fase 9.
- Worker outbox di Vercel Hobby punya batas durasi fungsi. Batch dibatasi dan dilanjutkan di panggilan cron berikutnya.

## Fase 7: Widget customer service

Risiko teknis:
- Kuota dan biaya Gemini. Ada batas biaya harian di `cs_settings`, dan widget beralih ke WhatsApp saat batas tercapai.
- Model mengarang harga atau promo. Mitigasi:
  - jawaban hanya dari konteks yang diambil dari database
  - tool `get_project_info` yang mengembalikan "tidak ada data" secara eksplisit
  - evaluasi `pnpm eval:cs`
- Penyalahgunaan sesi anonim. Mitigasi: Turnstile sebelum pesan pertama, rate limit per IP dan per sesi.
- Dimensi vektor `cs_knowledge` mengikuti model embedding. Ganti model berarti embedding ulang semua isi knowledge base.

## Fase 8: PWA laporan kinerja

Risiko teknis:
- iOS:
  - tidak ada Background Sync, jadi sinkron hanya saat aplikasi dibuka
  - Web Push hanya untuk PWA yang sudah di-install (iOS 16.4 ke atas)
  - penyimpanan bisa dihapus sistem kalau aplikasi lama tidak dibuka
  - kamera kadang menghasilkan HEIC
- **Kuota Storage 1 GB (Supabase Free).** Perkiraan: 20 laporan per hari x 5 foto x 300 KB = 30 MB per hari, atau sekitar 900 MB per bulan. Kuota habis dalam 1 sampai 2 bulan. Pilihan:
  - target foto laporan diturunkan ke sekitar 150 KB dan jumlah foto per laporan dibatasi
  - foto lama dipindah atau dihapus setelah masa simpan tertentu (misal foto laporan yang sudah disetujui dan tidak dipilih untuk website dihapus setelah 3 bulan)
  - upgrade Supabase saat mendekati batas
- Akurasi GPS di lapangan bisa buruk (50 sampai 100 m). Geofence memperhitungkan `accuracy_m`, dan absensi di luar radius bisa diajukan dengan alasan.
- Serwist mungkin belum mendukung bundler Next versi terpasang. Kalau begitu, service worker ditulis manual.

## Fase 9: Hardening dan rilis

Risiko teknis:
- **Vercel Hobby melarang pemakaian komersial.** Website perusahaan properti termasuk komersial. Kalau Vercel menegur, project bisa dinonaktifkan. Owner perlu memutuskan sebelum domain production diarahkan.
- Supabase Free tanpa backup otomatis dan tanpa PITR. Backup harian lewat `backup.yml` harus diuji restore minimal sekali ke Supabase lokal.
- Project Supabase Free dijeda kalau 7 hari tidak aktif. Production dijaga oleh koneksi harian `backup.yml`.
- Domain production butuh akses DNS.

## Anggaran menit GitHub Actions

Kuota GitHub Free untuk repo private: 2.000 menit per bulan (runner Linux). Perkiraan setelah Fase 2, saat E2E sudah penuh:

| Workflow | Menit per run | Run per bulan | Total |
|---|---|---|---|
| `ci.yml` per PR: cek statis dan build (sekitar 8), E2E 3 shard (3 x 8) | 32 | 30 push PR | 960 |
| `ci.yml` saat merge ke `main`: build saja, karena PR sudah menjalankan E2E | 10 | 15 | 150 |
| `db.yml` (PR yang menyentuh `supabase/`) | 10 | 10 | 100 |
| `e2e-weekly.yml` (3x suite penuh) | 75 | 4 | 300 |
| `security.yml`, `preview.yml`, `backup.yml`, `deploy-*`, `release` | | | 200 |
| **Total** | | | **sekitar 1.710** |

Sisa ruang sekitar 15%. Pengaman:
- `concurrency` membatalkan run lama di branch yang sama
- filter `paths` melewati workflow untuk perubahan docs saja
- push kecil-kecil digabung sebelum membuka PR
- pemakaian menit dicek tiap akhir fase di halaman Billing GitHub (endpoint API billing yang berlaku dicek saat Fase 1)

Sejak Fase 2 (keputusan owner, opsi B): E2E per PR cukup Chromium. Tiga browser hanya di PR akhir fase (label `e2e:full`) dan `e2e-weekly.yml`. Risiko yang diterima: bug khusus Safari baru ketahuan di akhir fase atau di run mingguan.

## Keputusan owner (akhir Fase 0)

| Topik | Keputusan |
|---|---|
| Database untuk melihat UI di laptop | Tidak ada (tanpa staging sejak Fase 2). Portal dicek lewat E2E di CI dan di production |
| Vercel Hobby untuk website komersial | Tetap Hobby. Risiko ketentuan non-komersial diterima owner |
| Harga Sejahtera Green Village | Ditampilkan di website. Angka dikirim owner (lihat `docs/TODO-DATA.md`) |
| Pembagian lead | Round-robin ke semua marketing aktif untuk semua proyek |
| Role finance | Dipakai sejak awal: baca booking, deal, dan laporan penjualan |
| Absensi | Tim lapangan dan tim marketing. Geofence di kantor dan lokasi proyek (`work_locations`) |
| Verifikasi Meta Business | Belum diketahui. KIS sudah beriklan di Meta Ads. Dicek owner sebelum Fase 5 (langkah di `docs/TODO-DATA.md`) |

Masih terbuka (dibutuhkan paling lambat Fase 8): batas foto laporan lapangan. Usulan: 150 KB per foto, maksimal 6 foto per laporan, foto yang tidak dipakai di website dihapus 3 bulan setelah laporan disetujui.
