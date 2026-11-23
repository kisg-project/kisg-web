# Pra-proyek dan lahan

## Tujuan
Mengelola calon lahan sampai proyek siap dibangun: akuisisi, kelayakan, dan perizinan.

## Keputusan owner
- 23 November 2026: satu PT untuk semua proyek (tanpa multi perusahaan).

## Cakupan
Akuisisi lahan
- [ ] Database calon lahan: lokasi di peta, luas, pemilik, perantara, harga penawaran, foto, status (prospek, negosiasi, due diligence, dibeli, batal)
- [ ] Riwayat negosiasi dan kunjungan lahan
- [ ] Due diligence dengan checklist dan dokumen: sertifikat, PBB, tata ruang (KKPR), sengketa, akses jalan, banjir
- [ ] Pembelian lahan bertahap: perjanjian, DP, pelunasan, AJB, biaya notaris dan pajak, jadwal bayar ke pemilik
- [ ] Pecah sertifikat induk (terhubung ke [legal-sertifikat.md](legal-sertifikat.md))

Studi kelayakan
- [ ] Rencana tapak awal: jumlah kavling per tipe, luas efektif dan fasum
- [ ] Proyeksi biaya (lahan, pematangan, konstruksi per tipe, perizinan, marketing, keuangan), harga jual per tipe, jadwal penjualan
- [ ] Proyeksi arus kas, margin, IRR, NPV, titik impas, dengan beberapa skenario
- [ ] Persetujuan proyek oleh owner dengan tanda tangan digital

Perizinan
- [ ] Daftar izin per proyek: PKKPR, pengesahan siteplan, PBG, SLF, UKL-UPL atau AMDAL, andalalin, peil banjir, izin lain
- [ ] Status, nomor izin, tanggal terbit dan berlaku, dokumen, biaya, penanggung jawab
- [ ] Pengingat tenggat dan masa berlaku

## Data
Tabel baru (rencana): `land_prospects`, `land_negotiations`, `land_due_diligence`, `land_purchases`, `feasibility_studies`, `permits`.
