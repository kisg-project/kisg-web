# Cakupan E2E

Definisi selesai setiap fase: semua skenario fase itu berstatus **Lolos di CI**. Status diperbarui di akhir setiap fase. Semua E2E jalan di CI (production build, Supabase lokal di runner, layanan eksternal di-mock). Tidak ada E2E di laptop.

Status: `Belum` (belum ditulis), `Ditulis` (ada spec, belum hijau di CI), `Lolos` (hijau di CI).

Profil browser: Chromium desktop (D), Mobile Chrome Pixel (MC), Mobile Safari iPhone (MS). Kolom "Profil" menyebut profil wajib. Portal wajib lolos di MC dan MS.

Berlaku untuk setiap halaman, tidak ditulis ulang per baris:
- tanpa error console dan tanpa pelanggaran axe
- punya state loading, error, dan kosong
- responsif: tanpa scroll horizontal di lebar 320, 375, 768, 1024, dan 1440px, dan elemen utama terlihat (helper `expectResponsive()`, CLAUDE.md bagian 6)

## 1. Matriks akses per role

Setiap sel diuji dua arah: lewat URL langsung (halaman) dan lewat pemanggilan server action. "Tolak" berarti redirect ke halaman yang sesuai atau pesan "tidak punya akses", dan server action mengembalikan error tanpa mengubah data.

| Area | anon | owner | admin | marketing_manager | marketing | site_manager | site_supervisor | finance |
|---|---|---|---|---|---|---|---|---|
| Website `/` dan `/lp/*` | Boleh | Boleh | Boleh | Boleh | Boleh | Boleh | Boleh | Boleh |
| `/portal` (beranda) | Tolak, ke login | Boleh | Boleh | Boleh | Boleh | Boleh | Boleh | Boleh |
| `/portal/admin/*` | Tolak | Boleh | Boleh | Tolak | Tolak | Tolak | Tolak | Tolak |
| `/portal/owner/*` | Tolak | Boleh | Baca | Tolak | Tolak | Tolak | Tolak | Tolak |
| `/portal/crm/*` | Tolak | Semua lead | Semua lead | Lead tim | Lead sendiri | Tolak | Tolak | Booking saja |
| `/portal/crm/inbox` | Tolak | Boleh | Boleh | Boleh | Boleh | Tolak | Tolak | Tolak |
| `/portal/marketing/*` | Tolak | Boleh | Boleh | Tim | Sendiri | Tolak | Tolak | Tolak |
| `/portal/absensi` | Tolak | Rekap | Rekap | Absen + tinjau tim | Absen | Absen + tinjau proyek | Absen | Tolak |
| `/portal/lapangan/*` | Tolak | Boleh | Boleh | Tolak | Tolak | Proyek ditugaskan | Proyek ditugaskan | Tolak |
| `/portal/lapangan/persetujuan` | Tolak | Boleh | Boleh | Tolak | Tolak | Boleh | Tolak | Tolak |
| `/api/cron/*` tanpa `CRON_SECRET` | Tolak 401 | | | | | | | |
| `/api/webhooks/meta/leadgen` dengan signature salah | Tolak 401 | | | | | | | |

## 2. Skenario per area

### Fondasi dan beranda (`e2e/site/`, Fase 1)

Semua skenario jalan di ketiga profil (D, MC, MS) kecuali disebut lain.

