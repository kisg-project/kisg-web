#!/usr/bin/env bash
set -uo pipefail
for attempt in 1 2 3 4; do
  if supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor; then exit 0; fi
  echo "::warning::Supabase lokal gagal menyala (percobaan $attempt dari 4), coba lagi."
  supabase stop --no-backup > /dev/null 2>&1 || true
  sleep $((attempt * 20))
done
echo "::error::Supabase lokal tetap gagal menyala setelah 4 percobaan."
exit 1
