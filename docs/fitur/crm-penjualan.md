# CRM dan penjualan

## Tujuan
Setiap lead tercatat dan direspons cepat, sampai akad, serah terima, dan komisi.

## Keputusan owner
- Marketing hanya melihat lead miliknya. Manajer melihat timnya dan antrean. Owner dan admin melihat semua.
- 22 dan 23 November 2026: distribusi lead hybrid. Lead baru dibagi bergiliran ke marketing yang sedang clock in dan berada di jam kerjanya. Kalau proyek punya marketing terdaftar (`project_assignments`), hanya mereka yang ikut giliran. Tanpa marketing bertugas, lead masuk antrean manajer. Lead yang belum direspons sampai batas respons (`crm_settings.sla_minutes`, bawaan 30 menit, diatur owner) kembali ke antrean lewat `crm_sla_sweep` (pg_cron tiap menit). Respons pertama tercatat otomatis saat pemilik mencatat aktivitas atau mengubah tahap. Pemindahan hanya lewat `reassign_lead` oleh manajer marketing atau Direktur Utama, tercatat di `lead_assignments`. Kuota dan bobot per marketing diputuskan owner (belum dibangun).
- Konsumen dan pembayaran: 23 November 2026, tanpa payment gateway. Transfer manual, unggah bukti, dicek keuangan.
- 23 November 2026: pesan WhatsApp lewat tautan `wa.me` dengan template. WAHA dipasang setelah ada VPS (lihat [integrasi-eksternal.md](integrasi-eksternal.md)).

## Cakupan
Lead
- [x] Lead masuk dari website, brosur, dan chat Jaka (upsert per nomor HP)
- [ ] Distribusi hybrid, antrean, batas respons, pindah dan bagikan, pengaturan batas respons (PR #46)
- [ ] Halaman CRM: tab Antrean, Lead saya, Semua lead, cari, filter tahap, tambah lead (PR #46)
- [ ] Detail lead: telepon, WhatsApp, ubah tahap, catat aktivitas, riwayat (PR #46)
- [ ] Notifikasi lead baru ke marketing atau manajer (PR #46)
- [ ] Kuota dan bobot per marketing, sakelar "menerima lead", libur atau cuti otomatis keluar dari giliran
- [ ] Gabung lead duplikat dan riwayat penggabungan
- [ ] Kanban tahap: seret di desktop, menu di HP, riwayat tahap
- [ ] Lead dari sumber lain: input manual, walk-in (buku tamu show unit dengan QR), Instagram, WhatsApp, referral, Meta Lead Ads, agen
- [ ] Tag, skor lead (panas, hangat, dingin), alasan batal terstandar
- [ ] Template pesan WhatsApp per tahap (tautan `wa.me` berisi pesan), aktivitas tercatat otomatis saat diklik
- [ ] Jadwal survei dan janji temu dengan pengingat, hasil survei
- [ ] Tugas follow-up dengan tenggat dan pengingat
- [ ] Inbox chat Jaka di CRM (lihat [chat-jaka.md](chat-jaka.md))

Analisa dan penawaran
- [ ] Form Analisa Konsumen: data diri, pekerjaan, penghasilan, cicilan berjalan, rasio cicilan, kemampuan DP, rekomendasi skema, PDF, persetujuan marketing lalu manajer lalu owner
- [ ] Simulasi pembayaran per unit (cash keras, cash bertahap, KPR, inhouse) dan penawaran PDF untuk konsumen
- [ ] Diskon dan promo dengan batas per role dan persetujuan

Booking sampai akad
- [ ] Booking unit dari siteplan: hold, booking fee dengan bukti transfer, penguncian unit (lihat [produk-kavling.md](produk-kavling.md))
- [ ] SPR (Surat Pemesanan Rumah) PDF bermeterai dan bertanda tangan
- [ ] Jadwal pembayaran otomatis sesuai metode bayar, tagihan ke konsumen (lihat [keuangan-akuntansi.md](keuangan-akuntansi.md))
- [ ] PPJB PDF
- [ ] Proses KPR per bank: berkas, BI checking atau SLIK, appraisal, SP3K, akad kredit, pencairan bertahap dan retensi
- [ ] Berkas konsumen di bucket privat (KTP, KK, NPWP, slip gaji, rekening koran) dengan signed URL
- [ ] Akad jual beli, AJB, serah terima kunci dengan BAST PDF (lihat [legal-sertifikat.md](legal-sertifikat.md))
- [ ] Pembatalan: aturan refund dan penalti, persetujuan, unit kembali tersedia
- [ ] Pindah unit dan alih nama pembeli dengan persetujuan dan dokumen

Komisi dan laporan
- [ ] Skema komisi per proyek, tipe, dan peran (marketing internal, manajer, agen), cair bertahap sesuai pembayaran konsumen
- [ ] Laporan: funnel per tahap, sumber, konversi, waktu respons, CPL dan CAC, kecepatan terjual, laporan penjualan untuk keuangan
- [ ] Conversion Leads ke Meta (lihat [meta.md](meta.md))
- [ ] Ekspor PDF dan Excel

## Data
`leads`, `lead_activities`, `lead_assignments`, `lead_rotation`, `crm_settings`, `utm_touchpoints`. Tabel baru (rencana): `appointments`, `tasks`, `deals`, `payment_schedules`, `lead_documents`, `kpr_applications`, `commissions`, `discount_rules`.

## Test
pgTAP `15_crm_distribution`. E2E `e2e/crm/`. Skenario di [`../e2e-coverage.md`](../e2e-coverage.md) bagian CRM.

## Risiko teknis
- Booking bersamaan: diuji dengan dua browser paralel, penguncian baris di `book_unit()`.
- Realtime Supabase Free dibatasi jumlah koneksi.

## Data dari owner
- Skema komisi, aturan pembatalan dan penalti, daftar bank KPR mitra, batas diskon per role, kuota atau bobot per marketing.