| Skenario | Spec | Fase | Status |
|---|---|---|---|
| Hero Banner penuh satu layar tepat di bawah navbar, foto tampil, CTA WhatsApp menuju `wa.me/6289673296881` dengan pesan menyebut proyek | `home.spec.ts` | 1 | Lolos |
| Ringkasan Tipe 36/60: harga Rp 571.250.000, spesifikasi dengan ikon, fasilitas, tempat sekitar, rincian biaya termasuk dan belum termasuk | `home.spec.ts` | 1 | Lolos |
| Beranda tanpa pelanggaran axe dan tanpa scroll horizontal di lebar 320, 375, 768, 1024, 1440 px | `home.spec.ts` | 1 | Lolos |
| Menu HP (sheet) membuka navigasi dan menuju Simulasi KPR (MC, MS). Navigasi desktop tampil, tombol menu tersembunyi (D) | `home.spec.ts` | 1 | Lolos |
| Logo bank rekanan KPR (BTN, Mandiri, BSI) tampil dan termuat | `home.spec.ts` | 1 | Lolos |
| SEO: judul, `lang="id"`, canonical, meta description, Open Graph, satu `h1`, JSON-LD `RealEstateAgent` dan `RealEstateListing` dengan harga IDR | `home.spec.ts` | 1 | Lolos |
| `robots.txt` menutup `/portal` dan `/dev`, `sitemap.xml` tersedia | `home.spec.ts` | 1 | Lolos |
| Security headers (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy), tanpa `x-powered-by` | `headers-and-errors.spec.ts` | 1 | Lolos |
| Halaman yang tidak ada: status 404, `h1`, tautan ke beranda | `headers-and-errors.spec.ts` | 1 | Lolos |
| `/dev/ui`: token dan komponen tampil, `noindex`, tanpa pelanggaran axe, responsif | `dev-ui.spec.ts` | 1 | Lolos |
| `/dev/ui`: dialog tertutup dengan Escape, toast tampil | `dev-ui.spec.ts` | 1 | Lolos |
| Kompresi gambar: foto JPEG besar (4000 x 3000) menjadi di bawah 500 KB, sisi terpanjang maksimal 2048 px, WebP (atau JPEG di browser tanpa encoder WebP) | `image-compress.spec.ts` | 1 | Lolos |
| Kompresi gambar: orientasi EXIF diterapkan, EXIF dan GPS dibuang | `image-compress.spec.ts` | 1 | Lolos |
| Kompresi gambar: file bukan gambar ditolak dengan pesan jelas | `image-compress.spec.ts` | 1 | Lolos |

### Simulasi KPR (`e2e/site/simulasi-kpr.spec.ts`)

| Skenario | Spec | Fase | Status |
|---|---|---|---|
| Beranda: ringkasan "angsuran mulai" dari produk termurah dan tautan ke halaman simulasi | `home.spec.ts` | 1 | Ditulis |
| Konvensional: produk pertama terpilih, harga dan uang muka terisi, angsuran sesuai nilai acuan | `simulasi-kpr.spec.ts` | 1 | Ditulis |
| Tombol kartu produk mengisi form dengan produk itu | `simulasi-kpr.spec.ts` | 1 | Ditulis |
| Input nominal bertitik otomatis, uang muka persen dan rupiah saling terhubung, persen memakai koma | `simulasi-kpr.spec.ts` | 1 | Ditulis |
| Periode tetap bisa ditambah dan dihapus, total periode melebihi jangka waktu ditolak | `simulasi-kpr.spec.ts` | 1 | Ditulis |
| Syariah: istilah syariah (margin, angsuran, pembiayaan, harga jual bank), tanpa kata bunga, cicilan, pinjaman | `simulasi-kpr.spec.ts` | 1 | Ditulis |
| Unduh PDF: nama file, kop PT, judul, nomor halaman, angka angsuran | `simulasi-kpr.spec.ts` | 1 | Ditulis |
| Halaman simulasi lolos axe, responsif, canonical, dan bagian akad tampil | `simulasi-kpr.spec.ts` | 1 | Ditulis |

### Auth (`e2e/admin/auth`, Fase 2)

| Skenario | Profil | Fase | Status |
|---|---|---|---|
| Login berhasil per role (7 role) dan diarahkan ke beranda sesuai role | D, MC | 2 | Belum |
| Login gagal: password salah, akun nonaktif, email tidak terdaftar. Pesan benar, tanpa membocorkan akun mana yang ada | D | 2 | Belum |
| Lupa password sampai email terkirim (dibaca dari Mailpit Supabase lokal, isi email di-assert), lalu reset berhasil | D | 2 | Belum |
| Undangan user: link undangan, set password, login dengan role benar | D | 2 | Belum |
| Matriks akses bagian 1: setiap sel "Tolak" diuji lewat URL dan server action | D | 2, diperluas tiap fase | Belum |
| Logout membersihkan sesi, tombol back tidak membuka halaman portal | D, MS | 2 | Belum |
| Test RLS SQL: marketing tidak bisa baca lead orang lain, supervisor hanya proyek yang ditugaskan, anon hanya konten terbit | CI `db.yml` | 2 | Belum |

### Website (`e2e/site/`, Fase 3)

