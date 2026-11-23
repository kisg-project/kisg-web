# Platform PWA (KIS Operasional)

## Tujuan
Aplikasi kerja untuk semua role, terasa seperti aplikasi native, bisa dipasang di HP, realtime, dan tetap jalan saat sinyal buruk.

## Keputusan owner
- 20 November 2026: PWA pengganti Odoo dan Mekari, di `company.kisgroup.co.id` (`kisgroup.co.id/portal` 404).
- 22 November 2026: rombakan gaya aplikasi HR modern, pastel konsisten per modul, bottom bar di HP tanpa sidebar dan hamburger, rel kiri di desktop yang bisa dilebarkan dengan sakelar terang dan gelap, maskot, animasi memuat dan kosong bergaya garis. Detail di `CLAUDE.md` bagian 6.
- 22 November 2026: realtime di semua halaman portal (komponen LiveRefresh, publikasi `supabase_realtime`). Setiap tabel baru yang tampil di portal wajib masuk publikasi dan daftar LiveRefresh.
- 23 November 2026: sapaan header memakai emoji waktu di kanan nama, nama depan di HP.
- 23 November 2026: notifikasi lewat lonceng di header, push ke HP (Web Push, kunci VAPID sudah di env production), dan email untuk kejadian penting. Dikirim lewat `notify()` setelah respons.
- Tidak ada teks panjang di PWA. Satu tugas utama per layar, target sentuh minimal 44px.

## Cakupan
Tampilan dan navigasi
- [x] Shell: header lengket, rel kiri desktop, bottom bar HP, mode gelap, shortcut yang bisa diatur per akun
- [x] Pita judul per modul, kartu KPI, maskot, Lottie memuat dan kosong
- [x] Dialog `FormDialog` dan `ConfirmDialog` (lembar dari bawah di HP), toast custom
- [x] Bisa dipasang (manifest, service worker, halaman offline)
- [x] Fitur yang tidak boleh atau belum bisa dipakai tidak tampil di menu, shortcut, dan halaman Admin. Alamatnya menampilkan 404 di alamat yang sama
- [x] Halaman 404 dan error bergaya aplikasi dengan maskot, di dalam shell portal
- [ ] Pencarian global (karyawan, lead, unit, dokumen) dari header
- [ ] Inbox persetujuan gabungan semua modul untuk setiap penyetuju

Realtime dan notifikasi
- [x] Realtime refresh di semua halaman portal, ditahan saat alur clock in dan clock out
- [x] Lonceng dengan jumlah belum dibaca, halaman notifikasi, tandai semua dibaca
- [x] Push ke HP per perangkat (aktifkan di Akun saya), email berkop
- [ ] Pengaturan notifikasi per jenis (lonceng, push, email) di Akun saya
- [ ] Pengingat terjadwal: rencana kerja belum diisi, uang muka belum dipertanggungjawabkan, tagihan jatuh tempo, izin kedaluwarsa, kontrak habis

Offline
- [ ] Antrean offline Dexie untuk form lapangan, aktivitas lead, dan pengeluaran. Foto dikompres sebelum masuk antrean
- [ ] Indikator offline dan status kirim per item

Ekspor
- [ ] Ekspor PDF dan Excel di semua daftar dan laporan sesuai aturan `CLAUDE.md` bagian 6 (library Excel diminta persetujuannya saat dibangun)

Dasar bersama
- [ ] Mesin penomoran dokumen otomatis (format per jenis dokumen, misal `SPR/KIS/2026/11/0001`)
- [ ] Template dokumen PDF berkop yang dipakai semua modul
- [ ] Mesin persetujuan generik (lihat [persetujuan-digital.md](persetujuan-digital.md))

## Test
`e2e/pwa/` (navigasi, shortcut, realtime, notifikasi, tampilan), pgTAP `12_realtime`, `14_notifications`.

## Risiko teknis
- iOS: tanpa Background Sync, Web Push hanya untuk PWA yang dipasang (iOS 16.4 ke atas), penyimpanan bisa dihapus sistem, kamera kadang menghasilkan HEIC.
- Realtime Supabase Free dibatasi jumlah koneksi bersamaan.
- Next 16 menyimpan halaman yang sudah dikunjungi dalam keadaan tersembunyi. Test memakai `getByRole("main")`, bukan `locator("main")`.
