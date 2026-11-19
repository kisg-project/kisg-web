# Prompt Claude Code : KIS Group Platform

## Persiapan (sekali saja)

1. Buat folder proyek kosong, buka di VS Code.
2. Ekstrak isi zip ke root folder: `CLAUDE.md`, `.claude/settings.json`, `.claude/hooks/kis-accounts.sh`, `scripts/check-accounts.sh`, `scripts/accounts.expected.env`, `docs/accounts.env.example`.
3. Buat folder `public/brand/`, salin logo KIS dari folder Download ke sana (SVG lebih baik, PNG resolusi tinggi juga bisa).
4. Siapkan akun dan tool: repo GitHub (private) di akun KIS, GitHub CLI, Supabase CLI, Docker (untuk Supabase lokal), Vercel CLI, akun Supabase (2 project: staging dan production), akun Vercel, Meta Business (Pixel/dataset, App untuk webhook Lead Ads), API key Gemini (boleh menyusul sebelum Fase 7).
5. Mode auto tetap diatur di `~/.claude/settings.json` milikmu. Claude Code mengabaikan `defaultMode: "auto"` dari file proyek, jadi `.claude/settings.json` di sini hanya berisi daftar izin dan hook.
6. Jalankan Claude Code, ketik `/add-dir <path folder prins>` dan `/add-dir <path folder kelola>` supaya dia bisa membaca pola akun yang sudah ada, lalu tempel **Fase Setup**.
7. Setelah Fase Setup selesai, tutup sesi, buka sesi baru (supaya hook akun termuat), lalu lanjut Fase 0 dan seterusnya. Lanjut ke fase berikutnya hanya kalau CI fase sebelumnya sudah hijau dan sudah kamu cek di staging.

Tips: untuk Fase 0 dan setiap awal fase besar, aktifkan Plan Mode (Shift+Tab) supaya Claude Code menyusun rencana dulu sebelum menulis kode.

---

## FASE SETUP : Akun per proyek dan izin

```
Perangkat ini dipakai untuk 3 proyek: prins, kelola, dan KIS (proyek ini). Masing-masing punya akun sendiri untuk GitHub, git, Supabase, Vercel, dan layanan lain. Di prins dan kelola, akun sudah otomatis pindah sesuai proyek. Saya mau KIS bekerja dengan cara yang sama.

Baca CLAUDE.md bagian 11 dulu. Selama fase ini, folder prins dan kelola HANYA BOLEH DIBACA. Jangan ubah apa pun di sana.

1. Pelajari pola yang sudah dipakai prins dan kelola. Periksa (kalau ada):
   - .claude/settings.json, .claude/settings.local.json, .claude/hooks/
   - .envrc (direnv), .env* yang berisi token CLI (baca nama variabelnya saja, jangan tampilkan nilainya)
   - .git/config (remote, user, core.sshCommand), .vscode/settings.json
   - .mcp.json (MCP server per proyek)
   - ~/.gitconfig (includeIf per folder), ~/.ssh/config (host alias per akun)
   - .vercel/, supabase/.temp/ atau penanda project link
   - skrip lain yang berkaitan dengan pergantian akun
   Laporkan ke saya dalam tabel: layanan, cara prins/kelola memilih akun, lokasi konfigurasinya.

2. Bandingkan dengan pola default yang sudah ada di proyek ini (.claude/hooks/kis-accounts.sh, scripts/check-accounts.sh, ~/.config/kis/accounts.env). Usulkan salah satu:
   a) ikuti pola prins/kelola persis, atau
   b) pakai pola default ini, kalau pola prins/kelola punya kelemahan (misalnya mengubah akun global sehingga bentrok saat dua proyek dibuka bersamaan).
   Jelaskan alasannya singkat dan tunggu persetujuan saya.

3. Setelah saya setuju, terapkan untuk KIS:
   - Semua layanan yang dipakai prins/kelola plus yang dibutuhkan KIS: GitHub (gh dan git push), identitas commit, Supabase CLI, Vercel CLI, Sentry CLI, MCP server (kalau dipakai), dan layanan lain yang kamu temukan.
   - Buat ~/.config/kis/accounts.env dari docs/accounts.env.example (chmod 600) kalau pola default yang dipakai. Isinya saya yang mengisi, kamu jangan membaca atau menampilkan isinya.
   - Kalau perlu entri baru di ~/.gitconfig (includeIf untuk folder KIS) atau ~/.ssh/config (host alias akun KIS), tunjukkan perubahannya dulu. Jangan mengubah entri milik prins atau kelola.
   - Kalau MCP dipakai, buat .mcp.json KIS dengan pola yang sama, mengarah ke akun dan project KIS, tanpa secret di repo.
   - Isi scripts/accounts.expected.env dengan identitas KIS (tanya saya username, email, ref project, dsb).
   - Pastikan .gitignore memuat .env*, kecuali .env.example, plus .claude/settings.local.json, .vercel, supabase/.temp.

4. Tulis docs/accounts.md: cara kerja pergantian akun, file yang terlibat, cara menambah layanan baru, cara rotasi token.

5. Verifikasi, lalu laporkan hasilnya:
   - Hook akun baru termuat di sesi baru. Minta saya membuka sesi baru dan menulis "lanjutkan verifikasi Fase Setup", lalu jalankan bash scripts/check-accounts.sh. Semua harus OK.
   - Buktikan bahwa akun global tidak berubah: perintah yang sama dijalankan dari folder prins dan kelola tetap menunjukkan akun masing-masing (baca saja, jangan commit atau push di sana).
   - Uji pengaman: remote palsu milik owner lain harus ditolak oleh check-accounts.sh --quick.

Jangan memulai Fase 0 sebelum semua verifikasi lolos.
```

