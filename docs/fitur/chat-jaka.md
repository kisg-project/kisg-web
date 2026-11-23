# Chat Jaka (customer service)

## Tujuan
Menjawab calon pembeli dengan cepat dari data resmi KIS dan mengubah percakapan menjadi lead di CRM.

## Keputusan owner
- 21 November 2026: nama asisten Jaka. Gaya staf customer service sungguhan, hangat, luwes. Tetap jujur sebagai asisten virtual kalau ditanya.
- 21 November 2026: kalau Gemini error, timeout, atau kuota habis, Jaka menjawab "sedang tidak bisa membalas" dan menawarkan WhatsApp. Tidak pernah ada pesan error sistem.
- 23 November 2026: Gemini tetap paket gratis.
- Aturan keamanan, sumber jawaban, kemampuan, serah ke manusia, gaya bahasa, UI, data, dan test ada di bawah (dipindah dari `CLAUDE.md` bagian 12).

## Aturan
Keamanan dan biaya
- `GEMINI_API_KEY` hanya di server (route handler dengan `import "server-only"`). Tidak pernah ada di client, log, atau Sentry.
- Rate limit per IP dan per sesi, batas panjang pesan, batas jumlah pesan per sesi, batas token output, dan batas biaya harian dengan alarm. Turnstile (invisible) sebelum pesan pertama.
- Tahan prompt injection: instruksi sistem tidak bisa diubah dari input pengunjung, isi knowledge base diperlakukan sebagai data, asisten tidak pernah membocorkan instruksi sistem atau data internal.

Jawaban hanya dari data resmi
- Sumber: data proyek, tipe unit, ketersediaan unit, fasilitas, lokasi, promo aktif, dan FAQ dari database, ditambah knowledge base yang dikelola admin (pgvector).
- Harga, promo, legalitas, spesifikasi, dan ketersediaan tidak boleh dikarang. Kalau datanya tidak ada, Jaka bilang belum punya infonya dan menawarkan sambung ke marketing.
- Tidak menjanjikan persetujuan KPR, tidak memberi nasihat hukum atau pajak. Di luar topik properti KIS, menolak dengan sopan.

Gaya bahasa
- Jawaban pendek (sekitar 3 kalimat kecuali diminta rincian), tanpa emoji, tanpa dash panjang. Output disaring di server.

UI
- Satu tombol melayang gabungan chat dan WhatsApp. Di HP layar penuh, di desktop panel dengan tombol layar penuh dan WhatsApp di header.
- Skrip dimuat setelah halaman siap, streaming, indikator mengetik, saran pertanyaan, aksesibel.
- Pemberitahuan singkat bahwa percakapan disimpan, dengan tautan kebijakan privasi.

## Cakupan
- [x] Route `/api/chat` (AI SDK, model dari `GEMINI_MODEL`, tingkat berpikir `CHAT_THINKING`), riwayat dimuat server dari `chat_messages`
- [x] Batas token harian `CHAT_DAILY_TOKEN_LIMIT` lewat `chat_usage_daily`
- [x] Tool `get_project_info`, `check_unit_availability`, `calculate_kpr`, `create_lead`, `handoff_to_human` (tawaran WhatsApp)
- [x] Jawaban aman saat Gemini gagal
- [x] Tombol gabungan chat dan WhatsApp
- [ ] Notifikasi lead baru dari chat ke marketing atau manajer (PR #46)
- [ ] Tool `schedule_survey` yang membuat janji survei di CRM
- [ ] Knowledge base pgvector dengan embedding otomatis saat diubah (`cs_knowledge`, model dari `GEMINI_EMBEDDING_MODEL`)
- [ ] Inbox chat di portal CRM (Supabase Realtime): marketing mengambil alih dan membalas langsung di jam kerja
- [ ] Di luar jam kerja: lanjut WhatsApp dengan ringkasan percakapan di pesan pembuka, atau tinggalkan nomor
- [ ] Admin: kelola knowledge base, transkrip, tandai jawaban salah, pertanyaan tak terjawab, statistik (jumlah chat, lead, handoff, biaya)
- [ ] `cs_settings`: jam kerja, pesan sambutan, saran pertanyaan, batas biaya, masa simpan data
- [ ] Evaluasi `pnpm eval:cs` ke Gemini asli tiap malam: tanpa harga atau promo karangan, tanpa dash dan emoji, handoff terpicu, menolak di luar topik, tahan prompt injection

## Test
- E2E memakai model tiruan (`CHAT_MOCK=1`), deterministik.
- Evaluasi terpisah di workflow malam.

## Risiko teknis
- Kuota dan biaya Gemini: batas harian, beralih ke WhatsApp saat tercapai.
- Model mengarang harga atau promo: jawaban hanya dari konteks database, tool mengembalikan "tidak ada data" secara eksplisit, evaluasi `eval:cs`.
- Dimensi vektor `cs_knowledge` mengikuti model embedding. Ganti model berarti embedding ulang.
