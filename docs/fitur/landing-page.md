# Landing page iklan (`/lp/[slug]`)

## Tujuan
Halaman konversi untuk kampanye Meta Ads, disusun dari blok di CMS tanpa coding.

## Keputusan owner
- Layout minimal tanpa navigasi utama. Aturan SEO dan responsif sama dengan website (`CLAUDE.md` bagian 6).

## Cakupan
- [ ] Builder blok di CMS: hero, keunggulan, galeri, tipe dan harga, simulasi KPR, FAQ, testimoni, form lead, CTA WhatsApp
- [ ] Urutan blok seret dan lepas, pratinjau HP dan desktop
- [ ] Status draf, terjadwal, terbit, arsip
- [ ] Varian A/B dengan bobot, pengunjung yang sama selalu melihat varian yang sama, varian tercatat di lead
- [ ] Form lead terhubung ke CRM dengan sumber `landing_page` dan kampanye
- [ ] Pixel dan CAPI (lihat [meta.md](meta.md))
- [ ] Laporan per landing page: kunjungan, lead, konversi, biaya per lead
- [ ] Visual regression dan Lighthouse 95+

## Data
`landing_pages`, `landing_page_blocks`, `landing_page_variants` (rencana di [`../data-model.md`](../data-model.md)).

## Risiko teknis
- Varian A/B lewat rewrite di `proxy.ts` harus tetap menyajikan halaman statis supaya Lighthouse tidak turun.
- Dependency seret dan lepas (kandidat dnd-kit) diminta persetujuannya saat dibangun.

## Data dari owner
- Daftar kampanye aktif dan materi iklan.