---

## FASE 0 : Audit, rencana, dan palet warna

```
Baca CLAUDE.md sampai habis. Ini proyek platform untuk KIS Group, developer perumahan: website corporate, landing page iklan, CRM yang tersinkron ke Meta, PWA laporan kinerja karyawan, dan panel admin CMS.

Tugas fase ini, belum menulis kode aplikasi:

1. Lihat file logo di public/brand/. Ekstrak palet sesuai prosedur di CLAUDE.md bagian 6. Tunjukkan ke saya: hex warna asli logo, peran tiap warna, skala 50 sampai 950, neutral, warna semantik, warna status unit, dan hasil cek kontras AA. Tunggu persetujuan saya sebelum dikunci.

2. Susun docs/architecture.md:
   - Peta route lengkap untuk keempat area (site, lp, portal, api).
   - Strategi rendering per halaman (static, ISR dengan revalidate on-demand dari admin, dynamic).
   - Alur auth dan RBAC (Custom Access Token Hook, RLS, guard di proxy dan server action).
   - Alur data offline PWA (antrian Dexie, idempotency key, sinkronisasi ulang, penanganan konflik).
   - Alur Meta: Pixel + CAPI dengan dedup, webhook Lead Ads, outbox Conversion Leads.

3. Susun docs/data-model.md: ERD dalam Mermaid + daftar tabel, kolom, enum, index, dan ringkasan policy RLS per role. Minimal mencakup:
   profiles, user_roles, teams, projects, project_media, unit_types, units (blok/kavling dengan status tersedia/hold/booking/terjual), facilities, nearby_places,
   leads, lead_sources, lead_activities, lead_stage_history, deals, appointments (survei), tasks/follow_ups,
   campaigns, landing_pages, landing_page_blocks, form_submissions, utm_touchpoints,
   meta_event_outbox, meta_webhook_events,
   work_items (item pekerjaan per unit/WBS), daily_site_reports, site_report_items, site_report_photos, material_logs, site_issues,
   attendance (GPS + selfie), marketing_activities, kpi_definitions, kpi_targets, kpi_scores,
   posts (berita), promos, banners, testimonials, faqs, careers, job_applications, site_settings, seo_meta,
   chat_sessions, chat_messages, cs_knowledge (pgvector), cs_settings,
   notifications, push_subscriptions, audit_log.

4. Buat docs/TODO-DATA.md: daftar data yang harus saya siapkan (nama PT dan legalitas, alamat kantor, data tiap proyek, tipe unit, harga, foto, siteplan, struktur karyawan, item pekerjaan pembangunan, target KPI, dll).

5. Tulis rencana fase 1 sampai 9 dengan estimasi file dan risiko teknis tiap fase.

6. Buat docs/e2e-coverage.md: matriks skenario E2E per area dan per role (siapa boleh, siapa ditolak), termasuk jalur gagal dan offline. Ini jadi definisi selesai setiap fase.

Tanyakan hal yang ambigu di akhir, maksimal 10 pertanyaan, singkat.
```

---

## FASE 1 : Fondasi proyek

