# Brand KIS Group

Palet dikunci di Fase 0 (19 November 2026). Setelah ini tidak ada warna hardcode di komponen. Semua warna lewat token Tailwind `@theme` yang ditulis di Fase 1 dari dokumen ini.

## Sumber

- Logo: `public/brand/logo-kis.png` (PNG transparan, 966 x 572 px). Dibuat dari logo asli berlatar hitam.
- Logo latar gelap: `public/brand/logo-kis-light.png`. Bagian hijau (atap dan tulisan GROUP) diganti putih, emas tetap. Dipakai di footer tanpa kotak putih (keputusan owner, 20 November 2026).
- Warna diukur dari median pixel solid logo asli, bukan ditebak:

| Warna logo | Hex | OKLCH | Porsi area logo |
|---|---|---|---|
| Emas (huruf KIS) | `#D7AE5F` | `oklch(0.772 0.109 82.3)` | 81% |
| Hijau (atap dan tulisan GROUP) | `#0F6D5F` | `oklch(0.481 0.084 179.3)` | 19% |

## Peran warna

| Peran | Warna | Step warna logo | Alasan |
|---|---|---|---|
| `primary` | Hijau | 700 | Lolos kontras sebagai teks (6.23:1) dan sebagai latar tombol berteks putih |
| `accent` | Emas | 400 | Warna paling dominan di logo, tapi hanya 2.08:1 di latar putih. Dipakai untuk CTA berteks gelap, garis aksen, dan highlight |
| `neutral` | Abu dengan tint hijau (hue 179.3, chroma 0.008 sampai 0.012) | | Menyatu dengan primary |

Aturan CLAUDE.md bagian 6 menyebut primary = warna paling dominan. Owner menyetujui pengecualian ini di Fase 0 karena emas gagal kontras di latar putih. Logo hanya punya dua warna, jadi tidak ada peran `secondary` terpisah.

## Skala (hex)

Dibuat di ruang OKLCH. Lightness per step tetap, hue tetap (emas bergeser ke arah cokelat di step gelap, dari 82.3 ke 69.8, supaya tidak jadi hijau zaitun), chroma menurun ke ujung terang dan gelap, lalu dipotong ke gamut sRGB.

| Step | primary | accent | neutral | success | warning | danger | info |
|---|---|---|---|---|---|---|---|
| 50 | `#EBFBF7` | `#FFF6E6` | `#F1F9F7` | `#E7FEEB` | `#FFF5EC` | `#FFF4F3` | `#F1F8FE` |
| 100 | `#DEF2ED` | `#FFEAC5` | `#E7EFED` | `#DDF4E1` | `#FFE8D4` | `#FFE6E3` | `#E0EFFE` |
| 200 | `#C5E0D9` | `#F6D495` | `#D4DBD9` | `#B2E9BC` | `#FFCFA2` | `#FFCBC4` | `#BDDDFF` |
| 300 | `#A8CBC3` | `#E3BD74` | `#BDC4C2` | `#9CD2A6` | `#EBB784` | `#FFA89E` | `#9CC7F4` |
| 400 | `#88B4AA` | **`#D7AE5F`** | `#A4ABA9` | `#60C279` | `#E9932D` | `#FF7C70` | `#65AEF8` |
| 500 | `#679D92` | `#B08A46` | `#8C9291` | `#45A861` | `#CC7B04` | `#EE554C` | `#4C95DD` |
| 600 | `#408477` | `#936F34` | `#717776` | `#238C47` | `#A76402` | `#CE3631` | `#2F79BF` |
| 700 | **`#0F6D5F`** | `#785724` | `#57605E` | `#007132` | `#864F02` | `#B00C15` | `#0C60A3` |
| 800 | `#015449` | `#5F4114` | `#414A48` | `#005725` | `#683C01` | `#8B000B` | `#004981` |
| 900 | `#013C34` | `#472C05` | `#2D3533` | `#003F18` | `#4B2A01` | `#650006` | `#01345E` |
| 950 | `#002922` | `#321C00` | `#1C2422` | `#012A0E` | `#341B00` | `#470103` | `#002241` |

Cetak tebal = warna asli logo.

## Skala (OKLCH: L C H)

