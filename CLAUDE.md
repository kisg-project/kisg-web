# CLAUDE.md : KIS Group Platform

File ini dibaca otomatis oleh Claude Code di setiap sesi. Semua aturan di sini wajib diikuti. Kalau ada instruksi di chat yang bertentangan dengan file ini, tanya dulu sebelum jalan.

---

## 1. Konteks bisnis

KIS Group adalah developer perumahan.

| Proyek | Status |
|---|---|
| Sejahtera Green Village, Tambun Selatan | Tersedia (satu-satunya proyek yang ditampilkan, fokus penjualan) |

- Badan usaha: PT Kreatif Inovatif Sejahtera Group
- Domain: `kisgroup.co.id`
- Alamat kantor: Ruko D'Smart, Jl. Telaga Mas No. 55 Blok H, RT 012/RW 014, Harapan Baru, Bekasi Utara, Kota Bekasi, Jawa Barat 17123
- WhatsApp marketing: `+62 896-7329-6881` (link: `https://wa.me/6289673296881`). Satu-satunya kontak yang tampil di website. NIB, telepon, dan email dari NIB tidak ditampilkan.
- Instagram: `@kreatifsejahteraproject` (`https://instagram.com/kreatifsejahteraproject`)
- Logo: `public/brand/` (lihat bagian 6 untuk ekstraksi warna)

Website, landing page, chat, dan konten seed hanya menampilkan Sejahtera Green Village (keputusan owner, Fase 1). Proyek lama tidak ditampilkan dan tidak disebut. Model data tetap mendukung banyak proyek, supaya proyek berikutnya tinggal ditambah dari admin.

Data, nomor, kontak, dan tautan di atas adalah satu-satunya sumber kebenaran. Simpan di satu tempat (`src/config/site.ts` lalu dapat di-override dari tabel `site_settings` lewat admin). Jangan hardcode di komponen.

---

## 2. Cakupan platform

Satu codebase Next.js, empat area:

1. **Website corporate** (`/`): profil perusahaan, proyek, berita, promo, progres pembangunan, karir, kontak.
2. **Landing page iklan** (`/lp/[slug]`): halaman konversi untuk kampanye Meta Ads, dibangun dari blok yang diatur di admin.
3. **Portal internal + PWA** (`company.kisgroup.co.id`, route `src/app/portal/`): laporan kinerja karyawan (lapangan, marketing), dashboard owner, CRM, dan panel admin CMS. Bisa di-install di HP. `kisgroup.co.id/portal` tidak dipakai (404), keputusan owner.
4. **Integrasi Meta** (server side): Pixel + Conversions API, webhook Lead Ads, dan pengiriman status lead dari CRM ke Meta (Conversion Leads) supaya algoritma iklan belajar dari lead yang benar-benar closing.
5. **Widget customer service** di website dan landing page: asisten chat berbasis Gemini yang menjawab dari data resmi KIS, mengumpulkan lead ke CRM, dan menyerahkan percakapan ke marketing (portal atau WhatsApp). Detail di bagian 12.

---

## 3. Tech stack

Gunakan versi stable terbaru saat proyek dibuat. Sebelum memakai API apa pun dari Next.js, Supabase, atau library lain, cek versi yang terpasang di `package.json` dan ikuti dokumentasi versi itu. Jangan menebak API dari ingatan. Contoh: di Next.js 16, `middleware.ts` sudah berganti menjadi `proxy.ts`, dan `params`/`searchParams` bersifat async.

- **Framework**: Next.js (App Router), React, TypeScript `strict` + `noUncheckedIndexedAccess`
- **Styling**: Tailwind CSS v4 (token via `@theme`), shadcn/ui sebagai basis komponen, `class-variance-authority`, `tailwind-merge`
- **Ikon**: `lucide-react`. Ikon `Sparkles`, `Sparkle`, `WandSparkles`, `Wand2`, `Stars`, `Bot` dan sejenisnya **dilarang**.
- **Font**: `Plus Jakarta Sans` via `next/font` (heading dan body). Angka di tabel/dashboard pakai `tabular-nums`.
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime, Edge Functions, `pg_cron`)
- **Akses data**: `@supabase/ssr`, type hasil `supabase gen types`
- **Validasi**: Zod di setiap batas sistem (form, server action, route handler, webhook, env)
- **Form**: React Hook Form + `@hookform/resolvers/zod`
- **Server action**: `next-safe-action` dengan middleware auth + role
- **Data client di portal**: TanStack Query (cache, optimistic update, offline), TanStack Table untuk tabel besar
- **Chart**: Recharts
- **PWA**: Serwist. Cek dulu kompatibilitasnya dengan bundler versi Next yang terpasang. Kalau belum kompatibel, tulis service worker manual, jangan dipaksa.
- **Offline storage**: Dexie (IndexedDB)
- **Email transaksional**: Brevo (relay SMTP untuk email Supabase Auth, API HTTP lewat `fetch` untuk email aplikasi). Pola sama dengan proyek KELOLA: login SMTP terpisah dari alamat pengirim (`SMTP_FROM`). Template email ditulis sebagai komponen React (React Email, persetujuan dependency diminta saat dipakai)
- **AI customer service**: Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/google`) dengan Gemini, `pgvector` di Supabase untuk pencarian knowledge base. Nama model diambil dari env `GEMINI_MODEL` dan `GEMINI_EMBEDDING_MODEL`, jangan hardcode. Cek dokumentasi Google untuk model yang masih aktif.
- **Env**: `@t3-oss/env-nextjs` (validasi env saat build)
- **Testing**: Vitest + Testing Library (unit), Playwright (e2e), pgTAP atau test SQL untuk RLS
- **Kualitas**: ESLint (config Next + `typescript-eslint` strict), Prettier, `lint-staged` + Husky
- **Monitoring**: Vercel Analytics, Speed Insights, Sentry
- **Deploy**: Vercel (Preview per PR, Production otomatis dari `main`), satu project Supabase (production). Tanpa staging (keputusan owner, Fase 2)

Jangan menambah dependency di luar daftar ini tanpa menjelaskan alasannya dan meminta persetujuan.

Dependency tambahan yang sudah disetujui owner:
- Fase 1: `clsx`, `radix-ui`, `sonner`, `server-only`, `prettier-plugin-tailwindcss`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/jest-dom`, `@testing-library/user-event`, `tw-animate-css` dan `shadcn` (CSS, dipakai saat build).
- Simulasi KPR: `jspdf` dan `jspdf-autotable` untuk PDF berkop KIS, dimuat hanya saat tombol unduh diklik. Dipakai lagi untuk ekspor PDF portal di Fase 8.

