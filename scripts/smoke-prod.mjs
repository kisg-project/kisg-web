const SITE = process.env.SMOKE_SITE ?? "https://kisgroup.co.id";
const PORTAL = process.env.SMOKE_PORTAL ?? "https://company.kisgroup.co.id";
const CMS = process.env.SMOKE_CMS ?? "https://cms.kisgroup.co.id";

const checks = [
  { name: "Beranda", url: `${SITE}/`, text: ["Sejahtera Green Village", "Rp 570 jutaan"] },
  {
    name: "Proyek",
    url: `${SITE}/proyek/sejahtera-green-village`,
    text: ["Rp 570.000.000", "Spesifikasi bangunan", "Unduh brosur"],
  },
  { name: "Simulasi KPR", url: `${SITE}/simulasi-kpr`, text: ["Simulasi KPR"] },
  { name: "Kontak", url: `${SITE}/kontak`, text: ["marketing@kisgroup.co.id"] },
  { name: "Berita", url: `${SITE}/berita`, text: ["Berita"] },
  { name: "Sitemap", url: `${SITE}/sitemap.xml`, text: ["<urlset"] },
  { name: "Robots", url: `${SITE}/robots.txt`, text: ["Disallow: /portal", "Disallow: /brosur"] },
  {
    name: "Brosur PDF",
    url: `${SITE}/brosur/sejahtera-green-village-a9f5e2b1.pdf`,
    type: "application/pdf",
    header: ["x-robots-tag", "noindex"],
  },
  { name: "Login portal", url: `${PORTAL}/login`, text: ["Lupa password"] },
  { name: "Lupa password portal", url: `${PORTAL}/lupa-password`, text: ["Kirim kode"] },
  { name: "Login CMS", url: `${CMS}/login`, text: ["Masuk"] },
  {
    name: "Verifikasi tidak dikenal",
    url: `${SITE}/verifikasi/${"0".repeat(64)}`,
    text: ["Halaman tidak ditemukan"],
  },
  { name: "Portal tanpa sesi", url: `${PORTAL}/owner`, redirect: /\/login/ },
];

async function run(check) {
  const response = await fetch(check.url, { redirect: check.redirect ? "manual" : "follow" });
  if (check.redirect) {
    const location = response.headers.get("location") ?? "";
    return response.status >= 300 && response.status < 400 && check.redirect.test(location)
      ? null
      : `status ${String(response.status)}, location ${location}`;
  }
  if (response.status !== 200) return `status ${String(response.status)}`;
  if (!response.headers.get("strict-transport-security")) return "tanpa header HSTS";
  if (check.type && !(response.headers.get("content-type") ?? "").includes(check.type)) {
    return `content-type ${String(response.headers.get("content-type"))}`;
  }
  if (check.header && !(response.headers.get(check.header[0]) ?? "").includes(check.header[1])) {
    return `header ${check.header[0]} tidak berisi ${check.header[1]}`;
  }
  if (check.text) {
    const body = await response.text();
    const missing = check.text.filter((item) => !body.includes(item));
    if (missing.length > 0) return `teks tidak ditemukan: ${missing.join(", ")}`;
  }
  return null;
}

const results = await Promise.all(
  checks.map(async (check) => {
    try {
      return { name: check.name, error: await run(check) };
    } catch (error) {
      return { name: check.name, error: error instanceof Error ? error.message : String(error) };
    }
  }),
);
for (const result of results)
  console.log(
    `${result.error ? "GAGAL" : "OK   "} ${result.name}${result.error ? `: ${result.error}` : ""}`,
  );
const failed = results.filter((result) => result.error).length;
console.log(
  failed ? `${String(failed)} pemeriksaan gagal.` : "Semua pemeriksaan production lolos.",
);
process.exit(failed ? 1 : 0);