```
Fase 1: fondasi. Ikuti CLAUDE.md dan docs/architecture.md.

1. Inisialisasi Next.js versi stable terbaru (App Router, TypeScript, Tailwind v4, src dir, pnpm). Cek versi yang terpasang, lalu sesuaikan semua pola kode dengan dokumentasi versi itu.
2. TypeScript strict + noUncheckedIndexedAccess. ESLint strict, Prettier, Husky + lint-staged. Hook pre-commit dan pre-push menjalankan `bash scripts/check-accounts.sh --quick` (CLAUDE.md bagian 11). Script: typecheck, lint, test, test:related, test:e2e, test:e2e:dev, build, check:copy, db:types, verify:quick, verify:full (isi sesuai CLAUDE.md bagian 5). Commitlint di hook commit-msg.
3. Env tervalidasi dengan @t3-oss/env-nextjs. Buat .env.example lengkap dengan komentar singkat.
4. Design tokens dari palet yang sudah disetujui di Fase 0: @theme Tailwind, light + dark untuk portal, font Plus Jakarta Sans via next/font.
5. Pasang shadcn/ui, sesuaikan dengan token. Buat komponen dasar: Button, Input, Select, Textarea, Checkbox, Dialog, Sheet, Tabs, Badge (termasuk badge status unit), Card, Table, Skeleton, Toast, EmptyState, ErrorState, PageHeader, Container, Section.
6. Skrip check:copy sesuai CLAUDE.md bagian 7 (dash panjang, emoji, ikon terlarang, frasa klise). Gagal = exit code 1. Masukkan ke lint-staged dan CI.
7. Security headers di next.config, src/config/site.ts (kontak, WA, IG, nav), helper format (rupiah, tanggal WIB, normalisasi nomor HP ke +62).
8. Setup Vitest, Sentry, Vercel Analytics, Speed Insights.
9. Infrastruktur E2E sesuai CLAUDE.md bagian 5:
   - Playwright dengan project Chromium desktop, Mobile Chrome, Mobile Safari.
   - webServer menjalankan production build (next build && next start).
   - Global setup: supabase start, reset + seed database lokal, buat storageState per role (disiapkan dulu strukturnya, diisi di Fase 2).
   - Folder e2e/ dengan fixtures, factories, page objects.
   - @axe-core/playwright terpasang dengan helper expectNoA11yViolations().
   - Helper mock jaringan untuk Meta, Resend, Turnstile.
   - Test pertama: /dev/ui dan halaman placeholder beranda render tanpa error console dan tanpa pelanggaran aksesibilitas.
10. CI/CD lengkap sesuai CLAUDE.md bagian 10:
    - Ketujuh workflow (ci, db, security, preview, deploy-db, release, e2e-nightly). db.yml dan deploy-db.yml boleh berisi job yang di-skip otomatis selama folder supabase/ belum ada, lalu aktif di Fase 2.
    - Branch staging, PR template, CODEOWNERS, konfigurasi Renovate, release-please.
    - Atur branch protection main dan staging lewat `gh api` (required checks, wajib PR, larang force push). Kalau tidak punya izin, tulis perintahnya di docs/ci-cd.md untuk saya jalankan.
    - vercel.json / konfigurasi ignoreCommand.
    - docs/ci-cd.md: alur, daftar secret GitHub dan env Vercel yang harus saya isi, cara rollback.
    - Uji pipeline: buka PR percobaan dari branch fitur ke staging dan pastikan semua workflow berjalan dan hijau. Buka juga PR kedua yang sengaja gagal (misal ada em dash di teks) untuk membuktikan CI memblokir merge, lalu tutup PR itu.
11. Halaman /dev/ui (hanya aktif di development dan test) yang menampilkan semua token dan komponen untuk review visual.

Ini tugas besar: jalankan pnpm verify:full di lokal, lalu pastikan semua workflow CI hijau. Laporkan singkat beserta daftar secret yang harus saya isi.
```

---

## FASE 2 : Database, auth, RBAC