---

## 4. Arsitektur folder

Feature-based. Setiap fitur punya batas yang jelas.

```
src/
  app/
    (site)/            # website publik, layout corporate
    (landing)/lp/      # landing page iklan, layout minimal tanpa navigasi utama
    portal/            # PWA internal, layout aplikasi
      (auth)/          # login, lupa password
      lapangan/
      marketing/
      crm/
      owner/
      admin/
    api/
      webhooks/meta/   # leadgen webhook
      cron/            # worker terjadwal (dilindungi CRON_SECRET)
  features/
    projects/  units/  leads/  crm/  reports/  attendance/
    kpi/  cms/  landing-builder/  meta/  auth/  notifications/  chat/
      components/  actions/  queries/  schemas/  types.ts  utils.ts
  components/
    ui/                # shadcn, tidak berisi logika bisnis
    shared/            # komponen lintas fitur
  lib/
    supabase/          # client browser, server, admin (server-only)
    meta/              # capi.ts, graph.ts, hash.ts
    utils/  format/    # format rupiah, tanggal WIB, nomor HP
  config/              # site.ts, nav.ts, roles.ts, pipeline.ts
  styles/
supabase/
  migrations/  seed.sql  tests/  functions/
docs/
  brand.md  architecture.md  data-model.md  meta-integration.md  TODO-DATA.md
```

Aturan:
- Server Component sebagai default. `"use client"` hanya di komponen yang memang butuh interaksi.
- File yang memakai secret atau service role wajib `import "server-only"`.
- Fitur tidak boleh import langsung dari folder internal fitur lain. Ekspor lewat `index.ts`.
- Satu sumber kebenaran untuk konstanta (role, tahap pipeline, status unit) di `src/config/`, dengan enum Postgres yang sama.

---

## 5. Prinsip zero error

"Selesai" artinya lolos pemeriksaan lokal **dan** lolos seluruh pipeline CI (bagian 10). Tanpa warning yang diabaikan. Fitur tanpa test E2E dianggap belum selesai.

Laptop pengembang (RAM 4 GB) tidak menjalankan Docker, Supabase lokal, `next build`, maupun Playwright. Semua itu hanya jalan di CI (GitHub Actions).

### Pemeriksaan lokal

Untuk semua ukuran tugas:

```
pnpm verify:quick
```

Isinya: `typecheck`, `lint`, `check:copy`, dan unit test yang terkait file berubah (`vitest related`).

### Pemeriksaan penuh di CI

`pnpm verify:full` tetap ada sebagai skrip, tapi hanya dijalankan di CI. Isinya: `typecheck`, `lint`, `check:copy`, seluruh unit test, `next build`, lalu seluruh E2E di production build dengan Supabase lokal di runner.

Untuk tugas besar, push branch dan buka PR (boleh draft) sebelum tugas dianggap selesai, lalu tunggu CI hijau. Kalau CI merah, baca log-nya (`gh run view --log-failed`), perbaiki, push ulang.

Yang termasuk tugas besar:
- akhir setiap fase
- perubahan `next.config`, `proxy.ts`, root layout, env schema, atau konfigurasi build
- menambah, menghapus, atau upgrade dependency
- perubahan service worker, manifest, atau perilaku offline PWA (hanya berjalan benar di production build)
- perubahan caching, rendering strategy, atau revalidation
- refactor lintas fitur, atau perubahan yang menyentuh lebih dari sekitar 10 file
- sebelum membuka PR ke `main`

Kalau ragu, anggap tugas besar. Seluruh pemeriksaan tetap dijalankan penuh di CI untuk setiap PR, apa pun ukuran tugasnya.

### Test end to end (wajib)

- **Setiap fitur yang terlihat user wajib punya test Playwright** sebelum dianggap selesai. Itu termasuk halaman, form, alur, dan role baru.
- Suite E2E hanya jalan di CI, di atas **production build** (`next build && next start`) dengan **Supabase lokal** di runner (`supabase start`) yang di-reset dan di-seed sebelum suite jalan. Tidak dijalankan di laptop pengembang. Tidak boleh menyentuh database production.
- Spec E2E tetap ditulis bersama fitur. Spec yang ditulis tanpa dijalankan di lokal harus lolos `typecheck` dan `lint`, dan baru dianggap lolos setelah CI hijau.
- Browser: Chromium desktop, Mobile Chrome (Pixel), Mobile Safari (iPhone). Portal wajib lolos di profil mobile.
- Kapan tiga browser jalan (keputusan owner, Fase 2, opsi B): setiap PR cukup Chromium (tetap termasuk cek responsif 320 sampai 1440 px dan axe). Tiga browser x 3 shard wajib untuk PR akhir fase (label `e2e:full`, dipasang sebelum push terakhir). `e2e-weekly.yml` menjalankan tiga browser tiap minggu. `scripts/merge-pr.sh` menolak merge kalau set E2E yang wajib belum hijau.
- Login per role pakai `storageState` yang disiapkan di global setup (owner, admin, marketing_manager, marketing, site_manager, site_supervisor, finance).
- Selector pakai `getByRole`, `getByLabel`, `getByText`. `data-testid` hanya kalau tidak ada alternatif. Dilarang selector CSS rapuh dan `waitForTimeout`.
- Setiap test mandiri: menyiapkan datanya sendiri (lewat helper/factory ke Supabase lokal) dan tidak bergantung urutan. Bisa jalan paralel.
- Assertion sampai ke hasil akhir, bukan cuma UI. Contoh: submit form lead dicek sampai baris `leads` dan `meta_event_outbox` benar-benar ada di database.
- Layanan eksternal (Meta Graph API, CAPI, Brevo, Turnstile, Web Push) di-mock di level jaringan (`page.route` atau mock server). Payload yang dikirim tetap di-assert.
- Wajib diuji juga: jalur gagal (validasi, network error, akses ditolak per role), state kosong, mode offline PWA (`context.setOffline`), dan aksesibilitas dengan `@axe-core/playwright` di setiap halaman.
- Visual regression (`toHaveScreenshot`) untuk halaman publik utama dan landing page.
- Test flaky tidak boleh di-skip atau diberi retry untuk menutupi masalah. Cari penyebabnya dan perbaiki.
- CI menjalankan seluruh suite E2E di setiap PR (lihat bagian 10). Merge diblokir kalau gagal. Trace, video, dan screenshot disimpan sebagai artifact saat gagal.
- Struktur: `e2e/` berisi `fixtures/`, `factories/`, `pages/` (page object), dan spec per area: `site/`, `landing/`, `crm/`, `lapangan/`, `marketing/`, `owner/`, `admin/`, `meta/`, `pwa/`.
- Di akhir setiap fase, tulis daftar skenario E2E yang dicakup di `docs/e2e-coverage.md`.

