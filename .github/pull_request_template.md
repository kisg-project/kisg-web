## Ringkasan

<!-- Apa yang berubah dan kenapa. Singkat. -->

## Skenario E2E yang ditambah atau diubah

<!-- Daftar spec dan skenario. Perbarui docs/e2e-coverage.md. -->

## Migrasi database

- [ ] Tidak ada migrasi
- [ ] Ada migrasi, aman untuk rollback (pola expand lalu contract)
- [ ] Ada migrasi destruktif (DROP, RENAME, ubah tipe kolom), label `migration:destructive` sudah dipasang

## Screenshot (untuk perubahan UI)

<!-- Desktop dan HP. -->

## Data yang dibutuhkan dari owner

<!-- Data asli yang masih kosong dan sudah dicatat di docs/TODO-DATA.md. -->

## Checklist

- [ ] `pnpm verify:quick` lolos di lokal
- [ ] Semua check CI hijau sebelum `bash scripts/merge-pr.sh <nomor>`
- [ ] Teks UI mengikuti CLAUDE.md bagian 7 (`pnpm check:copy` bersih)