```
Fase 2: Supabase. Ikuti docs/data-model.md yang sudah disetujui.

1. Supabase CLI, supabase init, migrasi bertahap dan bernama jelas (extensions, enums, tables, indexes, functions, triggers, RLS, storage).
2. Enum Postgres untuk role, tahap pipeline, status unit, sumber lead, tipe aktivitas. Samakan dengan src/config/.
3. Trigger updated_at, audit_log, normalisasi nomor HP, dan pencatatan lead_stage_history otomatis.
4. Trigger yang memasukkan baris ke meta_event_outbox setiap kali tahap lead berubah (mapping tahap ke nama event di tabel konfigurasi, bukan hardcode).
5. Custom Access Token Hook untuk menyuntikkan role dan team_id ke JWT.
6. RLS di semua tabel. Tulis test RLS (pgTAP atau test SQL) yang membuktikan: marketing tidak bisa membaca lead orang lain, site_supervisor hanya bisa menulis laporan proyek yang ditugaskan, publik hanya bisa membaca konten yang published.
7. Storage buckets: public-assets (publik), site-reports, customer-docs, avatars (privat) beserta policy.
8. Generate types ke src/lib/supabase/database.types.ts. Buat client browser, server, dan admin (server-only).
9. Auth portal: login email + password, lupa password, undang user oleh admin (tanpa registrasi publik). Guard role di proxy dan di wrapper next-safe-action.
10. seed.sql untuk development saja: 1 proyek (Sejahtera Green Village) sesuai CLAUDE.md, user contoh per role, data dummy yang jelas berlabel dummy.

E2E wajib:
- Lengkapi storageState per role di global setup.
- Login berhasil per role dan diarahkan ke halaman yang sesuai.
- Login gagal (password salah, akun nonaktif) menampilkan pesan yang benar.
- Lupa password sampai email terkirim (mock Resend, assert isi email).
- Setiap role yang membuka halaman di luar haknya ditolak, baik lewat URL langsung maupun lewat server action.
- Logout membersihkan sesi.

Aktifkan job di db.yml dan deploy-db.yml. Pastikan migrasi terdorong ke Supabase staging lewat pipeline, bukan manual.

pnpm verify:full lokal + semua workflow CI (termasuk db.yml) harus hijau.
```

---

## FASE 3 : Website corporate

```
Fase 3: website publik di route group (site). Struktur mengacu pola damaiputra.com, visual dan copy milik KIS sendiri sesuai CLAUDE.md bagian 6 dan 7. Semua konten diambil dari database (nanti diatur di admin), tidak hardcode.

Halaman:
1. Beranda: hero carousel (banner dari admin, gambar dioptimasi, autoplay bisa dijeda, aksesibel), strip statistik (dari site_settings, kosongkan kalau datanya belum ada), sorotan Sejahtera Green Village, progres pembangunan terbaru, berita, promo, CTA penutup, footer lengkap.
2. Proyek: daftar proyek terbit tanpa filter. Selama hanya ada satu proyek, menu Proyek langsung ke detailnya.
3. Detail proyek /proyek/[slug]: galeri, tipe unit (luas tanah/bangunan, spesifikasi, harga atau "Hubungi marketing"), siteplan interaktif SVG dengan status kavling realtime, fasilitas, lokasi (peta + jarak ke tempat penting), progres pembangunan, simulasi KPR, unduh brosur (wajib isi form singkat, masuk ke CRM), form minat, FAQ.
4. Simulasi KPR: input harga, DP, tenor, bunga. Rumus anuitas yang benar, disclaimer singkat bahwa angka bersifat estimasi.
5. Tentang Kami (profil, visi misi, legalitas, perjalanan proyek), Berita + detail, Promo + detail, Karir + form lamaran, Kontak (form + peta + kontak), Kebijakan Privasi, Syarat Ketentuan.
6. Tombol WhatsApp melayang dengan pesan pembuka otomatis yang menyebut halaman/proyek asal. Klik dicatat sebagai event Contact.
7. Semua form lead: Zod, Turnstile, honeypot, rate limit, checkbox persetujuan PDP, simpan UTM + fbclid + halaman asal, masuk ke tabel leads dengan sumber yang benar.
8. SEO: generateMetadata per halaman, Open Graph image dinamis, sitemap.xml, robots.txt, JSON-LD (Organization, RealEstateAgent, Residence/Product untuk unit, BreadcrumbList, Article).
9. Performa: target Lighthouse mobile 95+ di semua kategori, LCP < 2,5 detik, CLS < 0,1. Gambar via next/image dengan ukuran dan prioritas yang tepat.
10. Aksesibilitas WCAG 2.2 AA: navigasi keyboard, fokus terlihat, alt text, landmark.

E2E wajib (desktop dan mobile):
- Semua halaman publik render, tanpa error console, tanpa pelanggaran axe, link internal tidak ada yang 404.
- Navigasi header, menu mobile, footer.
- Hero carousel: autoplay, jeda, navigasi keyboard.
- Detail Sejahtera Green Village menampilkan blok yang benar. Slug tidak ada menampilkan 404.
- Siteplan: klik kavling menampilkan status yang sesuai database.
- Simulasi KPR: hasil cicilan sesuai perhitungan yang di-assert, input tidak valid ditolak.
- Form minat, kontak, unduh brosur, lamaran karir: jalur sukses (dicek sampai ke database lengkap dengan UTM dan sumber), validasi gagal, tanpa persetujuan PDP ditolak, honeypot terisi ditolak, rate limit aktif.
- Tombol WA membuka URL wa.me dengan pesan yang menyebut proyek asal.
- sitemap.xml, robots.txt, metadata dan JSON-LD tiap tipe halaman.
- Visual regression beranda dan detail proyek.
```

