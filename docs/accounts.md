# Akun per proyek

Perangkat ini dipakai untuk beberapa proyek (PRINS, KELOLA, Shaflow, KIS) dengan akun yang berbeda. Akun KIS harus aktif otomatis di folder ini tanpa mengubah akun proyek lain.

## Ringkasan

| Layanan | Cara akun KIS dipilih | File |
|---|---|---|
| Identitas commit | `includeIf` per folder di `~/.gitconfig` | `~/.gitconfig-kis` |
| git push dan pull | Helper kredensial per folder: `gh auth token -u kisg-project` | `~/.gitconfig-kis` |
| gh CLI | `GH_TOKEN` dimuat hook untuk sesi Claude Code ini saja | `~/.config/kis/accounts.env` (`GH_USER`) |
| Supabase CLI | `SUPABASE_ACCESS_TOKEN` dimuat hook | `~/.config/kis/accounts.env` |
| Vercel CLI | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` dimuat hook | `~/.config/kis/accounts.env` |
| Sentry CLI | `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` dimuat hook | `~/.config/kis/accounts.env` |
| MCP | `context7` saja, tanpa secret | `.mcp.json` |
| Chrome | Profil `KISG` (folder `Profile 5`) | Chrome |

Identitas yang benar (tanpa secret) ada di `scripts/accounts.expected.env`.

| Akun | Nilai |
|---|---|
| GitHub | `kisg-project` |
| Email commit | `kreatifsejahteraproject@gmail.com` |
| Vercel | tim `kisg-project` |
| Repo | `kisg-project/kisg-web` (private) |
| Supabase | org `yiwfpvjviqrrragrkukf` (paket Free) |
| Supabase production | `skxawyvopumzrefnmvyf` (kisg web-pwa, ap-southeast-1) |

Tanpa project staging sejak Fase 2 (keputusan owner, project staging sudah dihapus). Password database production tersimpan di `~/.config/kis/accounts.env` sebagai `KIS_PRODUCTION_DB_PASSWORD` (tidak dimuat ke sesi) dan sebagai repository secret GitHub.

## Cara kerja

1. **git.** `~/.gitconfig` memuat `~/.gitconfig-kis` untuk semua repo di bawah `Desktop/it/KISG/`. File itu mengatur `user.name` dan `user.email`. File itu juga mengosongkan helper kredensial global lalu memakai `gh auth token -u kisg-project`. Akibatnya push selalu memakai akun KIS, apa pun akun gh yang sedang aktif. Cara ini jalan juga dari terminal biasa dan dari hook Husky.
2. **Hook sesi.** `.claude/hooks/kis-accounts.sh` jalan saat sesi Claude Code dimulai. Hook membaca `~/.config/kis/accounts.env` dan menulis variabel yang diizinkan ke environment sesi. Akun global tidak diubah. Kalau `GH_TOKEN` kosong, hook mengambil token dari akun gh `GH_USER` yang sudah login.
3. **Pengaman.** `scripts/check-accounts.sh` mencocokkan email commit, remote, login gh, project Supabase, dan user Vercel dengan `accounts.expected.env`. `--quick` hanya memeriksa email dan remote, dan dipakai di hook pre-commit serta pre-push.
4. **Izin.** `.claude/settings.json` melarang perintah yang mengubah akun global: `git config --global`, `gh auth login/switch/logout`, `supabase login`, `vercel login/switch`.

## Menyiapkan perangkat baru

1. Login akun GitHub KIS ke gh tanpa mengeluarkan akun lain: `gh auth login -h github.com --web`. Setelah itu kembalikan akun aktif ke akun semula dengan `gh auth switch -u <akun-semula>`. Git KIS tetap memakai `kisg-project` lewat helper per folder.
2. Salin `docs/accounts.env.example` ke `~/.config/kis/accounts.env`. Batasi aksesnya ke akun Anda sendiri. Di macOS/Linux: `chmod 600 ~/.config/kis/accounts.env`. Di Windows (PowerShell): `icacls "$env:USERPROFILE\.config\kis\accounts.env" /inheritance:r /grant:r "${env:USERNAME}:(R,W)"`.
3. Isi token di file itu. Jangan menempelkan token di chat, issue, atau file di dalam proyek.
4. Buka sesi Claude Code baru, lalu jalankan `bash scripts/check-accounts.sh`.

## Menambah layanan baru

1. Tambahkan nama variabel ke `docs/accounts.env.example`.
2. Tambahkan nama variabel ke regex `ALLOWED` di `.claude/hooks/kis-accounts.sh`.
3. Kalau layanan punya perintah login global, tambahkan perintah itu ke daftar `deny` di `.claude/settings.json`.
4. Tambahkan pemeriksaan di `scripts/check-accounts.sh` dan identitas yang benar di `scripts/accounts.expected.env`.
5. Perbarui tabel di dokumen ini.

## Rotasi token

| Token | Tempat membuat | Langkah |
|---|---|---|
| GitHub (gh) | `gh auth login -h github.com --web` | Login ulang akun `kisg-project`. Akun lain tidak terpengaruh |
| Supabase | supabase.com/dashboard/account/tokens | Buat token baru, ganti `SUPABASE_ACCESS_TOKEN`, cabut token lama |
| Vercel | vercel.com/account/settings/tokens | Buat token baru dengan scope tim `kisg-project`, ganti `VERCEL_TOKEN`, hapus token lama |
| Sentry | Sentry > Settings > Auth Tokens | Buat token baru, ganti `SENTRY_AUTH_TOKEN`, cabut token lama |
| Password database | Supabase > Project Settings > Database | Reset, lalu perbarui repository secret GitHub `PRODUCTION_SUPABASE_DB_PASSWORD` dan `PRODUCTION_SUPABASE_DB_URL`, serta `KIS_PRODUCTION_DB_PASSWORD` di `accounts.env` |

Setelah mengganti token, buka sesi Claude Code baru supaya hook memuat nilai baru. Token yang juga disimpan sebagai secret GitHub Actions atau env Vercel harus diganti di sana juga (repository secret GitHub, env Vercel).
