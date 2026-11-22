#!/usr/bin/env bash
set -euo pipefail

if [ -z "${VERCEL_TOKEN:-}" ]; then echo "VERCEL_TOKEN tidak ada di sesi ini."; exit 1; fi
if [ -z "${VERCEL_ORG_ID:-}" ]; then echo "VERCEL_ORG_ID tidak ada di sesi ini."; exit 1; fi
if [ -z "${VERCEL_PROJECT_ID:-}" ]; then
  VERCEL_PROJECT_ID="$(node -e 'fetch(`https://api.vercel.com/v9/projects/kisg-web?teamId=${process.env.VERCEL_ORG_ID}`,{headers:{Authorization:`Bearer ${process.env.VERCEL_TOKEN}`}}).then(r=>r.json()).then(d=>{if(!String(d.id).startsWith("prj_"))process.exit(1);process.stdout.write(d.id)}).catch(()=>process.exit(1))')" || { echo "Project Vercel kisg-web tidak ditemukan."; exit 1; }
  export VERCEL_PROJECT_ID
fi
if [ "$(git branch --show-current)" != "main" ]; then echo "Deploy hanya dari branch main."; exit 1; fi
git fetch -q origin main
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then echo "main lokal belum sama dengan origin/main."; exit 1; fi
if [ -n "$(git status --porcelain)" ]; then echo "Ada perubahan yang belum di-commit."; exit 1; fi
if git diff --name-only HEAD~1 HEAD | grep -q "^supabase/migrations/"; then
  echo "Commit terakhir berisi migrasi database. Tunggu CI (mode darurat menahan migrasi)."
  exit 1
fi

VERCEL="npx --yes vercel@66.2.0"
echo "Deploy production lewat build Vercel..."
$VERCEL deploy --prod --archive=tgz --yes --token="$VERCEL_TOKEN" > /tmp/kis-deploy-url.txt
echo "Deploy: $(tail -1 /tmp/kis-deploy-url.txt)"

for attempt in 1 2 3; do
  if node scripts/smoke-prod.mjs; then echo "Production sehat."; exit 0; fi
  echo "Smoke test gagal (percobaan $attempt), cek ulang 20 detik lagi."
  sleep 20
done

echo "Smoke test tetap gagal. Mengembalikan ke deployment production sebelumnya..."
$VERCEL rollback --yes --token="$VERCEL_TOKEN"
exit 1