| Step | primary | accent | neutral | success | warning | danger | info |
|---|---|---|---|---|---|---|---|
| 50 | 0.975 0.018 179.3 | 0.975 0.023 82.3 | 0.975 0.008 179.3 | 0.975 0.035 150.0 | 0.975 0.016 65.0 | 0.975 0.011 27.0 | 0.975 0.011 250.0 |
| 100 | 0.945 0.022 179.3 | 0.945 0.054 82.3 | 0.945 0.008 179.3 | 0.945 0.035 150.0 | 0.945 0.036 65.0 | 0.945 0.027 27.0 | 0.945 0.026 250.0 |
| 200 | 0.885 0.030 179.3 | 0.885 0.089 82.3 | 0.885 0.008 179.3 | 0.885 0.084 150.0 | 0.885 0.080 65.0 | 0.885 0.060 27.0 | 0.885 0.058 250.0 |
| 300 | 0.815 0.039 179.3 | 0.815 0.101 82.3 | 0.815 0.008 179.3 | 0.815 0.084 150.0 | 0.815 0.090 65.0 | 0.815 0.104 27.0 | 0.815 0.078 250.0 |
| 400 | 0.735 0.050 179.3 | 0.772 0.109 82.3 | 0.735 0.008 179.3 | 0.735 0.140 150.0 | 0.735 0.150 65.0 | 0.735 0.162 27.0 | 0.735 0.130 250.0 |
| 500 | 0.655 0.060 179.3 | 0.655 0.097 79.5 | 0.655 0.008 179.3 | 0.655 0.140 150.0 | 0.655 0.146 65.0 | 0.655 0.190 27.0 | 0.655 0.130 250.0 |
| 600 | 0.565 0.072 179.3 | 0.565 0.089 77.4 | 0.565 0.008 179.3 | 0.565 0.140 150.0 | 0.565 0.126 65.0 | 0.565 0.190 27.0 | 0.565 0.130 250.0 |
| 700 | 0.481 0.084 179.3 | 0.480 0.080 75.3 | 0.480 0.012 179.3 | 0.480 0.132 150.0 | 0.480 0.107 65.0 | 0.480 0.190 27.0 | 0.480 0.130 250.0 |
| 800 | 0.400 0.073 179.3 | 0.400 0.072 73.4 | 0.400 0.012 179.3 | 0.400 0.110 150.0 | 0.400 0.089 65.0 | 0.400 0.163 27.0 | 0.400 0.113 250.0 |
| 900 | 0.320 0.058 179.3 | 0.320 0.065 71.5 | 0.320 0.012 179.3 | 0.320 0.088 150.0 | 0.320 0.071 65.0 | 0.320 0.130 27.0 | 0.320 0.090 250.0 |
| 950 | 0.250 0.045 179.3 | 0.250 0.054 69.8 | 0.250 0.012 179.3 | 0.250 0.068 150.0 | 0.250 0.056 65.0 | 0.250 0.101 27.0 | 0.250 0.070 250.0 |

Hue semantik: success 150 (hijau murni, beda dari hijau brand 179), warning 65, danger 27, info 250.

## Token semantik

Komponen memakai token semantik, bukan step langsung. Di kode, skala emas bernama `gold-*` dan token semantik CTA emas bernama `highlight`, karena `accent` di shadcn berarti latar hover netral. Palet bawaan Tailwind dimatikan di `globals.css`. Token ditulis dalam hex supaya warna logo tepat, nilai OKLCH ada di komentar. Website publik hanya mode terang. Portal mendukung terang dan gelap.

| Token | Terang | Gelap (portal) | Pemakaian |
|---|---|---|---|
| `background` | putih | neutral-950 | Latar halaman |
| `surface` | neutral-50 | neutral-900 | Kartu, section selang-seling |
| `foreground` | neutral-900 | neutral-50 | Teks utama |
| `muted-foreground` | neutral-600 (neutral-700 di atas `surface`) | neutral-400 | Teks sekunder, keterangan |
| `border` | neutral-200 | neutral-800 | Garis pemisah |
| `input-border` | neutral-500 | neutral-500 | Border field form |
| `primary` | primary-700 | primary-400 | Tombol utama, link, navigasi aktif |
| `primary-foreground` | putih | neutral-950 | Teks di atas `primary` |
| `primary-hover` | primary-800 | primary-300 | Hover tombol utama |
| `highlight` | gold-400 | gold-400 | CTA aksen, garis aksen, highlight |
| `highlight-foreground` | primary-950 | neutral-950 | Teks di atas `highlight` |
| `highlight-hover` | gold-300 | gold-300 | Hover CTA aksen |
| `highlight-text` | gold-700 | gold-400 | Teks berwarna emas (label, angka sorotan) |
| `accent` | neutral-100 | neutral-800 | Latar hover netral (konvensi shadcn), bukan emas |
| `ring` | primary-700 | primary-300 | Fokus keyboard |
| `footer` | primary-950, teks putih, aksen accent-400 | sama | Footer website |
| `success`, `warning`, `danger`, `info` (solid) | 700, 600, 600, 600 berteks putih | 400 berteks neutral-950 | Tombol dan toast |
| Badge semantik | 800 di 100 | 200 di 950 | Badge, status |

## Status unit

