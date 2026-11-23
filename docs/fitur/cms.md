# Panel CMS (cms.kisgroup.co.id)

## Tujuan
Tim konten mengelola semua isi website dan landing page tanpa coding. Perubahan langsung tampil ke pengunjung berikutnya.

## Keputusan owner
- 21 November 2026: CMS terpisah di `cms.kisgroup.co.id` (route `src/app/cms/`, env `CMS_HOST`). Hanya akun role `cms` yang bisa masuk. Akun CMS tidak bisa masuk portal, owner dan karyawan tidak bisa masuk CMS.
- 21 November 2026: halaman masuk CMS mengikuti gaya aplikasi portal.
- 23 November 2026: tampilan dan font CMS sama dengan PWA (Work Sans, pastel, rel kiri, bottom bar).
- Semua isian gambar memakai unggahan file yang dikompres di browser, bukan menempel tautan.

## Cakupan
- [x] Login, lupa password, halaman ditolak untuk akun bukan CMS
- [x] Ringkasan
- [x] Berita: tulis bersampul, blok konten, terbitkan, ubah, hapus
- [x] Lowongan: tambah, ubah, hapus, jenjang
- [x] Tampilan bergaya PWA
- [x] Halaman 404 dan error bergaya aplikasi, di dalam shell CMS
- [ ] Banner beranda (desktop dan HP, jadwal tayang, urutan)
- [ ] Promo (periode, syarat, gambar)
- [ ] Proyek dan tipe unit: deskripsi, galeri, fasilitas, lokasi sekitar, spesifikasi, legalitas
- [ ] Progres pembangunan (bisa diisi dari laporan lapangan yang disetujui, lihat [konstruksi.md](konstruksi.md))
- [ ] FAQ per proyek dan umum
- [ ] Testimoni konsumen (hanya data asli, dengan izin)
- [ ] Pengaturan situs: kontak, email, WhatsApp, alamat, media sosial (`site_settings`, override `src/config/site.ts`)
- [ ] Media library dengan kompresi
- [ ] Landing page builder (lihat [landing-page.md](landing-page.md))
- [ ] Knowledge base Jaka (lihat [chat-jaka.md](chat-jaka.md))
- [ ] Lamaran kerja: daftar, status (baru, diproses, wawancara, diterima, ditolak), unduh CV, terhubung ke rekrutmen di [hr.md](hr.md)
- [ ] Riwayat perubahan dan pemulihan versi konten
- [ ] Penjadwalan terbit dan pratinjau sebelum terbit

## Test
E2E di `e2e/cms/`: setiap jenis konten langsung tampil di website setelah terbit.

## Risiko teknis
- Editor rich text (kandidat Tiptap), seret dan lepas (kandidat dnd-kit), dan crop gambar butuh persetujuan dependency.
- Revalidasi tag harus tepat. Konten yang salah tag tidak muncul sampai deploy berikutnya.
- Siteplan SVG perlu digambar ulang kalau owner hanya punya PDF atau gambar.
