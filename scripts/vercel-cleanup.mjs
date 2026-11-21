// Membersihkan riwayat deployment Vercel (keputusan owner, 21 November 2026: setiap 3 hari).
// Dijalankan workflow vercel-cleanup.yml. DRY_RUN=1 hanya menampilkan yang akan dihapus.
//
// Yang disimpan:
// - deployment production READY terbaru sebanyak KEEP_PRODUCTION (default 3), supaya Instant Rollback
//   tetap bisa dipakai;
// - semua deployment yang masih berjalan (BUILDING, QUEUED, INITIALIZING);
// - deployment preview yang umurnya belum MAX_AGE_DAYS (default 3), karena PR yang masih terbuka
//   memakainya.
// Sisanya dihapus.

const env = process.env;
for (const name of ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"]) {
  if (!env[name]) {
    console.error(`GAGAL env ${name} belum diisi.`);
    process.exit(1);
  }
}

const API = "https://api.vercel.com";
const team = `teamId=${encodeURIComponent(env.VERCEL_ORG_ID)}`;
const keepProduction = Number(env.KEEP_PRODUCTION ?? 3);
const maxAgeMs = Number(env.MAX_AGE_DAYS ?? 3) * 24 * 60 * 60 * 1000;
const dryRun = env.DRY_RUN === "1";
const running = new Set(["BUILDING", "QUEUED", "INITIALIZING"]);

async function api(path, init = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}`, ...init.headers },
  });
  if (!response.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${path.split("?")[0]} gagal: ${String(response.status)}`,
    );
  }
  return response.status === 204 ? null : response.json();
}

async function listDeployments() {
  const all = [];
  let until;
  for (let page = 0; page < 50; page += 1) {
    const query = `projectId=${encodeURIComponent(env.VERCEL_PROJECT_ID)}&${team}&limit=100${until ? `&until=${String(until)}` : ""}`;
    const data = await api(`/v6/deployments?${query}`);
    all.push(...data.deployments);
    until = data.pagination?.next;
    if (!until) break;
  }
  return all;
}

const deployments = (await listDeployments()).sort((a, b) => b.created - a.created);
const keep = new Set(
  deployments
    .filter((item) => item.target === "production" && item.state === "READY")
    .slice(0, keepProduction)
    .map((item) => item.uid),
);
const now = Date.now();
const remove = deployments.filter((item) => {
  if (keep.has(item.uid) || running.has(item.state)) return false;
  if (item.target === "production") return true;
  return now - item.created > maxAgeMs;
});

console.log(
  `Total ${String(deployments.length)} deployment, disimpan ${String(deployments.length - remove.length)}, dihapus ${String(remove.length)}${dryRun ? " (DRY_RUN)" : ""}.`,
);
let failed = 0;
for (const item of remove) {
  const age = Math.round((now - item.created) / 3_600_000);
  if (dryRun) {
    console.log(`- ${item.target ?? "preview"} ${item.state} ${String(age)} jam`);
    continue;
  }
  try {
    await api(`/v13/deployments/${item.uid}?${team}`, { method: "DELETE" });
  } catch (error) {
    failed += 1;
    console.error(error instanceof Error ? error.message : String(error));
  }
}
if (failed > 0) {
  console.error(`GAGAL ${String(failed)} deployment tidak terhapus.`);
  process.exit(1);
}
console.log("Selesai.");