---

## FASE 4 : Panel admin CMS

```
Fase 4: panel admin di /portal/admin, khusus role owner dan admin.

1. CRUD dengan validasi, draft/published, jadwal tayang, urutan drag-and-drop, pratinjau sebelum publish:
   proyek, media proyek, tipe unit, unit/kavling (termasuk editor siteplan: unggah SVG lalu petakan kavling ke unit), fasilitas, tempat terdekat, banner hero, berita (editor rich text yang aman dari XSS), promo, testimoni (hanya testimoni asli, ada kolom sumber dan izin tayang), FAQ, karir, lamaran masuk, pengaturan situs (kontak, WA, IG, alamat, statistik), SEO per halaman.
2. Upload gambar: validasi tipe dan ukuran, kompresi, alt text wajib, crop rasio sesuai pemakaian.
3. Setiap publish/ubah memicu revalidatePath/revalidateTag yang tepat sehingga website langsung terbarui tanpa redeploy.
4. Manajemen user: undang, ubah role, nonaktifkan, assign ke tim dan proyek.
5. Audit log yang bisa difilter (siapa, apa, kapan, nilai sebelum dan sesudah).
6. Fitur PDP: ekspor dan hapus data konsumen atas permintaan.

Semua tabel admin pakai TanStack Table: cari, filter, sort, pagination server side.

E2E wajib:
- Untuk setiap jenis konten: buat, ubah, publish, unpublish, hapus. Setelah publish, buka halaman publik dan pastikan perubahan langsung tampil tanpa redeploy.
- Draft tidak tampil di publik. Jadwal tayang bekerja.
- Upload gambar: file valid diterima, tipe/ukuran salah ditolak, alt text wajib.
- Editor siteplan: petakan kavling, ubah status unit, cek di halaman publik.
- Rich text: input berisi script berbahaya tidak tereksekusi di halaman publik.
- Undang user sampai user bisa login dengan role yang benar. User dinonaktifkan tidak bisa login.
- Role selain owner/admin ditolak di semua halaman admin.
- Setiap aksi tercatat di audit log.
- Ekspor dan hapus data konsumen (PDP).
```

---

## FASE 5 : Landing page builder + tracking Meta

```
Fase 5: landing page iklan dan tracking.

1. /lp/[slug] dirender dari landing_page_blocks. Blok yang tersedia: hero, keunggulan, tipe unit, galeri, lokasi, simulasi KPR, promo dengan hitung mundur, FAQ, form lead, CTA WA. Layout minimal tanpa menu utama, fokus konversi.
2. Builder di admin: pilih blok, isi konten, atur urutan, pratinjau mobile/desktop, duplikat halaman, A/B variant sederhana dengan pembagian traffic.
3. Tangkap dan simpan UTM, fbclid, cookie _fbp/_fbc (buat _fbc dari fbclid kalau belum ada), referrer, halaman pertama, ke utm_touchpoints dan dibawa ke lead.
4. Consent banner sederhana. Pixel dimuat setelah consent.
5. Pixel: PageView, ViewContent, Lead, Contact, Schedule. Setiap event punya event_id.
6. Conversions API di server (src/lib/meta/capi.ts): kirim event yang sama dengan event_id identik, hash SHA-256 untuk em/ph/external_id setelah normalisasi, sertakan IP dan user agent. Kirim lewat after() / waitUntil supaya tidak memperlambat respons. Gagal kirim tidak boleh menggagalkan submit form, masuk ke outbox untuk dicoba ulang.
7. test_event_code otomatis aktif di preview deployment.
8. Tulis docs/meta-integration.md: daftar event, parameter, cara verifikasi di Events Manager.

Unit test untuk normalisasi dan hashing (bandingkan dengan contoh hash di dokumentasi Meta).

E2E wajib:
- Buat LP di builder, publish, buka /lp/[slug], tampilan sesuai di desktop dan mobile.
- Kunjungan dengan UTM + fbclid sampai submit form: lead tersimpan dengan UTM, fbc, fbp yang benar.
- Tanpa consent: Pixel tidak dimuat. Dengan consent: event Pixel terkirim (intercept request).
- Event Pixel dan payload CAPI (di-mock) punya event_id yang sama, data pribadi sudah ter-hash, tidak ada PII mentah.
- CAPI gagal (mock 500): submit form tetap sukses, event masuk outbox.
- A/B variant: pembagian traffic dan variant tercatat di lead.
- Visual regression LP.
```

---

## FASE 6 : CRM + sinkronisasi Meta