| Skenario | Profil | Fase | Status |
|---|---|---|---|
| Semua halaman publik render, link internal tidak ada yang 404 | D, MC, MS | 3 | Belum |
| Navigasi header, menu mobile (buka, tutup, fokus terjebak di menu), footer | D, MC | 3 | Belum |
| Hero carousel: autoplay, jeda, navigasi keyboard, `prefers-reduced-motion` menghentikan autoplay | D, MC | 3 | Belum |
| Detail Sejahtera Green Village menampilkan tipe unit, siteplan, form. Hanya proyek terbit yang tampil di menu dan sitemap. Menu "Proyek" langsung ke detail selama hanya ada satu proyek | D, MC | 3 | Belum |
| Slug proyek, berita, promo yang tidak ada menampilkan 404 | D | 3 | Belum |
| Siteplan: klik kavling menampilkan status sesuai database. Perubahan status di DB muncul tanpa reload (Realtime) | D, MC | 3 | Belum |
| Simulasi KPR: hasil cicilan sama dengan perhitungan anuitas yang di-assert. Input tidak valid ditolak dengan pesan per field | D, MC | 3 | Belum |
| Form minat, kontak, unduh brosur, lamaran karir: sukses (cek baris `leads`/`job_applications`, UTM, sumber, `form_submissions`) | D, MC | 3 | Belum |
| Form gagal: validasi, tanpa persetujuan PDP, honeypot terisi, rate limit, Turnstile gagal (mock), network error | D | 3 | Belum |
| Tombol WhatsApp: URL `wa.me/6289673296881` dengan pesan yang menyebut halaman/proyek asal | D, MC | 3 | Belum |
| `sitemap.xml`, `robots.txt`, metadata, Open Graph, JSON-LD tiap tipe halaman | D | 3 | Belum |
| Gambar dimuat lewat `next/image` dengan `sizes`, LCP hero diberi prioritas | D, MC | 3 | Belum |
| Visual regression beranda dan detail proyek | D, MC | 3 | Belum |

### Admin CMS (`e2e/admin/`, Fase 4)

| Skenario | Profil | Fase | Status |
|---|---|---|---|
| Untuk setiap jenis konten (proyek, media, tipe unit, unit, fasilitas, tempat terdekat, banner, berita, promo, testimoni, FAQ, karir): buat, ubah, terbitkan, batal terbit, hapus | D | 4 | Belum |
| Setelah terbit, halaman publik langsung menampilkan perubahan tanpa redeploy | D | 4 | Belum |
| Draft tidak tampil di publik. Jadwal tayang bekerja (waktu dimajukan di test) | D | 4 | Belum |
| Unggah gambar: file valid dikompres dan diterima, tipe salah ditolak, file di atas batas server ditolak, alt text wajib | D, MC | 4 | Belum |
| Editor siteplan: petakan kavling ke elemen SVG, ubah status unit, cek di halaman publik | D | 4 | Belum |
| Rich text: input berisi script berbahaya tidak tereksekusi di halaman publik | D | 4 | Belum |
| Kelola user: undang, ubah role, nonaktifkan. User nonaktif tidak bisa login dan sesinya terputus | D | 4 | Belum |
| Setiap aksi admin tercatat di audit log dengan nilai sebelum dan sesudah. Filter audit log bekerja | D | 4 | Belum |
| PDP: ekspor data konsumen berhasil diunduh. Hapus data konsumen menghapus data pribadi dan file di storage | D | 4 | Belum |
| Testimoni tanpa persetujuan tidak bisa diterbitkan | D | 4 | Belum |

### Landing page dan Meta browser (`e2e/landing/`, `e2e/meta/`, Fase 5)

| Skenario | Profil | Fase | Status |
|---|---|---|---|
| Buat LP di builder, terbitkan, buka `/lp/[slug]`, tampilan sesuai di desktop dan mobile | D, MC, MS | 5 | Belum |
| Kunjungan dengan UTM + `fbclid` sampai submit form: lead tersimpan dengan UTM, `fbc`, `fbp` benar | D, MC | 5 | Belum |
| Tanpa consent: Pixel tidak dimuat dan tidak ada request ke Meta. Dengan consent: event Pixel terkirim (request dicegat) | D | 5 | Belum |
| Event Pixel dan payload CAPI (mock) punya `event_id` sama, data pribadi ter-hash, tidak ada PII mentah | D | 5 | Belum |
| CAPI gagal (mock 500): submit tetap sukses, baris outbox `pending` | D | 5 | Belum |
| A/B variant: pembagian traffic sesuai bobot (sampel), pengunjung yang sama selalu melihat variant yang sama, variant tercatat di lead | D | 5 | Belum |
| Preview deployment mengirim `test_event_code` (unit/integration) | CI | 5 | Belum |
| Visual regression LP | D, MC | 5 | Belum |

