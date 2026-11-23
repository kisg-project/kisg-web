# Website publik (kisgroup.co.id)

## Tujuan
Profil perusahaan dan etalase proyek yang mengubah pengunjung menjadi lead di CRM.

## Keputusan owner
- 20 November 2026: semua proyek KIS tampil. Sejahtera Green Village proyek unggulan, proyek lama tampil sebagai portofolio "Sold out" tanpa form lead.
- 20 November 2026: foto stok orang boleh untuk bagian yang tidak menggambarkan proyek (banner konsultasi, karir, ilustrasi berita).
- 21 November 2026: gaya corporate, clean, playful, friendly. Kartu 20px, foto 28px, panel 40px, tombol pil. Hero beranda terang tanpa garis atap.
- 22 November 2026: harga ringkas "Rp 570 jutaan" di judul, hero, kartu, dan brosur. Harga lengkap di detail unit, simulasi KPR, dan JSON-LD.
- 22 November 2026: brosur PDF diunduh setelah form brosur.
- Fase 3: banyak gerak halus, scrollbar minimalis, dropdown custom.
- Detail aturan tampilan, SEO, dan responsif ada di `CLAUDE.md` bagian 6.

## Cakupan
Halaman
- [x] Beranda: hero carousel, strip statistik, proyek, berita, promo, CTA, footer dengan peta titik
- [x] Tentang, kontak, kebijakan privasi, syarat ketentuan
- [x] Daftar dan detail proyek: galeri, sorotan tipe unit, fasilitas, lokasi sekitar, progres pembangunan, FAQ
- [x] Proyek sold out sebagai portofolio dengan ajakan ke proyek tersedia
- [x] Berita dan detail berita (10 artikel bersumber)
- [x] Promo dan detail promo
- [x] Karir per jenjang, detail lowongan, form lamaran dengan unggah CV
- [x] Simulasi KPR dengan PDF berkop
- [x] Brosur lewat form singkat
- [x] Halaman verifikasi dokumen `/verifikasi/[kode]` (noindex)
- [x] Halaman 404 dan error bergaya website (motif garis atap, tautan cepat, WhatsApp), `global-error` bergaya KIS
- [ ] Siteplan interaktif: klik kavling untuk melihat tipe, status, dan harga (data dari [produk-kavling.md](produk-kavling.md))
- [ ] Daftar unit tersedia per proyek dengan filter tipe dan harga
- [ ] Halaman testimoni konsumen asli (hanya data asli)
- [ ] Halaman cara beli dan dokumen KPR (penjelasan singkat istilah KPR, SHM, PBG)

Form dan lead
- [x] Form minat, kontak, dan brosur dengan Zod, honeypot, rate limit, persetujuan PDP
- [x] Pelacakan UTM, `fbclid`, `fbp`, `fbc`
- [ ] Turnstile aktif di production (kunci sudah ada di akun, cek pengaturan env)
- [ ] Jadwal survei langsung dari halaman proyek (masuk ke CRM sebagai janji survei)

SEO dan kualitas
- [x] Metadata, canonical, Open Graph, gambar share `/og`, JSON-LD, sitemap, robots
- [x] Responsif 320 sampai 1440 px, axe di E2E
- [ ] Lighthouse 95+ dan visual regression otomatis lewat `preview.yml` (preview Vercel otomatis sedang dimatikan, lihat [infrastruktur.md](infrastruktur.md))

## Data
`projects`, `project_media`, `unit_types`, `units`, `facilities`, `nearby_places`, `construction_updates`, `faqs`, `posts`, `promos`, `banners`, `careers`, `job_applications`, `leads`, `form_submissions`, `utm_touchpoints`, `site_settings`. Detail di [`../data-model.md`](../data-model.md).

## Test
E2E di `e2e/site/`. Daftar skenario di [`../e2e-coverage.md`](../e2e-coverage.md) bagian website.

## Risiko teknis
- Lighthouse 95 mobile dengan hero carousel: slide pertama sebagai LCP, slide berikutnya lazy, tanpa library carousel.
- Turnstile dan CSP: domain Cloudflare masuk CSP tanpa melonggarkan aturan lain.

## Data dari owner
- Denah, harga tipe 36 dan 73, daftar bank mitra, logo BSN, foto asli proyek lama, testimoni asli. Detail di [`../TODO-DATA.md`](../TODO-DATA.md).
