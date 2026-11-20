-- Seed khusus development dan CI (supabase db reset). Tidak pernah dijalankan ke production.
-- Data asli Sejahtera Green Village ada di migrasi 20261121000300 (ikut ke production). File ini
-- hanya berisi data tiruan untuk menguji bahwa konten yang belum terbit tidak terlihat publik.
-- User contoh per role dibuat oleh global setup E2E lewat admin API, bukan di sini.

-- Proyek draft: tidak boleh tampil di website, menu, maupun sitemap.
insert into public.projects (slug, name, status, content_status)
values ('proyek-draft-dummy', 'Proyek draft (dummy)', 'segera', 'draft');

-- Konten draft dan kedaluwarsa: tidak boleh tampil di website.
insert into public.posts (slug, title, excerpt, content_status)
values ('berita-draft-dummy', 'Berita draft (dummy)', 'Tidak boleh tampil.', 'draft');

insert into public.promos (slug, title, summary, content_status, starts_at, ends_at)
values (
  'promo-kedaluwarsa-dummy', 'Promo kedaluwarsa (dummy)', 'Tidak boleh tampil.', 'terbit',
  now() - interval '30 days', now() - interval '1 day'
);

insert into public.careers (slug, title, content_status)
values ('lowongan-draft-dummy', 'Lowongan draft (dummy)', 'draft');

insert into public.site_settings (key, value, is_public) values
  ('internal.note', '"Pengaturan internal (dummy)"', false);