### CRM (`e2e/crm/`, Fase 6)

| Skenario | Profil | Fase | Status |
|---|---|---|---|
| Lead dari website muncul di CRM marketing yang mendapat giliran, notifikasi in-app muncul | D, MC | 6 | Belum |
| Round-robin: 3 lead berurutan terbagi ke 3 marketing | D | 6 | Belum |
| Nomor HP sama dengan format berbeda (`0896...`, `+62896...`, `62896...`) digabung jadi satu lead | D | 6 | Belum |
| Drag kartu kanban mengubah tahap, riwayat tahap tercatat, baris outbox Conversion Leads terbentuk | D | 6 | Belum |
| Kanban versi mobile (pindah tahap lewat menu, bukan drag) | MC, MS | 6 | Belum |
| Marketing A tidak bisa melihat atau membuka lead marketing B (URL langsung juga). Manager melihat lead timnya | D | 6 | Belum |
| Dua user membooking unit yang sama bersamaan (dua context paralel): satu berhasil, satu mendapat pesan jelas | D | 6 | Belum |
| Hold unit kedaluwarsa kembali tersedia (fungsi expiry dipanggil di test) | D | 6 | Belum |
| Tombol Chat WA membuka `wa.me` yang benar dan aktivitas tercatat | D, MC | 6 | Belum |
| Dokumen konsumen: unggah ke bucket privat, dibuka lewat signed URL, marketing lain tidak bisa membuka | D | 6 | Belum |
| SLA: lead tanpa respons melewati batas memicu eskalasi ke manager | D | 6 | Belum |
| Laporan CRM menampilkan angka sesuai data seed (funnel, sumber, konversi, CPL dari biaya iklan) | D | 6 | Belum |
| Finance melihat daftar booking dan laporan penjualan, tetapi tidak bisa mengubah lead, tahap, atau unit (UI dan server action) | D | 6 | Belum |

### Meta server (`e2e/meta/`, Fase 6)

| Skenario | Profil | Fase | Status |
|---|---|---|---|
| Webhook GET verifikasi: token benar mengembalikan challenge, token salah ditolak | API | 6 | Belum |
| Webhook POST signature valid: lead masuk CRM (Graph API di-mock). Signature salah: 401. Kiriman ganda: tetap satu lead | API | 6 | Belum |
| Worker outbox dengan `CRON_SECRET`: payload ke Meta (mock) sesuai spesifikasi Conversion Leads | API | 6 | Belum |
| Worker: gagal lalu retry dengan backoff, setelah batas menjadi `dead`. Event lebih dari 7 hari menjadi `expired` | API | 6 | Belum |
| Tanpa `CRON_SECRET`: 401 | API | 6 | Belum |
| Admin integrasi Meta menampilkan event gagal dan tombol kirim ulang bekerja | D | 6 | Belum |

### Widget chat (`e2e/site/chat`, Fase 7, mock provider)

| Skenario | Profil | Fase | Status |
|---|---|---|---|
| Widget tidak dimuat sebelum halaman siap (chunk tidak diminta sebelum interaksi atau idle) | D, MC | 7 | Belum |
| Tanya jawab streaming tampil benar. Panel di desktop, layar penuh di mobile. Bisa dipakai dengan keyboard, pengumuman screen reader benar | D, MC, MS | 7 | Belum |
| Pertanyaan harga tipe tanpa harga dijawab tanpa angka dan menawarkan sambung ke marketing | D | 7 | Belum |
| `create_lead`: lead masuk CRM sumber chat, ditugaskan, outbox Meta terbentuk. Tanpa persetujuan PDP ditolak | D | 7 | Belum |
| Handoff jam kerja: marketing menerima di inbox portal, balasannya muncul di widget secara realtime | D | 7 | Belum |
| Handoff di luar jam kerja: tombol WhatsApp berisi ringkasan percakapan | D, MC | 7 | Belum |
| Provider error atau timeout: widget menampilkan WhatsApp dan form, tanpa pesan error teknis | D | 7 | Belum |
| Rate limit dan batas pesan bekerja. Pengunjung tidak bisa membaca sesi chat orang lain | D | 7 | Belum |
| Output model berisi dash panjang atau emoji tersaring sebelum tampil | D | 7 | Belum |
| Admin mengubah knowledge base lalu jawaban berikutnya memakai data baru | D | 7 | Belum |
| Satu tombol melayang (chat + WhatsApp), tidak ada dua tombol bertumpuk | D, MC | 7 | Belum |