```
Fase 6: CRM di /portal/crm.

1. Pipeline tahap (bisa diatur di admin): Baru, Dihubungi, Prospek, Jadwal Survei, Sudah Survei, Negosiasi, Booking Fee, Proses Berkas/KPR, Akad, Batal. Tampilan kanban (drag antar tahap) dan tabel.
2. Detail lead: identitas, sumber dan jejak UTM, timeline aktivitas (telepon, WA, survei, catatan), tahap, unit yang diminati, dokumen (bucket privat), tugas follow-up.
3. Lead masuk dari: form website, LP, Meta Lead Ads, input manual, walk-in, Instagram, referral. Deteksi duplikat berdasarkan nomor HP ternormalisasi, gabungkan riwayat, jangan buat lead ganda.
4. Distribusi lead otomatis round-robin ke marketing aktif (bisa per proyek), notifikasi push + in-app, SLA respons pertama dengan eskalasi ke manager kalau lewat batas.
5. Tombol "Chat WA" yang membuka wa.me dengan template pesan, dan otomatis mencatat aktivitas.
6. Booking unit: mengubah status unit (hold dengan batas waktu, booking, terjual) dengan transaksi database dan penguncian supaya satu unit tidak bisa dibooking dua orang.
7. Webhook Meta Lead Ads di /api/webhooks/meta/leadgen sesuai CLAUDE.md bagian 9. Simpan payload mentah di meta_webhook_events, proses idempotent berdasarkan leadgen_id, petakan field form ke kolom lead.
8. Worker /api/cron/meta-outbox (Vercel Cron, dilindungi CRON_SECRET) untuk mengirim event Conversion Leads dari meta_event_outbox: batch, retry exponential backoff, dead letter setelah N kali gagal, abaikan event yang event_time-nya lebih dari 7 hari.
9. Halaman status integrasi di admin: event terkirim, gagal, alasan gagal, tombol kirim ulang.
10. Laporan CRM: funnel per tahap, lead per sumber/kampanye, konversi per marketing, waktu respons rata-rata, input biaya iklan per kampanye untuk menghitung CPL dan biaya per akad.

E2E wajib:
- Lead dari website muncul di CRM marketing yang mendapat giliran, notifikasi in-app muncul.
- Round-robin: 3 lead masuk berurutan terbagi ke 3 marketing berbeda.
- Lead dengan nomor HP yang sama (format berbeda: 0896..., +62896..., 62896...) digabung, tidak dobel.
- Drag kartu di kanban mengubah tahap, riwayat tahap tercatat, baris outbox Conversion Leads terbentuk.
- Marketing A tidak bisa melihat atau membuka lead milik marketing B (URL langsung juga ditolak). Manager melihat lead timnya.
- Dua user membooking unit yang sama bersamaan (dua browser context paralel): hanya satu yang berhasil, satunya mendapat pesan yang jelas.
- Hold unit kedaluwarsa kembali ke tersedia.
- Webhook leadgen: signature valid diterima dan lead masuk CRM, signature salah ditolak 401/403, webhook yang sama dikirim dua kali tetap satu lead.
- Worker outbox (dipanggil dengan CRON_SECRET): payload ke Meta (di-mock) sesuai spesifikasi, gagal lalu retry, event lebih dari 7 hari dilewati. Tanpa CRON_SECRET ditolak.
- Status integrasi di admin menampilkan event gagal dan tombol kirim ulang bekerja.
- Tombol Chat WA membuka wa.me yang benar dan aktivitas tercatat.
- Laporan CRM menampilkan angka yang sama dengan data seed.
```

---

## FASE 7 : Widget customer service (Gemini)

