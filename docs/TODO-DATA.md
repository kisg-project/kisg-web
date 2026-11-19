# Data yang dibutuhkan dari owner

Data yang belum ada tampil sebagai placeholder `[...]` di website, tidak dikarang. Kolom "Dibutuhkan di" menunjukkan fase paling lambat data itu harus ada supaya fase tersebut bisa selesai tanpa placeholder.

Cara kirim: tempel di chat, atau taruh file di folder Downloads lalu kabari nama file atau foldernya. Foto dikirim versi asli (resolusi penuh). Kompresi dilakukan sistem.

## 1. Profil dan kontak (tampil di website)

| Data | Nilai | Status | Dibutuhkan di |
|---|---|---|---|
| Nama badan usaha | PT Kreatif Inovatif Sejahtera Group | Ada | |
| Alamat kantor | Ruko D'Smart, Jl. Telaga Mas No. 55 Blok H, RT 012/RW 014, Harapan Baru, Bekasi Utara, Kota Bekasi, Jawa Barat 17123 | Ada | |
| Kontak | WhatsApp marketing `+62 896-7329-6881` saja | Ada | |
| Instagram | `@kreatifsejahteraproject` | Ada | |
| Jam operasional kantor | | Perlu | Fase 3 |
| Titik Google Maps kantor | | Perlu (link share atau koordinat) | Fase 3 |
| Profil singkat perusahaan (tahun berdiri, sejarah singkat) | | Perlu | Fase 3 |
| Visi dan misi | | Perlu | Fase 3 |
| Statistik beranda (jumlah proyek, unit terjual, keluarga penghuni, tahun berdiri) | | Perlu, angka asli saja. Kalau tidak ada, strip statistik disembunyikan | Fase 3 |
| Foto kantor dan tim (opsional) | | Perlu | Fase 3 |

## 2. Legalitas perusahaan (arsip internal, tidak tampil di website)

Sumber: NIB yang diterbitkan OSS, 16 Januari 2023. Atas keputusan owner, NIB, telepon, dan email di NIB tidak ditampilkan di website.

| Data | Nilai | Status |
|---|---|---|
| NIB | 1601230065146 | Ada |
| Alamat terdaftar di NIB | Karangan Raya No. 15, Desa/Kelurahan Karanggan, Kec. Gunung Putri, Kab. Bogor, Jawa Barat 16960 | Ada |
| Status penanaman modal | PMDN | Ada |
| Skala usaha | Usaha Mikro | Ada |
| KBLI | Ada di lampiran NIB | Perlu lampiran NIB |
| Akta pendirian dan SK Kemenkumham | | Perlu, kalau mau ada halaman legalitas |
| Keanggotaan asosiasi (REI, APERSI, dsb) | | Perlu, kalau ada |

## 3. Data per proyek

Hanya Sejahtera Green Village yang ditampilkan di website (keputusan owner, Fase 1).

### Sudah diterima dari owner (19 November 2026)

| Data | Nilai |
|---|---|
| Alamat proyek | Jl. Garuda 3 No. NK-34, Blok H-21, RT 9/RW 14, Mangunjaya, Kec. Tambun Selatan, Kab. Bekasi, Jawa Barat 17510 |
| Tipe unit | Tipe 36/60: luas bangunan 36 m2, luas tanah 60 m2, 2 kamar tidur, 1 kamar mandi |
| Harga | Rp 571.250.000 |
| Harga sudah termasuk | Biaya notaris, cek sertifikat di BPN, balik nama sertifikat di BPN, pajak penjualan (SSP), IMB, PBB |
| Harga belum termasuk | Administrasi bank, biaya notaris bank, pajak pembelian (BPHTB), asuransi |
| Fasilitas unit | Carport, halaman belakang, smart door lock |
| Tempat sekitar (nama saja) | Stasiun Tambun, Tol Bekasi Timur, Bank Mandiri KCP Mangunjaya, Superindo dan area komersial Tambun |
| Foto | 7 gambar di Downloads `foto rumah` (3 mendatar, 4 tegak). Dipakai untuk Hero Banner |

### Masih dibutuhkan

