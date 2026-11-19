#!/usr/bin/env bash
# Memastikan git, gh, supabase, dan vercel sedang memakai akun KIS, bukan akun proyek lain.
# Pemakaian:
#   bash scripts/check-accounts.sh           cek lengkap (butuh internet)
#   bash scripts/check-accounts.sh --quick   cek lokal saja (dipakai di hook pre-commit dan pre-push)

set -o pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
EXPECTED="$ROOT/scripts/accounts.expected.env"

if [ ! -f "$EXPECTED" ]; then
  echo "GAGAL scripts/accounts.expected.env tidak ditemukan"
  exit 1
fi
# shellcheck source=/dev/null
. "$EXPECTED"

fail=0
ok()  { echo "OK    $1"; }
bad() { echo "GAGAL $1"; fail=1; }

# Identitas commit
email="${GIT_AUTHOR_EMAIL:-$(git config user.email 2>/dev/null)}"
if [ "$email" = "$EXPECTED_GIT_EMAIL" ]; then
  ok "git email: $email"
else
  bad "git email '$email', seharusnya '$EXPECTED_GIT_EMAIL'"
fi

# Remote harus milik owner KIS
remote="$(git remote get-url origin 2>/dev/null || true)"
if [ -z "$remote" ]; then
  echo "INFO  remote origin belum diatur"
elif printf '%s' "$remote" | grep -Eq "^(https://([^@/]+@)?github\.com/|git@github\.com:|ssh://git@github\.com/)${EXPECTED_GITHUB_OWNER}/[^/]+$"; then
  # Host harus github.com dan owner harus segmen pertama path, supaya remote seperti
  # github.com/orang-lain/kisg-project/x atau host lain tidak lolos.
  ok "remote: $remote"
else
  bad "remote '$remote' bukan milik ${EXPECTED_GITHUB_OWNER}"
fi

if [ "${1:-}" = "--quick" ]; then
  exit $fail
fi

# GitHub CLI
if command -v gh >/dev/null 2>&1; then
  login="$(gh api user -q .login 2>/dev/null || true)"
  if [ "$login" = "$EXPECTED_GITHUB_USER" ]; then
    ok "gh: $login"
  else
    bad "gh login '${login:-tidak ada}', seharusnya '$EXPECTED_GITHUB_USER'"
  fi
else
  bad "gh CLI tidak terpasang"
fi

# Supabase CLI
if command -v supabase >/dev/null 2>&1 && [ -n "${EXPECTED_SUPABASE_PROJECT_REFS:-}" ]; then
  projects="$(supabase projects list -o json 2>/dev/null || true)"
  IFS=',' read -r -a refs <<< "$EXPECTED_SUPABASE_PROJECT_REFS"
  for ref in "${refs[@]}"; do
    if printf '%s' "$projects" | grep -q "$ref"; then
      ok "supabase: project $ref terjangkau"
    else
      bad "supabase: project $ref tidak terjangkau (token akun lain?)"
    fi
  done
elif ! command -v supabase >/dev/null 2>&1; then
  echo "INFO  supabase CLI tidak terpasang, pemeriksaan dilewati"
fi

# Vercel CLI
if command -v vercel >/dev/null 2>&1 && [ -n "${EXPECTED_VERCEL_USER:-}" ]; then
  who="$(vercel whoami 2>/dev/null | tail -n 1 || true)"
  if [ "$who" = "$EXPECTED_VERCEL_USER" ]; then
    ok "vercel: $who"
  else
    bad "vercel login '${who:-tidak ada}', seharusnya '$EXPECTED_VERCEL_USER'"
  fi
elif ! command -v vercel >/dev/null 2>&1; then
  echo "INFO  vercel CLI tidak terpasang, pemeriksaan dilewati"
fi

exit $fail
