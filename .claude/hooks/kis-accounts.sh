#!/usr/bin/env bash
# SessionStart hook Claude Code untuk proyek KIS.
# Memuat akun KIS (GitHub, git, Supabase, Vercel, Sentry) khusus untuk sesi ini.
# Tidak mengubah konfigurasi global, jadi sesi proyek lain di perangkat yang sama tidak terpengaruh.

set -o pipefail

FILE="${KIS_ACCOUNTS_FILE:-$HOME/.config/kis/accounts.env}"
ALLOWED='^(GH_TOKEN|GH_USER|SUPABASE_ACCESS_TOKEN|VERCEL_TOKEN|VERCEL_ORG_ID|VERCEL_PROJECT_ID|SENTRY_AUTH_TOKEN|SENTRY_ORG|SENTRY_PROJECT|GIT_AUTHOR_NAME|GIT_AUTHOR_EMAIL|GIT_COMMITTER_NAME|GIT_COMMITTER_EMAIL|GIT_SSH_COMMAND|CLOUDFLARE_API_TOKEN|BREVO_API_KEY|BREVO_SMTP_LOGIN|BREVO_SMTP_KEY)$'

if [ ! -f "$FILE" ]; then
  echo "AKUN KIS BELUM AKTIF: $FILE tidak ditemukan. Jangan commit, push, atau menjalankan gh/supabase/vercel sampai file ini dibuat (lihat docs/accounts.md)."
  exit 0
fi

# Di Windows (Git Bash) chmod tidak berlaku. Akses file dibatasi lewat icacls, lihat docs/accounts.md.
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) ;;
  *)
    perm="$(stat -c '%a' "$FILE" 2>/dev/null || stat -f '%Lp' "$FILE" 2>/dev/null || echo '?')"
    if [ "$perm" != "600" ]; then
      echo "PERINGATAN: izin $FILE adalah $perm, seharusnya 600. Jalankan: chmod 600 \"$FILE\""
    fi
    ;;
esac

if [ -z "${CLAUDE_ENV_FILE:-}" ]; then
  echo "PERINGATAN: CLAUDE_ENV_FILE tidak tersedia, akun KIS tidak bisa dimuat. Mulai sesi baru atau update Claude Code."
  exit 0
fi

loaded=""
gh_user=""

while IFS='=' read -r key value; do
  [[ "$key" =~ $ALLOWED ]] || continue
  value="${value%$'\r'}"
  value="${value#\"}"; value="${value%\"}"
  value="${value#\'}"; value="${value%\'}"
  [ -n "$value" ] || continue

  if [ "$key" = "GH_USER" ]; then
    gh_user="$value"
    continue
  fi

  printf 'export %s=%q\n' "$key" "$value" >> "$CLAUDE_ENV_FILE"
  loaded="$loaded $key"
done < <(grep -E '^[A-Z_]+=' "$FILE")

# Kalau GH_TOKEN tidak diisi, ambil token dari akun gh KIS yang sudah login (gh mendukung banyak akun).
case " $loaded " in
  *" GH_TOKEN "*) ;;
  *)
    if [ -n "$gh_user" ] && command -v gh >/dev/null 2>&1; then
      if token="$(gh auth token --user "$gh_user" 2>/dev/null)" && [ -n "$token" ]; then
        printf 'export GH_TOKEN=%q\n' "$token" >> "$CLAUDE_ENV_FILE"
        loaded="$loaded GH_TOKEN(gh:$gh_user)"
      else
        echo "PERINGATAN: akun gh '$gh_user' belum login di perangkat ini. Jalankan sendiri: gh auth login"
      fi
    fi
    ;;
esac

echo "export KIS_ACCOUNTS_LOADED=1" >> "$CLAUDE_ENV_FILE"
echo "Akun KIS dimuat untuk sesi ini:${loaded:- tidak ada}. Nilai token tidak ditampilkan. Jalankan 'bash scripts/check-accounts.sh' sebelum push atau memakai CLI."
exit 0