| Data | Dibutuhkan di |
|---|---|
| Konfirmasi: "Panjang Penjualan / SSP" ditulis sebagai "Pajak penjualan (SSP)" | Fase 3 |
| Konfirmasi: 7 gambar di folder `foto rumah` adalah render resmi dari arsitek atau konsultan (CLAUDE.md melarang gambar hasil AI) | Fase 3 |
| Jarak atau waktu tempuh ke tiap tempat sekitar (contoh: 10 menit ke Stasiun Tambun) | Fase 3 |
| Titik Google Maps proyek (link share) | Fase 3 |
| Tahun mulai pembangunan dan target serah terima | Fase 3 |
| Jumlah unit total | Fase 3 |
| Foto lapangan asli (gerbang, jalan lingkungan, progres) | Fase 3 |
| Deskripsi singkat proyek (2 sampai 3 kalimat fakta) | Fase 3 |
| Testimoni pembeli dengan izin tertulis (opsional) | Fase 3 |
| Spesifikasi teknis (pondasi, dinding, atap, lantai, kusen, listrik, air) dan denah | Fase 3 |
| Legalitas proyek: status SHM/SHGB, PBG, nomor izin yang boleh ditampilkan | Fase 3 |
| Fasilitas lingkungan (taman, musala, keamanan, dsb) | Fase 3 |
| Brosur PDF | Fase 3 |
| Siteplan (SVG, atau PDF/gambar resolusi tinggi untuk digambar ulang) dan daftar kavling (blok, nomor, luas, hook, status) | Fase 4 |
| Radius geofence absensi dan titik pusat lokasi proyek | Fase 8 |
| Radius geofence absensi kantor | Fase 8 |

### KPR dan bank rekanan

Produk di `/simulasi-kpr` ada di `src/config/kpr-products.ts`, masing-masing dengan sumber dan tanggal akses (19 November 2026). Semua angka bisa diubah pengunjung. Mohon dikonfirmasi ke bank rekanan:

| Data | Status | Dibutuhkan di |
|---|---|---|
| Bank yang resmi bekerja sama dengan KIS: BTN, Mandiri, BSI, BSN (dulu BTN Syariah) | Perlu konfirmasi | Fase 3 |
| Mandiri KPR Bunga Spesial (Fixed 3 tahun 2,76%, Fixed 5 tahun 3,50%, Berjenjang 10 tahun 4,06% lalu 8,76% lalu 9,76%), kategori Gold Selected KPR Primary, berlaku s.d. 30 November 2026 | Dari situs resmi Mandiri. Perlu kategori nasabah yang berlaku untuk pembeli KIS dan tenor maksimal | Sebelum 30 November 2026 |
| BTN Fixed 3 tahun 2,65% | Dari pemberitaan (Kontan). Perlu konfirmasi angka, tenor, DP minimal | Fase 3 |
| BSI KPR Sejahtera margin 5% tetap sampai lunas | Dari pemberitaan (Kontan). Perlu konfirmasi produk dan syaratnya | Fase 3 |
| BSN margin 3,65% tetap 1 tahun | Dari pemberitaan (Kontan). Perlu margin setelah tahun pertama | Fase 3 |
| Logo BSN | Belum ada. Kirim file logo resmi dari bank, atau saya coba unduh ulang dari Wikimedia | Fase 3 |
| Asumsi bunga floating setelah masa fixed (sekarang 11%) dan margin setelah periode tetap syariah (sekarang 10%) | Asumsi, perlu acuan dari bank | Fase 3 |
| NPOPTKP Kabupaten Bekasi untuk BPHTB (sekarang Rp 80.000.000, batas minimal UU HKPD) | Perlu angka perda | Fase 3 |
| Perkiraan biaya bank, notaris bank, dan asuransi (sekarang 3% dari pokok) | Asumsi, perlu angka dari bank rekanan | Fase 3 |

## 4. Konten website