Wajib:
- Tidak ada `any`, `@ts-ignore`, `eslint-disable` tanpa komentar alasan yang spesifik.
- Setiap halaman punya `loading.tsx`, `error.tsx`, dan empty state yang jelas. `not-found.tsx` untuk slug yang tidak ada.
- Setiap form: validasi client dan server dengan schema Zod yang sama, tombol disabled saat submit, cegah double submit, pesan error per field.
- Setiap mutasi: idempotent kalau bisa diulang (pakai idempotency key / UUID dari client), dan cache di-revalidate dengan tepat.
- Semua waktu disimpan `timestamptz` (UTC), ditampilkan dalam `Asia/Jakarta`.
- Nomor HP dinormalisasi ke format E.164 (`+62...`) sebelum disimpan. Rupiah disimpan sebagai `bigint`.
- Tidak ada data palsu yang tampil di production. Harga, luas, spesifikasi, alamat, legalitas, statistik, testimoni: kalau belum ada data asli, pakai placeholder yang jelas dan catat di `docs/TODO-DATA.md`. Jangan mengarang.
- Sebelum menyentuh lebih dari 3 file, tulis rencana singkat dulu. Untuk keputusan arsitektur, jelaskan pilihan dan trade-off, lalu tunggu persetujuan.
- Kalau ragu soal API library, baca dokumentasi atau source di `node_modules`, jangan asumsi.

---

## 6. Brand dan desain visual

### Warna mengikuti logo
Palet diambil dari file logo di `public/brand/`, bukan ditebak.

Prosedur (dijalankan sekali di fase fondasi, hasilnya dikunci):
1. Kalau logo SVG: baca nilai `fill`/`stroke` langsung. Kalau PNG/JPG: lihat gambarnya, lalu ekstrak warna dominan dengan `sharp` (quantize, abaikan putih/transparan/anti-alias).
2. Tetapkan peran: `primary` (warna paling dominan di logo), `secondary` (warna kedua), `accent` (kalau ada warna ketiga yang cukup kontras, khusus CTA dan highlight). Pengecualian yang sudah disetujui owner di Fase 0: primary = hijau logo `#0F6D5F`, accent = emas logo `#D7AE5F`, karena emas (paling dominan) hanya 2.08:1 di latar putih. Palet final terkunci di `docs/brand.md`.
3. Buat skala 50 sampai 950 untuk tiap warna di ruang OKLCH, dengan warna logo asli tepat di salah satu step (catat step-nya).
4. Neutral: abu-abu dengan sedikit tint ke hue `primary` supaya menyatu.
5. Warna semantik (success, warning, danger, info) dan warna status unit (tersedia, hold, booking, terjual) diselaraskan dengan palet, tetap mudah dibedakan.
6. Cek kontras WCAG 2.2 AA untuk setiap pasangan teks/latar yang dipakai. Kalau warna logo tidak lolos sebagai warna teks, pakai step yang lebih gelap untuk teks dan simpan warna asli untuk elemen non-teks.
7. Tulis hasilnya di `docs/brand.md` (hex + oklch + peran + contoh pemakaian) dan di token Tailwind `@theme`. Setelah itu tidak ada warna hardcode di komponen.

### Karakter tampilan
Professional corporate. Bersih, tegas, banyak ruang putih, foto proyek sebagai elemen utama.

- Referensi struktur: damaiputra.com (hero carousel lebar, strip statistik, kartu proyek, berita, promo, CTA penutup, footer lengkap, tombol WhatsApp melayang). Ambil polanya, jangan meniru visual atau kontennya.
- Grid 12 kolom, container maks ~1280px, ritme spasi konsisten (kelipatan 4/8).
- Radius kecil sampai sedang (4 sampai 8px). Bayangan tipis. Tanpa glassmorphism, tanpa gradien neon, tanpa blob dekoratif.
- Website banyak gerak halus (keputusan owner, Fase 3): bagian halaman muncul saat di-scroll (`Reveal`, fade dan geser naik sekitar 600ms), banner bergeser otomatis dengan tombol jeda, kartu dan foto bereaksi saat disentuh atau di-hover, angka statistik berhitung naik. Interaksi kecil (hover, tombol) tetap pendek, maks ~250ms. Tanpa library animasi. Konten tidak boleh disembunyikan sebelum JavaScript jalan, LCP dan CLS tidak boleh terganggu, dan semua gerak berhenti kalau `prefers-reduced-motion` aktif.
- Scrollbar minimalis: tipis, warna menyatu dengan palet, latar transparan (keputusan owner, Fase 3).
- Foto asli proyek. Tidak memakai gambar hasil AI. Selama foto belum ada, pakai placeholder netral berlabel.
- Portal internal: padat informasi tapi rapi, mobile first (dipakai di lapangan), target sentuh minimal 44px, mendukung dark mode.