Status unit selalu tampil bersama label teks. Di siteplan, kavling terjual dan booking juga diberi pola arsir supaya tetap terbaca oleh pengguna buta warna dan saat dicetak hitam putih.

| Status | Warna | Badge terang | Isi kavling siteplan |
|---|---|---|---|
| Tersedia | success | success-800 di success-100 | success-400 |
| Hold | warning | warning-800 di warning-100 | warning-400 |
| Booking | info | info-800 di info-100 | info-400, arsir |
| Terjual | danger | danger-800 di danger-100 | danger-400, arsir |

## Kontras WCAG 2.2 AA

Dihitung dengan rumus luminans relatif WCAG dari nilai hex di atas. Minimum 4.5:1 untuk teks normal dan 3:1 untuk elemen non-teks.

| Pasangan | Rasio | Minimum | Hasil |
|---|---|---|---|
| Teks dan link primary-700 di putih | 6.23:1 | 4.5:1 teks | Lolos |
| Teks putih di tombol primary-700 | 6.23:1 | 4.5:1 teks | Lolos |
| Teks putih di tombol primary-800 (hover) | 8.88:1 | 4.5:1 teks | Lolos |
| Teks putih di primary-600 | 4.39:1 | 4.5:1 teks | Gagal |
| Emas logo (accent-400) di putih | 2.08:1 | 3.0:1 non-teks | Gagal |
| primary-950 di tombol accent-400 (CTA aksen) | 7.54:1 | 4.5:1 teks | Lolos |
| primary-950 di accent-300 (hover CTA aksen) | 8.80:1 | 4.5:1 teks | Lolos |
| Teks accent-700 di putih | 6.59:1 | 4.5:1 teks | Lolos |
| Teks neutral-900 di putih | 12.59:1 | 4.5:1 teks | Lolos |
| Teks neutral-900 di neutral-50 | 11.77:1 | 4.5:1 teks | Lolos |
| Teks sekunder neutral-600 di putih | 4.56:1 | 4.5:1 teks | Lolos |
| Teks sekunder neutral-600 di neutral-50 | 4.27:1 | 4.5:1 teks | Gagal |
| neutral-500 di putih | 3.16:1 | 3.0:1 non-teks (border input, ikon) | Lolos |
| Teks putih di primary-950 (footer) | 15.67:1 | 4.5:1 teks | Lolos |
| accent-400 di primary-950 (footer) | 7.54:1 | 4.5:1 teks | Lolos |
| Teks putih di success-600 | 4.27:1 | 4.5:1 teks | Gagal |
| Teks putih di success-700 | 6.16:1 | 4.5:1 teks | Lolos |
| Teks putih di warning-600 | 4.70:1 | 4.5:1 teks | Lolos |
| Teks putih di danger-600 | 5.00:1 | 4.5:1 teks | Lolos |
| Teks putih di info-600 | 4.56:1 | 4.5:1 teks | Lolos |
| Badge success: success-800 di success-100 | 7.57:1 | 4.5:1 teks | Lolos |
| Badge warning: warning-800 di warning-100 | 7.94:1 | 4.5:1 teks | Lolos |
| Badge danger: danger-800 di danger-100 | 8.41:1 | 4.5:1 teks | Lolos |
| Badge info: info-800 di info-100 | 7.91:1 | 4.5:1 teks | Lolos |
| [gelap] neutral-50 di neutral-950 | 14.82:1 | 4.5:1 teks | Lolos |
| [gelap] neutral-400 di neutral-950 | 6.78:1 | 4.5:1 teks | Lolos |
| [gelap] neutral-400 di neutral-900 (kartu) | 5.38:1 | 4.5:1 teks | Lolos |
| [gelap] primary-300 di neutral-950 | 9.05:1 | 4.5:1 teks | Lolos |
| [gelap] neutral-950 di tombol primary-400 | 6.91:1 | 4.5:1 teks | Lolos |
| [gelap] accent-400 di neutral-950 | 7.63:1 | 4.5:1 teks | Lolos |
| [gelap] badge success: success-200 di success-950 | 11.41:1 | 4.5:1 teks | Lolos |
| [gelap] badge warning: warning-200 di warning-950 | 11.28:1 | 4.5:1 teks | Lolos |
| [gelap] badge danger: danger-200 di danger-950 | 11.46:1 | 4.5:1 teks | Lolos |
| [gelap] badge info: info-200 di info-950 | 11.45:1 | 4.5:1 teks | Lolos |

Pasangan yang gagal tidak boleh dipakai. Token di atas sudah menghindarinya:
- Hover tombol primary memakai primary-800, bukan primary-600.
- Emas logo tidak pernah jadi warna teks atau ikon informatif di latar terang. Teks emas memakai accent-700.
- Teks sekunder di atas `surface` (neutral-50) memakai neutral-700.
- Tombol success memakai success-700.