### Lapangan (`e2e/lapangan/`, Fase 8)

| Skenario | Profil | Fase | Status |
|---|---|---|---|
| Absensi tim lapangan di lokasi proyek: di dalam geofence diterima (geolocation Playwright), di luar geofence ditolak dengan opsi alasan, selfie wajib | MC, MS | 8 | Belum |
| Absensi marketing di kantor diterima. Canvassing di luar radius tersimpan dengan alasan, lalu disetujui atau ditolak marketing_manager | MC, MS | 8 | Belum |
| Laporan harian lengkap dengan foto (`setInputFiles` foto besar): tersimpan, foto terkompresi di bawah target ada di bucket privat | MC, MS | 8 | Belum |
| Site manager menyetujui dan mengembalikan laporan. Supervisor melihat catatannya dan bisa mengedit laporan yang dikembalikan | MC | 8 | Belum |
| Progres yang disetujui dan dipilih tampil di halaman progres website | D | 8 | Belum |
| Supervisor tidak bisa membuka laporan proyek lain atau dashboard owner | MC | 8 | Belum |
| Kendala: buat, ubah prioritas, selesaikan | MC | 8 | Belum |

### PWA offline (`e2e/pwa/`, Fase 8)

| Skenario | Profil | Fase | Status |
|---|---|---|---|
| Manifest valid, service worker terdaftar, ikon maskable ada | MC | 8 | Belum |
| Halaman offline muncul saat tidak ada koneksi (`context.setOffline`) | MC, MS | 8 | Belum |
| Isi 2 laporan saat offline, reload, data masih ada di antrian | MC | 8 | Belum |
| Kembali online: keduanya terkirim tepat satu kali, status sinkron berubah | MC | 8 | Belum |
| Koneksi putus di tengah upload foto: tidak ada data ganda, upload dilanjutkan | MC | 8 | Belum |
| Konflik: laporan disetujui di server saat perubahan offline masih antre, client menampilkan status konflik | MC | 8 | Belum |
| Absensi offline tersimpan dengan `captured_at` asli dan terkirim saat online | MC | 8 | Belum |

### Marketing dan owner (`e2e/marketing/`, `e2e/owner/`, Fase 8)

| Skenario | Profil | Fase | Status |
|---|---|---|---|
| Aktivitas marketing dari CRM otomatis muncul di laporan marketing tanpa input ulang | MC | 8 | Belum |
| Target vs realisasi dan peringkat tim sesuai data seed | MC | 8 | Belum |
| Dashboard owner: angka sesuai seed, filter periode, drill-down sampai data mentah | D, MC | 8 | Belum |
| Ekspor Excel dan PDF berhasil diunduh dan isinya sesuai filter | D | 8 | Belum |
| Skor KPI dihitung sesuai definisi dan bobot (fungsi dipanggil di test) | D | 8 | Belum |
| Notifikasi push: subscribe berhasil, pemicu (lead baru, laporan ditolak) memanggil endpoint push (mock) | MC | 8 | Belum |

### Rilis (Fase 9)

| Skenario | Profil | Fase | Status |
|---|---|---|---|
| Audit: setiap route dan server action di kode tercakup minimal satu skenario di dokumen ini | CI skrip | 9 | Belum |
| Seluruh suite lolos 3 kali berturut-turut tanpa retry | CI | 9 | Belum |
| Smoke test ke URL staging setelah deploy | CI `preview.yml` | 9 | Belum |
| Bundle client tidak berisi secret (`GEMINI_API_KEY`, service role, token Meta) | CI skrip | 9 | Belum |