| Data | Dibutuhkan di |
|---|---|
| Foto Hero Banner beranda (penuh satu layar). Versi desktop mendatar minimal 2560 x 1440 px, versi HP tegak minimal 1080 x 1920 px. Owner menaruhnya di folder Downloads, lalu sistem mengompres dan mengunggahnya | Fase 3 |
| Berita awal (minimal 3, boleh dari postingan Instagram) | Fase 3 |
| Promo aktif: judul, isi, syarat, masa berlaku | Fase 3 |
| FAQ: pertanyaan yang paling sering ditanyakan calon pembeli, beserta jawabannya | Fase 3 |
| Lowongan kerja yang sedang dibuka | Fase 3 |
| Kebijakan privasi dan syarat ketentuan: draf disiapkan sistem, ditinjau owner atau konsultan hukum | Fase 3 |

## 5. Organisasi dan pengguna portal

| Data | Dibutuhkan di |
|---|---|
| Daftar karyawan yang memakai portal: nama, email, nomor HP, role (owner, admin, marketing_manager, marketing, site_manager, site_supervisor, finance) | Fase 2 |
| Struktur tim marketing: manager dan anggotanya | Fase 6 |
| Penugasan tim lapangan per proyek | Fase 8 |
| Aturan pembagian lead: semua marketing bergilir, atau per proyek | Fase 6 |
| Batas waktu respons pertama lead (SLA) dan ke siapa eskalasinya | Fase 6 |
| Lama hold unit sebelum otomatis kembali tersedia | Fase 6 |
| Jam kerja customer service (untuk handoff chat) | Fase 7 |

## 6. Pembangunan dan KPI

| Data | Dibutuhkan di |
|---|---|
| Daftar item pekerjaan pembangunan per tipe unit (WBS) beserta bobotnya, misal pondasi 10%, struktur 25% | Fase 8 |
| Jadwal rencana pembangunan per unit atau per blok | Fase 8 |
| Daftar material yang dicatat dan satuannya | Fase 8 |
| Daftar keahlian tukang (tukang batu, kayu, besi, listrik, cat, dsb) | Fase 8 |
| KPI marketing: indikator, bobot, target bulanan | Fase 8 |
| KPI lapangan: indikator, bobot, target | Fase 8 |
| Jam masuk dan pulang kerja, toleransi keterlambatan | Fase 8 |

## 7. Akun dan kunci layanan

Kunci rahasia tidak pernah ditempel di chat. Owner mengisinya langsung di Vercel, repository secret GitHub, atau `~/.config/kis/accounts.env`.

| Layanan | Yang dibutuhkan | Status | Dibutuhkan di |
|---|---|---|---|
| GitHub | Akun `kisg-project`, repo `kisg-web` | Ada | |
| Supabase | Production `skxawyvopumzrefnmvyf`, staging `zpxdkjmwsjeeeypszwzm` | Ada | |
| Supabase | Password database production (owner yang memegang) | Perlu untuk secret CI | Fase 2 |
| Vercel | Akun `kisg-project`, project belum dibuat | Sebagian | Fase 1 |
| Domain | Akses DNS `kisgroup.co.id` (siapa registrar-nya) | Perlu | Fase 9 |
| Sentry | Organisasi dan project, `SENTRY_AUTH_TOKEN` | Perlu | Fase 1 |
| Resend | Akun, domain pengirim terverifikasi (DNS), API key | Perlu | Fase 2 |
| Cloudflare Turnstile | Site key dan secret key | Perlu | Fase 3 |
| Meta Business | Business Manager, Pixel/dataset ID, token Conversions API, Facebook Page | Perlu | Fase 5 |
| Meta Business | Status verifikasi bisnis. Cara cek: business.facebook.com, Pengaturan Bisnis, Pusat Keamanan, bagian "Verifikasi bisnis". Kalau belum, mulai verifikasi dengan dokumen NIB | Perlu dicek | Sebelum Fase 5 |
| Meta App | App ID, App Secret, akses `leads_retrieval`, verify token webhook | Perlu | Fase 6 |
| Google Gemini | `GEMINI_API_KEY` | Perlu | Fase 7 (sebelum itu pakai mock) |
| Web Push | Kunci VAPID (dibuat sistem) | Dibuat otomatis | Fase 8 |