```
Fase 7: widget customer service sesuai CLAUDE.md bagian 12. GEMINI_API_KEY akan saya isi di env. Selama belum ada, semua pekerjaan dan test memakai mock provider.

1. Cek dokumentasi terbaru AI SDK dan provider Google untuk versi yang terpasang, serta daftar model Gemini yang masih aktif. Model chat dan embedding diambil dari env GEMINI_MODEL dan GEMINI_EMBEDDING_MODEL. Tulis rekomendasi model beserta alasan dan perkiraan biaya per 1.000 percakapan, tunggu persetujuan saya.
2. Migrasi: aktifkan pgvector, tabel chat_sessions, chat_messages, cs_knowledge (dengan embedding dan index), cs_settings, beserta RLS (pengunjung anonim hanya bisa mengakses sesinya sendiri lewat token sesi yang ditandatangani server).
3. Route handler chat (server-only, streaming): Turnstile, rate limit, batas panjang dan jumlah pesan, batas token, batas biaya harian, filter output (dash panjang, emoji), timeout dengan fallback.
4. Instruksi sistem dalam Bahasa Indonesia sesuai persona dan aturan copywriting. Simpan di file terpisah dengan versi, bukan di dalam komponen.
5. Retrieval: gabungkan data terstruktur dari database (proyek, tipe unit, ketersediaan, promo aktif, FAQ) dengan pencarian pgvector di cs_knowledge. Jawaban wajib berasal dari konteks ini.
6. Tools: get_project_info, check_unit_availability, calculate_kpr (pakai fungsi simulasi KPR yang sama dengan website), create_lead (dengan persetujuan PDP, masuk CRM sumber chat, round-robin, event Lead ke Meta), schedule_survey, handoff_to_human. Setiap tool memvalidasi input dengan Zod.
7. Widget: satu tombol melayang gabungan chat + WhatsApp, lazy load, panel di desktop, layar penuh di mobile, streaming, saran pertanyaan, pemberitahuan privasi, aksesibel. Tampil di website dan landing page (bisa dimatikan per LP).
8. Handoff: inbox chat di portal CRM dengan Supabase Realtime. Marketing bisa mengambil alih dan membalas. Di luar jam kerja, tawarkan WhatsApp dengan ringkasan percakapan.
9. Admin: kelola knowledge base (embedding ulang otomatis), pengaturan jam kerja, pesan sambutan, saran pertanyaan, batas biaya, transkrip, tandai jawaban salah, daftar pertanyaan tak terjawab, statistik.
10. Evaluasi pnpm eval:cs dengan minimal 40 pertanyaan acuan (harga, promo, lokasi, KPR, unit sold out, di luar topik, prompt injection, minta bicara dengan manusia). Masukkan ke workflow e2e-nightly, hanya jalan kalau secret GEMINI_API_KEY tersedia.

E2E wajib (dengan mock provider):
- Widget tidak dimuat sebelum halaman siap dan tidak menurunkan Lighthouse.
- Tanya jawab streaming tampil benar di desktop dan mobile, keyboard dan screen reader bisa dipakai.
- Pertanyaan harga untuk tipe tanpa harga dijawab tanpa angka dan menawarkan sambung ke marketing.
- create_lead: lead masuk CRM dengan sumber chat, ditugaskan ke marketing, outbox Meta terbentuk. Tanpa persetujuan PDP ditolak.
- Handoff jam kerja: marketing menerima di inbox portal dan balasannya muncul di widget pengunjung secara realtime.
- Handoff di luar jam kerja: tombol WhatsApp berisi ringkasan percakapan.
- Provider error atau timeout: widget menampilkan WhatsApp dan form, tanpa pesan error teknis.
- Rate limit dan batas pesan bekerja. Pengunjung tidak bisa membaca sesi chat orang lain.
- Output yang mengandung dash panjang atau emoji dari model tersaring sebelum tampil.
- Admin mengubah knowledge base lalu jawaban berikutnya memakai data baru.

---

## FASE 8 : PWA laporan kinerja

```
Fase 8: PWA di /portal dengan scope /portal/.

1. Manifest (nama, ikon dari logo semua ukuran termasuk maskable, warna dari token), service worker, halaman offline, prompt install yang sopan (termasuk petunjuk singkat untuk iOS).
2. Mode offline untuk tim lapangan: form laporan disimpan ke Dexie, foto dikompresi di client, antrian upload dengan idempotency key, sinkron otomatis saat online, indikator status sinkron per laporan.
3. Divisi lapangan (site_supervisor, site_manager):
   - Absensi masuk/pulang: GPS dengan geofence lokasi proyek, selfie, tolak kalau di luar radius (dengan alasan bisa diajukan).
   - Laporan harian: cuaca, jumlah tukang per keahlian, progres per item pekerjaan per unit (persen), foto wajib dengan stempel waktu dan lokasi, material masuk dan terpakai, kendala.
   - Kendala/isu dengan prioritas dan status penyelesaian.
   - Site manager menyetujui atau mengembalikan laporan dengan catatan.
   - Progres yang disetujui bisa dipilih untuk tampil di halaman progres pembangunan website.
4. Divisi marketing:
   - Aktivitas harian (follow-up, survei, canvassing, open table, konten), terhubung otomatis dengan aktivitas di CRM supaya tidak input dua kali.
   - Target vs realisasi, leaderboard tim.
5. Owner:
   - Dashboard ringkas: penjualan unit per proyek, funnel lead, CPL, progres fisik per proyek dan per unit, keterlambatan pekerjaan, kehadiran, skor kinerja per karyawan, isu terbuka.
   - Filter periode, drill-down sampai ke data mentah, ekspor Excel/PDF.
