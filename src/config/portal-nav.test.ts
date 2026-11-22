import { describe, expect, it } from "vitest";
import { ROLE_HOME } from "./portal";
import { bottomItems, featuresFor, railItems } from "./portal-nav";

describe("navigasi portal", () => {
  it("beranda selalu item pertama dan tidak muncul dua kali", () => {
    const rail = railItems(["owner"], "owner");
    expect(rail[0]).toMatchObject({ href: ROLE_HOME.owner, label: "Beranda", home: true });
    expect(rail.filter((item) => item.href === ROLE_HOME.owner)).toHaveLength(1);
  });

  it("owner melihat fitur pengelolaan, tanpa absensi pribadi", () => {
    const labels = railItems(["owner"], "owner").map((item) => item.label);
    expect(labels).toEqual(
      expect.arrayContaining(["Kehadiran", "Karyawan", "Titik absensi", "Jam kerja"]),
    );
    expect(labels).not.toContain("Absensi");
  });

  it("marketing tidak melihat fitur owner", () => {
    const labels = featuresFor(["marketing"], "marketing").map((item) => item.label);
    expect(labels).toContain("Absensi");
    expect(labels).not.toContain("Karyawan");
    expect(labels).not.toContain("CRM");
  });

  it("bottom bar paling banyak beranda dan dua fitur utama", () => {
    for (const role of ["owner", "marketing", "site_supervisor", "finance"] as const) {
      const items = bottomItems([role], role);
      expect(items.length).toBeLessThanOrEqual(3);
      expect(items[0]?.home).toBe(true);
    }
  });

  it("multi role menggabungkan fitur tanpa duplikat", () => {
    const labels = featuresFor(["site_supervisor", "marketing"], "site_supervisor").map(
      (item) => item.label,
    );
    expect(labels).toContain("CRM");
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("fitur yang belum siap tidak masuk rel dan bottom bar", () => {
    const rail = railItems(["owner"], "owner").map((item) => item.label);
    expect(rail).not.toContain("Pengajuan");
    expect(featuresFor(["owner"], "owner").map((item) => item.label)).toContain("Pengajuan");
  });
});
