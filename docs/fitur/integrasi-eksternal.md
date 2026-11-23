# Integrasi eksternal

## Keputusan owner (23 November 2026)
- Semua layanan paket gratis (`CLAUDE.md` bagian 10).
- **Gemini**: tetap paket gratis (chat Jaka, pindai nota).
- **WhatsApp**: tanpa WhatsApp Business API. Sekarang memakai tautan `wa.me` dengan template pesan. Nanti memakai WAHA (WhatsApp HTTP API, self-host) setelah KIS punya VPS.
- **Payment gateway**: tidak dipakai. Pembayaran lewat transfer manual, unggah bukti, dan pengecekan manual oleh keuangan.
- **e-Meterai**: dua jalur, unggah manual dan API distributor (lihat [persetujuan-digital.md](persetujuan-digital.md)). Distributor menunggu keputusan owner.

## Cakupan
- [x] Brevo untuk email (SMTP Supabase Auth dan API untuk email aplikasi)
- [x] Web Push dengan VAPID
- [x] Gemini untuk chat Jaka
- [ ] Template pesan WhatsApp per jenis (tagihan, jadwal survei, follow-up) lewat `wa.me`, aktivitas tercatat
- [ ] Adapter WhatsApp yang bisa ditukar: `wa.me` sekarang, WAHA saat VPS siap (kirim otomatis, terima balasan ke CRM), cukup isi env
- [ ] e-Meterai jalur manual dan adapter API distributor
- [ ] Google Maps atau OpenStreetMap untuk peta lahan dan lokasi (pilih yang gratis)
- [ ] Impor mutasi bank dari Excel untuk rekonsiliasi

## Data dari owner
- Kapan VPS tersedia untuk WAHA, distributor e-Meterai yang dipilih.