6. KPI: definisi dan bobot diatur admin, skor dihitung terjadwal (pg_cron), riwayat per periode.
7. Notifikasi Web Push (VAPID): lead baru, follow-up jatuh tempo, laporan perlu persetujuan, laporan ditolak.
8. Semua layar mobile first, cepat di HP kelas menengah dan sinyal lemah.

E2E wajib (utamakan profil mobile):
- Manifest valid, service worker terdaftar, halaman offline muncul saat tidak ada koneksi.
- Absensi: lokasi di dalam geofence diterima, di luar geofence ditolak (pakai geolocation dan permission Playwright), selfie wajib.
- Laporan harian lengkap dengan foto (setInputFiles) sampai tersimpan dan foto ada di storage privat.
- Offline: isi 2 laporan saat offline, reload halaman, data masih ada, kembali online, keduanya terkirim tepat satu kali, status sinkron berubah.
- Koneksi putus di tengah upload foto: tidak ada data ganda, upload dilanjutkan.
- Site manager menyetujui dan mengembalikan laporan, supervisor melihat catatannya.
- Progres yang disetujui dan dipilih tampil di website publik.
- Aktivitas marketing dari CRM otomatis muncul di laporan marketing.
- Dashboard owner: angka sesuai data seed, filter periode, drill-down, ekspor file berhasil diunduh.
- Supervisor tidak bisa membuka dashboard owner atau laporan proyek lain.
- Notifikasi push: subscribe berhasil, pemicu (lead baru, laporan ditolak) memanggil endpoint push (di-mock).
```

---

## FASE 9 : Hardening dan rilis

```
Fase 9: audit menyeluruh sebelum rilis.

1. Review keamanan: semua route dan server action punya cek auth + role, GEMINI_API_KEY dan token lain tidak ada di bundle client, uji widget chat dengan percobaan prompt injection dan penyalahgunaan biaya, semua tabel RLS, tidak ada secret di bundle client (cek hasil build), rate limit aktif, header keamanan benar, CSP tidak memblokir Pixel dan Turnstile.
2. Supabase advisors (security dan performance): perbaiki semua temuan. Index untuk query lambat.
3. Lighthouse dan Core Web Vitals semua halaman publik dan LP. Bundle analyzer untuk portal.
4. Aksesibilitas dengan axe di Playwright.
5. Jalankan check:copy, lalu baca ulang semua teks UI dan konten seed. Perbaiki yang terdengar kaku atau seperti tulisan AI.
6. Audit E2E: bandingkan docs/e2e-coverage.md dengan semua route, server action, dan role. Tulis test untuk yang belum tercakup. Jalankan seluruh suite 3 kali berturut-turut di CI, harus lolos semua tanpa retry. Tambahkan smoke test E2E yang jalan otomatis ke Preview deployment setelah deploy (memakai Supabase staging dan akun test khusus).
7. Setup Vercel: environment variables per environment, domain kisgroup.co.id (www redirect ke apex atau sebaliknya, pilih satu) dan staging.kisgroup.co.id, Vercel Cron, Preview memakai Supabase staging.
   Audit pipeline: semua workflow hijau, branch protection aktif, required checks lengkap, approval manual untuk deploy DB production berjalan, rollback app dan DB pernah dicoba sekali di staging dan hasilnya dicatat di docs/ci-cd.md.
8. Backup dan pemulihan: aktifkan PITR kalau paketnya mendukung, dokumentasikan langkah restore.
9. docs/runbook.md: cara deploy, rotasi token Meta, menambah user, menambah proyek baru, menangani webhook gagal.
10. Laporan akhir: checklist apa yang sudah siap, data yang masih kosong dari TODO-DATA.md, dan risiko yang tersisa.
```

---

## Prompt cadangan (pakai kapan saja)

**Saat ada bug**
```
Ada bug: [jelaskan gejala, langkah reproduksi, pesan error]. Cari akar masalahnya dulu, jelaskan penyebabnya, baru perbaiki. Tulis test E2E yang mereproduksi bug ini (harus gagal sebelum perbaikan dan lolos sesudahnya), plus unit test kalau relevan. Cek apakah pola bug yang sama ada di tempat lain.
```

**Review copywriting**
```
Review semua teks di [halaman/folder] sesuai CLAUDE.md bagian 7. Tampilkan tabel: teks lama, teks baru, alasan. Jangan ubah dulu sampai saya setujui.
```

**Review kode sebelum merge**
```
Review perubahan di branch ini sebagai senior engineer: bug, celah keamanan, RLS, race condition, error handling, performa, konsistensi dengan arsitektur. Urutkan dari yang paling serius. Perbaiki setelah saya setujui.
```
