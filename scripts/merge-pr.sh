#!/usr/bin/env bash
# Pengganti branch protection (GitHub Free, repo private).
# Memastikan PR boleh di-merge, lalu squash merge.
# Pemakaian: bash scripts/merge-pr.sh <nomor-pr> [--check-only]

set -euo pipefail

pr="${1:-}"
mode="${2:-}"
if [ -z "$pr" ]; then
  echo "Pemakaian: bash scripts/merge-pr.sh <nomor-pr> [--check-only]"
  exit 2
fi

ROOT="$(git rev-parse --show-toplevel)"
REQUIRED_FILE="$ROOT/scripts/required-checks.txt"

bash "$ROOT/scripts/check-accounts.sh" --quick >/dev/null

fail() { echo "GAGAL $1"; exit 1; }

info="$(gh pr view "$pr" --json state,isDraft,baseRefName,headRefName,title,labels -q '[.state, (.isDraft|tostring), .baseRefName, .headRefName, .title, ([.labels[].name] | join(","))] | @tsv')"
# labels paling akhir: kalau kosong, tab beruntun tidak menggeser kolom lain.
IFS=$'\t' read -r state draft base head title labels <<< "$info"

[ "$state" = "OPEN" ] || fail "PR #$pr berstatus $state"
[ "$draft" = "false" ] || fail "PR #$pr masih draft"
case "$base" in
  staging) ;;
  main)
    case "$head" in
      staging | release-please--*) ;;
      *) fail "PR ke main hanya boleh dari staging atau release-please (sekarang dari $head)" ;;
    esac
    ;;
  *) fail "base PR harus staging atau main (sekarang $base)" ;;
esac

# Judul PR menjadi pesan squash commit, jadi harus Conventional Commits.
printf '%s' "$title" | grep -Eq '^(feat|fix|chore|docs|refactor|test|perf|build|ci|style|revert)(\([a-z0-9-]+\))?!?: .+' \
  || fail "judul PR bukan Conventional Commits: $title"

# Branch harus up to date dengan base.
git fetch -q origin "$base" "$head"
git merge-base --is-ancestor "origin/$base" "origin/$head" \
  || fail "branch $head tertinggal dari $base. Rebase atau merge $base dulu"

# Semua check harus selesai dan hijau, dan check wajib harus ada.
checks="$(gh pr checks "$pr" --json name,bucket -q '.[] | [.name, .bucket] | @tsv' || true)"
[ -n "$checks" ] || fail "belum ada check yang berjalan di PR #$pr"

not_green="$(printf '%s\n' "$checks" | awk -F'\t' '$2 != "pass" && $2 != "skipping" {print $1 " (" $2 ")"}')"
[ -z "$not_green" ] || fail "check belum hijau: $(echo "$not_green" | paste -sd ', ' -)"

require_check() {
  local required="$1" template=""
  # "skipping" diterima: job kode dilewati kalau PR hanya mengubah dokumen.
  # Job matrix yang dilewati tampil dengan nama mentah, misal "e2e (${{ matrix.shard }}/...)".
  case "$required" in
    *"("[0-9]*"/"[0-9]*")") template="${required%%(*}(\${{" ;;
  esac
  printf '%s\n' "$checks" | awk -F'\t' -v n="$required" -v t="$template" \
    '($1 == n && ($2 == "pass" || $2 == "skipping")) || (t != "" && index($1, t) == 1 && $2 == "skipping") {found=1} END {exit !found}' \
    || fail "check wajib '$required' tidak ada atau tidak lolos"
}

if [ -f "$REQUIRED_FILE" ]; then
  while IFS= read -r required; do
    case "$required" in ''|'#'*) continue ;; esac
    require_check "$required"
  done < "$REQUIRED_FILE"
fi

# E2E: PR biasa cukup Chromium, e2e (1/1). PR ke main dan PR akhir fase (label e2e:full) wajib
# 3 browser x 3 shard. Kalau label dipasang setelah CI jalan, push ulang supaya suite penuh jalan.
full_e2e=no
case ",$labels," in
  *",e2e:full,"*) full_e2e=yes ;;
esac
[ "$base" = "main" ] && full_e2e=yes
if [ "$full_e2e" = "yes" ]; then
  for shard in 1 2 3; do require_check "e2e ($shard/3)"; done
else
  require_check "e2e (1/1)"
fi

echo "OK    PR #$pr ($head -> $base) siap di-merge"
[ "$mode" = "--check-only" ] && exit 0

# PR fitur ke staging: squash. PR staging ke main: merge commit, supaya riwayat staging dan main tidak
# bercabang dan main tetap memuat commit per fitur untuk CHANGELOG release-please.
if [ "$head" = "staging" ]; then
  gh pr merge "$pr" --merge --subject "$title (#$pr)"
else
  gh pr merge "$pr" --squash --delete-branch --subject "$title (#$pr)"
fi