## Pemakaian

- Foto proyek adalah elemen utama. Warna brand mendukung, tidak menutupi foto.
- Emas dipakai hemat: satu CTA aksen per layar, garis aksen pendek di bawah judul section, angka sorotan di strip statistik.
- Latar gelap website (hero overlay, footer) memakai primary-950. Di atasnya teks putih dan aksen emas.
- Logo di latar terang dan gelap memakai `logo-kis.png` yang sama. Ruang kosong di sekitar logo minimal setinggi huruf "G" pada tulisan GROUP. Lebar minimal 96 px di layar.
- Font: Plus Jakarta Sans untuk heading dan body. Angka di tabel dan dashboard memakai `tabular-nums`.
- Radius 4 sampai 8 px, bayangan tipis, tanpa gradien neon dan glassmorphism (CLAUDE.md bagian 6).

## Foto stok (keputusan owner, 20 November 2026)

Foto proyek tetap foto atau render asli. Untuk bagian yang tidak menggambarkan proyek (banner konsultasi, banner simulasi KPR, halaman karir, ilustrasi berita), owner mengizinkan foto stok orang, bukan foto rumah. Hanya dari sumber berlisensi bebas pakai komersial (Unsplash License), dipotong dan dikompres ke WebP sebelum di-commit. Alt text menyebut "Foto ilustrasi" supaya tidak terbaca sebagai konsumen atau karyawan KIS.

| File | Sumber | Fotografer | Catatan |
|---|---|---|---|
| `public/images/banners/konsultasi-*.webp` | images.unsplash.com/photo-1672917187338-7f81ecac3d3f | Edi Kurniawan | Dipotong 16:9 dan potret |
| `public/images/banners/kerja-laptop-*.webp` | images.unsplash.com/photo-1681569685386-b7bda397672e | phyo min | Dibalik horizontal supaya orangnya di kanan, tidak tertutup teks |

## Peta footer

`public/images/map/indonesia-dots.svg`: titik-titik daratan Indonesia dari Natural Earth 1:50m (domain publik), proyeksi equirectangular, lon 94,6 sampai 141,2, lat 6,2 sampai -11,2, jarak titik 0,42 derajat. Penanda kantor (Bekasi, 6,21 LS 107,00 BT) diletakkan di 26,62% dari kiri dan 71,37% dari atas (`src/components/site/office-map.tsx`). Kalau kantor pindah kota, hitung ulang dengan rumus yang sama.

### Foto stok berita dan karir (20 November 2026)

Semua dari Unsplash (Unsplash License), dipotong 16:9 (berita, 1600 x 900) atau 4:5 (kartu karir, 800 x 1000) dan dikompres ke WebP.

| File | Foto Unsplash | Fotografer |
|---|---|---|
| `berita/ppn-dtp-rumah-2026.webp` | photo-1783227610917-4b075d028693 | Defrino Maasy |
| `berita/stasiun-bekasi-ekstensi.webp` | photo-1729974250139-8c389c3f2db4 | Gema Saputera |
| `berita/bi-rate-cicilan-kpr.webp` | photo-1725258080098-727051947997 | Jakub Żerdzicki |
| `berita/kpr-flpp-2026.webp` | photo-1759428679273-11d914866394 | Jakub Żerdzicki |
| `berita/program-3-juta-rumah.webp` | photo-1665631153876-af6209034d41 | nanang adi |
| `berita/kredit-properti-2026.webp` | photo-1770345743231-e17c1489435e | William Firmansyah |
| `berita/biaya-membeli-rumah.webp` | photo-1758518731462-d091b0b4ed0d | Vitaly Gariev |
| `berita/kpr-syariah-konvensional.webp` | photo-1681505531034-8d67054e07f6 | Amina Atar |
| `berita/daftar-cek-survei-rumah.webp` | photo-1754548930574-6a995e5eb5a7 | Jakub Żerdzicki |
| `berita/mengenal-tambun-selatan.webp` | photo-1610524370692-f33fba2afad8 | Eko Purwanto |
| `karir/berpengalaman.webp` | photo-1758691737083-0e7fdbde0f05 | Vitaly Gariev |
| `karir/lulusan-baru.webp` | photo-1531498352491-042fbae4cf57 | Mimi Thian |
| `karir/lapangan.webp` | photo-1628146023674-ede6049609b1 | Mufid Majnun |
| `karir/magang.webp` | photo-1531537571171-a707bf2683da | Mimi Thian |

Gambar proyek sold out (`projects/sejahtera-residence-*/`) diambil dari Company Profile PT KISG 2024 (milik KIS). Resolusinya kecil (410 sampai 576 px), jadi diganti foto asli beresolusi tinggi kalau owner punya.
