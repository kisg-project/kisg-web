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

info="$(gh pr view "$pr" --json state,isDraft,baseRefName,headRefName,title -q '[.state, (.isDraft|tostring), .baseRefName, .headRefName, .title] | @tsv')"
IFS=$'\t' read -r state draft base head title <<< "$info"

[ "$state" = "OPEN" ] || fail "PR #$pr berstatus $state"
[ "$draft" = "false" ] || fail "PR #$pr masih draft"
case "$base" in
  staging) ;;
  main) [ "$head" = "staging" ] || fail "PR ke main hanya boleh dari staging (sekarang dari $head)" ;;
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

if [ -f "$REQUIRED_FILE" ]; then
  while IFS= read -r required; do
    case "$required" in ''|'#'*) continue ;; esac
    printf '%s\n' "$checks" | awk -F'\t' -v n="$required" '$1 == n && $2 == "pass" {found=1} END {exit !found}' \
      || fail "check wajib '$required' tidak ada atau tidak lolos"
  done < "$REQUIRED_FILE"
fi

echo "OK    PR #$pr ($head -> $base) siap di-merge"
[ "$mode" = "--check-only" ] && exit 0

delete_flag="--delete-branch"
[ "$head" = "staging" ] && delete_flag=""
gh pr merge "$pr" --squash $delete_flag --subject "$title (#$pr)"
