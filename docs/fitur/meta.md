# Integrasi Meta

## Tujuan
Algoritma iklan belajar dari lead yang benar-benar closing.

## Keputusan owner
- Semua aturan teknis di bagian ini dipindah dari `CLAUDE.md` bagian 9. Detail tambahan di `docs/meta-integration.md` (dibuat saat fitur dibangun).

## Aturan
1. **Pixel (browser)**: `PageView`, `ViewContent` (halaman proyek atau unit), `Lead` (submit form), `Contact` (klik WhatsApp), `Schedule` (booking survei). Hanya dimuat setelah consent.
2. **Conversions API (server)**: event yang sama dikirim dari server dengan `event_id` identik untuk deduplikasi. Sertakan `fbp`, `fbc` (dari cookie atau `fbclid`), IP, user agent, `em`, `ph`, `external_id` yang di-hash SHA-256 setelah dinormalisasi.
3. **Lead Ads webhook**: `/api/webhooks/meta/leadgen`. Verifikasi `hub.verify_token` (GET) dan `X-Hub-Signature-256` dengan App Secret (POST). Ambil detail lead via Graph API, simpan `meta_lead_id`, proses idempotent.
4. **Conversion Leads (CRM ke Meta)**: setiap perubahan tahap pipeline dicatat ke `meta_event_outbox`, lalu worker `/api/cron/meta-outbox` (dipicu `pg_cron` dan `pg_net`) mengirim ke dataset Meta dengan `action_source: "system_generated"`, `custom_data.event_source: "crm"`, `custom_data.lead_event_source: "KIS CRM"`, dan `user_data.lead_id` kalau ada (kalau tidak, `em` atau `ph` ter-hash). `event_time` harus setelah waktu lead dibuat dan maksimal 7 hari ke belakang. Retry dengan exponential backoff, simpan respons, tampilkan status sinkron di admin.
5. Versi Graph API, Pixel ID, dataset ID, token, dan `test_event_code` lewat env. Preview deployment selalu memakai `test_event_code`.

## Cakupan
- [ ] Banner consent cookie dan penyimpanan pilihan pengunjung
- [ ] Pixel dengan lima event di atas
- [ ] CAPI dengan deduplikasi
- [ ] Webhook Lead Ads, lead masuk ke CRM dengan sumber `meta_lead_ads` dan nama form
- [ ] Outbox Conversion Leads dari perubahan tahap CRM, worker dengan retry
- [ ] Halaman status sinkron di admin: terkirim, gagal, coba ulang
- [ ] Biaya iklan per kampanye untuk CPL dan CAC (impor manual atau Marketing API)

## Test
E2E di `e2e/meta/`: payload Pixel dan CAPI dibandingkan, signature webhook salah ditolak 401, outbox terbentuk saat tahap berubah. Layanan Meta di-mock di level jaringan.

## Risiko teknis
- Dedup Pixel dan CAPI gagal kalau `event_id` tidak sama persis.
- Ad blocker memblokir Pixel. CAPI tetap mengirim event untuk pengunjung yang sudah memberi consent.
- Lead Ads butuh Meta App dengan izin `leads_retrieval`, biasanya perlu verifikasi bisnis dan App Review yang bisa berminggu-minggu.
- Worker outbox di Vercel Hobby punya batas durasi fungsi. Batch dibatasi dan dilanjutkan di panggilan berikutnya.

## Data dari owner
- Pixel ID, dataset ID, token akses, App Secret, status verifikasi Meta Business.