### Responsif di semua perangkat (wajib)
Website, landing page, dan PWA portal harus tampil dan bisa dipakai penuh di semua ukuran layar, dari HP kecil sampai monitor lebar.
- Ditulis mobile first, dengan breakpoint Tailwind bawaan (`sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536).
- Lebar minimum yang didukung 320px. Tidak boleh ada scroll horizontal di lebar mana pun, kecuali di dalam tabel atau galeri yang memang digulir dan diberi penanda.
- Orientasi tegak dan mendatar di HP dan tablet. Memakai safe area (`env(safe-area-inset-*)`) untuk HP berponi dan PWA yang di-install.
- Teks memakai ukuran relatif dan tetap terbaca saat zoom 200%. Gambar memakai `next/image` dengan `sizes` sesuai breakpoint.
- Tabel lebar di portal berubah jadi daftar kartu di layar kecil, atau digulir di dalam wadahnya sendiri.
- Navigasi: menu lengkap di desktop, menu ringkas (sheet) di HP. Portal memakai navigasi bawah di HP dan sidebar di desktop.
- Diuji E2E: setiap halaman dicek di lebar 320, 375, 768, 1024, dan 1440px (tanpa scroll horizontal, elemen utama terlihat), ditambah profil Pixel dan iPhone.

### SEO maksimal (wajib, semua halaman publik dan landing page)
Berlaku untuk website dan landing page. Portal PWA tidak diindeks (`noindex`, diblokir di `robots.txt`).
- Setiap halaman punya `generateMetadata`/`metadata`: judul unik, deskripsi faktual (maks 160 karakter), canonical, Open Graph, dan Twitter card dengan gambar.
- Satu `h1` per halaman, urutan heading benar, landmark (`header`, `nav`, `main`, `footer`), alt text bermakna di setiap gambar.
- Data terstruktur JSON-LD lewat `src/lib/seo/` (diuji unit): `RealEstateAgent` untuk perusahaan, `RealEstateListing` + `SingleFamilyResidence` + `Offer` untuk unit, `BreadcrumbList`, `Article` untuk berita, `FAQPage` untuk FAQ. Hanya data asli, tanpa rating atau ulasan karangan.
- `sitemap.xml` (hanya konten terbit), `robots.txt`, URL bersih berbahasa Indonesia, `lang="id"`, satu domain kanonik.
- Core Web Vitals: LCP di bawah 2,5 detik, CLS di bawah 0,1, INP di bawah 200 ms di profil mobile. Lighthouse SEO 100 dan kategori lain minimal 95 (dicek `preview.yml`).
- Gambar lewat `next/image` dengan ukuran dan `sizes` yang benar. Gambar LCP memakai `preload` atau `fetchPriority="high"` (`priority` sudah deprecated di Next 16).
- Diuji E2E: metadata, canonical, dan JSON-LD tiap tipe halaman valid.

### Ekspor data di portal (PDF dan Excel saja)
Portal tidak menyediakan ekspor CSV. Ekspor hanya PDF dan Excel (`.xlsx`), dan keduanya harus rapi dan siap dicetak atau dibagikan.
- Excel:
  - satu baris judul laporan, periode, dan waktu dibuat (WIB)
  - header kolom tebal dengan latar, baris header dibekukan, filter otomatis aktif
  - lebar kolom disesuaikan isi
  - teks rata kiri, angka dan rupiah rata kanan dengan format angka asli Excel (bukan teks), tanggal memakai format tanggal Excel
  - baris total di akhir kalau relevan
- PDF:
  - wajib header (logo, judul laporan, periode) dan footer (nama perusahaan, waktu dibuat WIB, nomor halaman "Halaman x dari y") di setiap halaman
  - perataan kolom sama dengan Excel, header tabel diulang di setiap halaman, baris tidak terpotong di tengah
  - ukuran A4, orientasi menyesuaikan jumlah kolom
- Isi ekspor mengikuti filter dan hak akses role yang sama dengan tampilan di layar.
- Library pembuat Excel dan PDF diminta persetujuannya saat fitur ekspor dibangun (Fase 8).
- Diuji E2E: file terunduh, lalu isinya dibaca di test (nama sheet, header, format angka, jumlah baris, header dan footer PDF).

---

## 7. Aturan copywriting (berlaku untuk semua teks UI, konten seed, metadata, email, notifikasi)

Tulis seperti marketing properti senior yang ngobrol dengan calon pembeli: jelas, konkret, sopan, tidak lebay.

**Wajib**
- Bahasa Indonesia baku yang luwes. Sapaan "Anda" di website, sapaan netral di portal.
- Kalimat pendek. Satu kalimat satu gagasan.
- Konkret: angka, lokasi, jarak, fakta. Kalau faktanya belum ada, pakai placeholder `[...]`, jangan diisi kata sifat.
- Microcopy singkat: "Simpan", "Kirim laporan", "Hubungi marketing", "Lihat unit".
- Pesan error memberi tahu apa yang salah dan apa yang harus dilakukan, dalam satu kalimat.

**Dilarang**
- Tanda pisah panjang (em dash `—` dan en dash `–`) sebagai pemisah kalimat. Pakai titik, koma, atau titik dua.
- Emoji dan simbol dekoratif (✨ 🚀 🏡 ✅ dan sejenisnya) di UI dan konten.
- Ikon sparkles dan variannya.
- Kalimat bergaya tutorial atau penjelasan panjang di UI. Pengecualian: definisi yang memang perlu (misal penjelasan singkat istilah KPR, SHM, PBG), kebijakan privasi, dan syarat ketentuan.
- Frasa klise berikut dan variasinya:
  "Wujudkan hunian impian", "Lebih dari sekadar rumah", "Di era modern ini", "Hadir sebagai solusi", "Nikmati pengalaman", "Rasakan sensasi", "Dengan bangga mempersembahkan", "Selamat datang di", "Mari bersama", "Tak hanya itu", "Bukan hanya ... tetapi juga", "Dirancang khusus untuk Anda", "Solusi terbaik", "Kenyamanan maksimal", "Hunian idaman yang Anda dambakan", "Inovatif", "Seamless", "Elevate", "Unlock", "Next level", "Game changer".
- Pola tiga kata sifat berjejer di setiap bagian ("nyaman, aman, dan strategis").
- Pertanyaan retoris pembuka ("Mencari rumah impian?") dan tanda seru beruntun.

**Contoh arah**
- Kurang tepat: "Wujudkan hunian impian Anda bersama kami — nyaman, asri, dan strategis! ✨"
- Lebih baik: "Rumah siap huni di Tambun Selatan. [x] menit ke Stasiun Tambun, [x] menit ke Gerbang Tol [nama]."

Sebelum menyelesaikan tugas yang berisi teks, jalankan `pnpm check:copy` (skrip yang kamu buat di fase fondasi: grep `—`, `–`, emoji, ikon terlarang, dan daftar frasa di atas di `src/`, `supabase/seed.sql`, dan `content/`). Hasil harus bersih.

---

## 8. Data, keamanan, dan akses

- Semua tabel di schema `public` wajib RLS aktif dan punya policy eksplisit. Tidak ada tabel tanpa policy.
- Role: `owner`, `admin`, `marketing_manager`, `marketing`, `site_manager`, `site_supervisor`, `finance`. Disimpan di tabel `user_roles`, disuntikkan ke JWT lewat Supabase Custom Access Token Hook, dicek di RLS dan di server action.
- Marketing hanya melihat lead miliknya. Manager melihat timnya. Owner dan admin melihat semua.
- Service role key hanya dipakai di server (webhook, cron, admin task) dan tidak pernah sampai ke client.
- Storage: bucket publik hanya untuk aset website. Foto laporan, dokumen konsumen (KTP, slip gaji, dsb) di bucket privat dengan signed URL berumur pendek.
- `audit_log` lewat trigger untuk tabel penting (leads, deals, units, cms content, user_roles).
- Soft delete (`deleted_at`) untuk data bisnis. Kolom `created_at`, `updated_at` (trigger), `created_by`.
- Patuh UU PDP (UU 27/2022): checkbox persetujuan di setiap form lead, halaman kebijakan privasi, fitur hapus/ekspor data konsumen di admin.
- Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy) di `next.config`. Rate limit untuk form publik dan endpoint webhook. Honeypot + Cloudflare Turnstile di form publik.

### Keamanan tingkat tinggi (keputusan owner, Fase 2)
- Cloudflare dipakai untuk DNS domain, forwarding email, dan Turnstile. Trafik web tetap langsung ke Vercel (record DNS tanpa proxy), karena Vercel sudah menyediakan perlindungan DDoS dan firewall, dan proxy tambahan mengganggu cache serta deteksi IP asli.
- Portal (PWA) tanpa captcha: tidak ada pendaftaran publik, akun hanya lewat undangan. Login dilindungi rate limit per IP dan per akun, penguncian sementara setelah beberapa kali gagal, dan pesan error yang tidak membocorkan akun mana yang ada.
- Verifikasi dua langkah (TOTP, Supabase Auth MFA) wajib untuk role `owner` dan `admin`, opsional untuk role lain. Server action dan halaman admin/owner menolak sesi yang belum level AAL2.
- Akun admin master: role `admin`, akses CMS dan PWA penuh, bisa mengundang semua role termasuk `owner`. Dibuat sekali lewat skrip bootstrap, setelah itu semua akun lewat undangan.
- Sesi portal berumur terbatas, logout membersihkan sesi di server, perubahan role atau penonaktifan akun langsung mencabut sesi.
- Semua aksi sensitif (undang, ubah role, nonaktifkan, ekspor, hapus data) tercatat di `audit_log`.

### Email domain
| Alamat | Dipakai untuk |
|---|---|
| `notifikasi@kisgroup.co.id` | Email otomatis sistem (undangan, lupa password, notifikasi internal). Balasan diteruskan ke `corporate@` |
| `marketing@kisgroup.co.id` | Email ke calon pembeli (konfirmasi form, brosur, jadwal survei) |
| `corporate@kisgroup.co.id` | Urusan resmi perusahaan (mitra, bank, lamaran kerja) |

Pengiriman lewat Brevo dengan domain terautentikasi (SPF, DKIM, DMARC). Email masuk ke `marketing@` dan `corporate@` diteruskan ke Gmail lewat Cloudflare Email Routing.
- Semua migrasi lewat `supabase/migrations` (Supabase CLI). Tidak ada perubahan schema manual lewat dashboard.

### Kompresi gambar (wajib)

Semua gambar yang diunggah ke website, portal, atau PWA dikompres di browser sebelum dikirim. Tidak ada jalur unggah yang mengirim file mentah dari kamera.

- Satu modul bersama di `src/lib/image/` dipakai oleh semua form unggah (CMS admin, laporan lapangan, absensi, dokumen konsumen, lamaran kerja).
- Mesin kompres memakai API bawaan browser (`createImageBitmap` + `OffscreenCanvas` di Web Worker, dengan fallback canvas di main thread), tanpa dependency baru. Kalau ternyata butuh library (misal untuk HEIC), minta persetujuan dulu.
- Format keluaran WebP. Kalau browser tidak bisa meng-encode WebP (cek `blob.type`), pakai JPEG.
- Kualitas diturunkan bertahap sampai ukuran di bawah target. Batas awal (bisa diubah di `src/config/images.ts`):

| Jenis | Sisi terpanjang | Target ukuran |
|---|---|---|
| Foto konten website (proyek, berita, promo, banner) | 2048 px | 500 KB |
| Foto laporan lapangan, material, kendala | 1600 px | 300 KB |
| Selfie absensi | 800 px | 150 KB |
| Dokumen konsumen (KTP, slip gaji, dsb) | 2000 px, harus tetap terbaca | 800 KB |

- Orientasi kamera diterapkan (`imageOrientation: "from-image"`), lalu metadata EXIF dibuang karena bisa berisi lokasi GPS. Data yang memang dibutuhkan (waktu foto, koordinat laporan) dicatat dulu dan disimpan di kolom terpisah.
- Di PWA, kompresi dijalankan sebelum file masuk antrian Dexie, supaya IndexedDB dan kuota HP tidak cepat penuh.
- Server tidak mempercayai client: setiap bucket diberi `file_size_limit` dan `allowed_mime_types`, dan server action menolak file di atas batas.
- Aset statis di `public/` dikompres sebelum di-commit. Tampilan memakai `next/image` dengan `sizes` yang benar.
- E2E: unggah foto besar (misal 6 MB dari kamera) lalu cek file yang tersimpan di Storage berada di bawah target ukurannya.

---

## 9. Integrasi Meta (ringkasan, detail di `docs/meta-integration.md`)

1. **Pixel (browser)**: `PageView`, `ViewContent` (halaman proyek/unit), `Lead` (submit form), `Contact` (klik WhatsApp), `Schedule` (booking survei). Hanya dimuat setelah consent.
2. **Conversions API (server)**: event yang sama dikirim dari server dengan `event_id` identik untuk deduplikasi. Sertakan `fbp`, `fbc` (dari cookie / `fbclid`), IP, user agent, `em`/`ph`/`external_id` yang di-hash SHA-256 setelah dinormalisasi.
3. **Lead Ads webhook**: `/api/webhooks/meta/leadgen`. Verifikasi `hub.verify_token` (GET) dan `X-Hub-Signature-256` dengan App Secret (POST). Ambil detail lead via Graph API, simpan `meta_lead_id`, proses idempotent.
4. **Conversion Leads (CRM ke Meta)**: setiap perubahan tahap pipeline dicatat ke tabel `meta_event_outbox`, lalu worker `/api/cron/meta-outbox` (dipicu `pg_cron` + `pg_net` dari Supabase, lihat bagian 10) mengirim ke dataset Meta dengan `action_source: "system_generated"`, `custom_data.event_source: "crm"`, `custom_data.lead_event_source: "KIS CRM"`, dan `user_data.lead_id` kalau ada (kalau tidak, `em`/`ph` ter-hash). `event_time` harus setelah waktu lead dibuat dan maksimal 7 hari ke belakang. Retry dengan exponential backoff, simpan respons, tampilkan status sinkron di admin.
5. Versi Graph API, Pixel ID, dataset ID, token, dan `test_event_code` lewat env. Preview deployment selalu memakai `test_event_code`.

---

## 10. Git dan CI/CD (wajib)

Tidak ada kode yang sampai ke production tanpa lewat PR dan CI hijau.

### Paket gratis (keputusan owner, Fase 0)
Semua layanan memakai paket gratis: GitHub Free (repo private), Vercel Hobby, Supabase Free. Batasan dan penggantinya:

| Batasan | Pengganti |
|---|---|
| GitHub Free private: tanpa branch protection, rulesets, dan GitHub Environments | Pengaman berlapis: aturan `deny` di `.claude/settings.json`, hook Husky `pre-push` menolak push ke `main`, merge hanya lewat `bash scripts/merge-pr.sh <nomor>` yang memeriksa semua check hijau lalu squash merge. Secret CI disimpan sebagai repository secret dengan awalan `PRODUCTION_` |
| GitHub Free private: CodeQL dan dependency review butuh Advanced Security | Keamanan dependency lewat Dependabot alerts (gratis), `pnpm audit`, gitleaks, dan aturan typescript-eslint strict |
| GitHub Free: 2.000 menit Actions per bulan | Anggaran menit di `docs/roadmap.md`. Workflow yang tidak relevan dilewati lewat filter `paths`. Uji flaky berjalan mingguan |
| Vercel Hobby: cron 1x sehari | Jadwal dijalankan `pg_cron` + `pg_net` di Supabase yang memanggil `/api/cron/*` dengan header `CRON_SECRET`. Vercel Cron tidak dipakai |
| Vercel Hobby: ketentuan pemakaian non-komersial | Risiko terbuka, dicatat di `docs/roadmap.md`, keputusan owner |
| Supabase Free: tanpa backup otomatis, project dijeda setelah 7 hari tanpa aktivitas | `keepalive.yml` ping API production setiap hari dan membuat issue kalau gagal. Backup terjadwal tidak dipakai (keputusan owner, Fase 2): data yang terhapus tidak bisa dikembalikan |
| Supabase Free: database 500 MB, storage 1 GB | Kompresi gambar wajib (bagian 8), masa simpan data yang bisa diatur, pemantauan kuota |

Kalau nanti pindah ke paket berbayar, kembalikan ke pola aslinya (branch protection, Environments dengan approval, Vercel Cron) dan perbarui bagian ini.

### Branch dan alur
- `main` = production (`kisgroup.co.id`, sementara `kisg-web.vercel.app` sampai domain terhubung). Tanpa branch dan database staging (keputusan owner, Fase 2, mengikuti pola prins dan kelola): setiap merge ke `main` langsung tayang.
- Kerja di branch `feat/...`, `fix/...`, `chore/...`, `refactor/...`, `test/...`, `docs/...` lalu PR ke `main`. Pengecekan sebelum tayang: CI hijau dan Preview Vercel PR itu.
- Aturan yang biasanya dipaksa branch protection tetap berlaku dan dijaga oleh pengaman di atas: tanpa push langsung ke `main`, tanpa force push, wajib PR, wajib semua status check lolos, branch harus up to date, squash merge.
- Conventional Commits dipaksa dengan commitlint (hook `commit-msg`) dan judul PR dicek di CI.
- `.github/pull_request_template.md` berisi checklist: ringkasan, skenario E2E yang ditambah, migrasi DB (ya/tidak, aman untuk rollback atau tidak), screenshot untuk perubahan UI, data yang butuh owner.
- `CODEOWNERS` untuk `supabase/migrations/`, `src/lib/meta/`, `.github/`, `proxy.ts` (tanpa branch protection, fungsinya sebagai penanda review, tidak memblokir).

### Workflow GitHub Actions (`.github/workflows/`)
Semua workflow: pnpm dengan cache, cache browser Playwright, `concurrency` yang membatalkan run lama di branch yang sama, `timeout-minutes` di setiap job, permission minimum (`contents: read` kecuali perlu), versi action di-pin.

1. **`ci.yml`** (setiap PR dan push ke `main`): install, typecheck, lint, check:copy, unit test dengan ambang coverage (minimal 80% untuk `src/lib` dan `src/features/*/utils|schemas|actions`), build, E2E di production build dengan Supabase lokal (Chromium untuk PR biasa, 3 browser x 3 shard untuk PR berlabel `e2e:full`), axe. Upload laporan Playwright, trace, video, dan coverage sebagai artifact.
2. **`db.yml`** (PR yang menyentuh `supabase/`): `supabase start`, terapkan semua migrasi dari nol, jalankan test RLS, `supabase db lint`, pastikan `database.types.ts` sama dengan hasil generate (`git diff --exit-code`), deteksi operasi destruktif (DROP, RENAME, ubah tipe kolom) dan wajibkan label `migration:destructive` + persetujuan.
3. **`security.yml`** (setiap PR + terjadwal mingguan): gitleaks (secret scan), `pnpm audit` gagal di level high ke atas. CodeQL dan `dependency-review-action` tidak dipakai selama repo private di GitHub Free.
4. **`preview.yml`** (event `deployment_status` dari Vercel Preview): smoke E2E halaman publik ke URL preview, lalu Lighthouse CI dengan budget (performance, accessibility, best practices, SEO minimal 95 untuk halaman publik dan LP). Hasil dikomentari ke PR.
5. **`deploy-db.yml`**: merge ke `main` yang menyentuh migrasi atau pengaturan Auth menjalankan `supabase db push` dan pengaturan Auth ke Supabase production.
6. **`release.yml`** (push ke `main`): release-please untuk versi, tag, dan CHANGELOG.
7. **`e2e-weekly.yml`** (terjadwal tiap Minggu malam WIB): suite E2E penuh 3 kali berturut-turut tanpa retry untuk mendeteksi test flaky, buka issue otomatis kalau ada yang gagal. Mingguan, bukan tiap malam, karena kuota menit Actions.
8. **`keepalive.yml`** (terjadwal harian): membaca satu baris data publik dari API Supabase production supaya project tidak dijeda, dan membuat issue kalau gagal.

Renovate (atau Dependabot) mingguan, update dikelompokkan, tanpa automerge untuk versi major. PR dependency tetap wajib CI hijau.

### Deploy (Vercel)
- Integrasi Git Vercel: Preview untuk setiap PR, Production otomatis dari `main`. Preview hanya punya URL dan publishable key Supabase production untuk membaca konten publik (tanpa secret key). Portal di preview dimatikan oleh `proxy.ts` (`VERCEL_ENV=preview`) dan form publik tidak menulis, jadi tidak ada data percobaan yang masuk ke production.
- `ignoreCommand` supaya perubahan yang hanya menyentuh `docs/` atau `*.md` tidak memicu build.
- Env var dipisah per environment di Vercel. Secret CI disimpan sebagai repository secret GitHub berawalan `PRODUCTION_`, tidak pernah di file repo.
- Migrasi harus backward compatible (pola expand lalu contract) karena deploy Vercel dan `deploy-db.yml` berjalan bersamaan setelah merge, sehingga app lama dan baru sempat memakai skema yang sama. Kolom dihapus paling cepat satu rilis setelah kode berhenti memakainya.
- Rollback app lewat Instant Rollback Vercel. Rollback database lewat migrasi perbaikan baru, tidak pernah mengedit migrasi lama.
- `docs/ci-cd.md` menjelaskan alur ini, daftar secret yang dibutuhkan, dan cara rollback.

---

## 11. Akun per proyek dan izin

Perangkat ini dipakai untuk beberapa proyek (prins, kelola, KIS) dengan akun yang berbeda. Akun KIS harus aktif otomatis di proyek ini tanpa mengganggu proyek lain.

- Akun KIS dimuat oleh hook `SessionStart` (`.claude/hooks/kis-accounts.sh`) dari `~/.config/kis/accounts.env` ke environment sesi ini saja: `GH_TOKEN`, identitas git, `GIT_SSH_COMMAND`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SENTRY_AUTH_TOKEN`. Pola akhirnya mengikuti pola yang sudah dipakai proyek prins dan kelola (lihat Fase Setup).
- **Dilarang mengubah konfigurasi global**: `git config --global`, `gh auth switch/login/logout`, `supabase login`, `vercel login/switch`. Perintah ini mengganti akun untuk semua proyek dan bisa membuat prins atau kelola push/deploy ke akun yang salah.
- **Dilarang menyentuh folder proyek prins dan kelola**, kecuali membaca saat Fase Setup.
- Sebelum push, membuka PR, atau memakai CLI gh/supabase/vercel pertama kali dalam sesi: jalankan `bash scripts/check-accounts.sh`. Kalau ada yang GAGAL, berhenti dan laporkan. Jangan mencoba memperbaiki dengan login ulang.
- Kalau hook menampilkan "AKUN KIS BELUM AKTIF", jangan commit, push, atau memakai CLI eksternal sampai saya membereskannya.
- Hook git (Husky) `pre-commit` dan `pre-push` menjalankan `bash scripts/check-accounts.sh --quick`, jadi commit atau push manual dari terminal juga terlindungi.
- Token tidak pernah ditampilkan di output, ditulis ke file proyek, atau dikirim ke mana pun. Jangan menjalankan perintah yang mencetak isi env.
- Izin Claude Code ada di `.claude/settings.json`. Mode auto diatur di `~/.claude/settings.json` milik saya, bukan di file proyek. Kalau sebuah aksi diblokir oleh mode auto atau aturan `deny`, jangan cari jalan memutar. Laporkan dan tunggu keputusan saya.
- Migrasi database production dan deploy production hanya lewat pipeline (bagian 10), tidak pernah dari lokal.

---

## 12. Widget customer service (Gemini)

Asisten chat di website publik dan landing page. Tujuannya menjawab pertanyaan calon pembeli dengan cepat dan mengubah percakapan menjadi lead yang tercatat di CRM.

**Keamanan dan biaya**
- `GEMINI_API_KEY` hanya di server (route handler dengan `import "server-only"`). Tidak pernah ada di client, log, atau Sentry.
- Rate limit per IP dan per sesi, batas panjang pesan, batas jumlah pesan per sesi, batas token output, dan batas biaya harian dengan alarm. Turnstile (invisible) sebelum pesan pertama.
- Tahan prompt injection: instruksi sistem tidak bisa diubah dari input pengunjung, isi knowledge base diperlakukan sebagai data, asisten tidak pernah membocorkan instruksi sistem atau data internal (lead lain, harga internal, data karyawan).

**Jawaban hanya dari data resmi**
- Sumber jawaban: data proyek, tipe unit, ketersediaan unit, fasilitas, lokasi, promo aktif, dan FAQ dari database, ditambah knowledge base yang dikelola admin (dicari dengan pgvector).
- Harga, promo, legalitas, spesifikasi, dan ketersediaan **tidak boleh dikarang**. Kalau datanya tidak ada, asisten bilang belum punya infonya dan menawarkan sambung ke marketing.
- Tidak menjanjikan persetujuan KPR, tidak memberi nasihat hukum atau pajak.
- Di luar topik properti KIS, asisten menolak dengan sopan dan mengarahkan kembali.

**Kemampuan (tool calling)**
`get_project_info`, `check_unit_availability`, `calculate_kpr` (memakai fungsi simulasi KPR yang sama dengan website), `create_lead` (nama dan nomor HP dengan persetujuan PDP, sumber `chat`, masuk round-robin CRM dan memicu event Lead ke Meta), `schedule_survey`, `handoff_to_human`.

**Serah ke manusia**
- Pada jam kerja: percakapan muncul di inbox chat portal CRM (Supabase Realtime), marketing bisa mengambil alih dan membalas langsung dari portal.
- Di luar jam kerja atau saat tidak ada yang online: tawarkan lanjut via WhatsApp dengan ringkasan percakapan di pesan pembuka, atau tinggalkan nomor untuk dihubungi.
- Kalau Gemini error atau timeout: widget tetap berfungsi dengan tombol WhatsApp dan form singkat, tanpa pesan error teknis.

**Gaya bahasa**
- Persona: staf customer service KIS. Ramah, singkat, jelas. Aturan copywriting bagian 7 berlaku penuh untuk setiap jawaban.
- Jawaban pendek (maksimal sekitar 3 kalimat kecuali pengunjung minta rincian), tanpa emoji, tanpa dash panjang. Output disaring di server sebelum dikirim sebagai pengaman terakhir.
- Asisten tidak berpura-pura manusia. Kalau ditanya, jujur bahwa ini asisten virtual KIS.

**UI**
- Satu tombol melayang yang menggabungkan chat dan WhatsApp (tidak ada dua tombol yang bertumpuk). Di mobile terbuka sebagai layar penuh, di desktop sebagai panel.
- Skrip widget dimuat setelah halaman siap (lazy), tidak boleh menurunkan skor Lighthouse.
- Streaming jawaban, indikator mengetik, tombol saran pertanyaan singkat, aksesibel dengan keyboard dan screen reader.
- Pemberitahuan singkat bahwa percakapan disimpan, dengan tautan kebijakan privasi.

**Data dan admin**
- Tabel `chat_sessions`, `chat_messages`, `cs_knowledge` (dengan embedding), `cs_settings` (jam kerja, pesan sambutan, saran pertanyaan, batas biaya). Ada masa simpan data yang bisa diatur.
- Admin: kelola knowledge base (otomatis membuat embedding ulang saat diubah), lihat transkrip, tandai jawaban salah, daftar pertanyaan yang tidak terjawab, statistik (jumlah chat, lead dari chat, handoff, biaya).

**Testing**
- E2E memakai model tiruan (mock provider AI SDK) yang diaktifkan lewat env saat test, sehingga tidak memanggil Gemini dan hasilnya deterministik.
- Evaluasi terpisah (`pnpm eval:cs`) dengan kumpulan pertanyaan acuan ke Gemini asli, dijalankan di workflow nightly. Lolos kalau: tidak ada harga atau promo karangan, tidak ada dash panjang dan emoji, handoff terpicu saat diminta, menolak pertanyaan di luar topik, tahan terhadap percobaan prompt injection.

---

## 13. Cara kerja

- Kerjakan per fase sesuai prompt yang diberikan. Satu fase bisa beberapa branch dan PR kecil. Commit kecil dengan pesan Conventional Commits berbahasa Inggris.
- Mulai setiap fase dengan rencana singkat dan daftar file yang akan dibuat/diubah.
- Tulis skenario E2E di awal fase (bersama rencana), bukan di akhir. Implementasi dianggap selesai saat semua skenario itu lolos.
- Selama mengerjakan: `pnpm verify:quick`. Untuk tugas besar dan di akhir fase: push dan tunggu CI hijau (bagian 5). Jangan menjalankan `next build`, Playwright, atau Supabase lokal di laptop.
- Sebelum push pertama dalam sesi: `bash scripts/check-accounts.sh` (bagian 11).
- Push branch, buka PR, dan pastikan semua workflow CI hijau. Kalau CI gagal, baca log-nya (`gh run view --log-failed`), perbaiki, push ulang. Jangan menganggap tugas selesai selama CI merah.
- Setelah CI hijau, laporkan singkat apa yang dibuat, apa yang belum, dan data apa yang masih dibutuhkan dari owner.
- Perbarui `docs/` kalau ada keputusan arsitektur atau perubahan model data.
- Jangan pernah menghapus migrasi yang sudah jalan. Buat migrasi baru.
