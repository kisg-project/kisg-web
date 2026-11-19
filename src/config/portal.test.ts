import { describe, expect, it } from "vitest";
import { PORTAL_AREAS, portalAccess, portalAreasFor, ROLE_HOME, safeNextPath } from "./portal";

describe("portalAccess", () => {
  it("halaman login dan lupa password publik", () => {
    expect(portalAccess("/portal/login", null, false)).toBe("public");
    expect(portalAccess("/portal/lupa-password", null, false)).toBe("public");
    expect(portalAccess("/portal/auth/confirm", null, false)).toBe("public");
    expect(portalAccess("/portal/auth/keluar", "marketing", true)).toBe("public");
  });

  it("halaman portal lain butuh login", () => {
    expect(portalAccess("/portal", null, false)).toBe("login");
    expect(portalAccess("/portal/admin", null, false)).toBe("login");
  });

  it("login tanpa role aktif ditolak, tetapi halaman penolakan tetap bisa dibuka", () => {
    expect(portalAccess("/portal", null, true)).toBe("denied");
    expect(portalAccess("/portal/akses-ditolak", null, true)).toBe("allowed");
  });

  it.each([
    ["/portal/admin", "admin", "allowed"],
    ["/portal/admin/pengguna", "owner", "allowed"],
    ["/portal/admin", "marketing", "denied"],
    ["/portal/owner", "site_manager", "denied"],
    ["/portal/crm/leads", "marketing", "allowed"],
    ["/portal/crm", "site_supervisor", "denied"],
    ["/portal/crm", "finance", "allowed"],
    ["/portal/lapangan", "site_supervisor", "allowed"],
    ["/portal/lapangan", "marketing", "denied"],
    ["/portal/absensi", "marketing", "allowed"],
    ["/portal/absensi", "finance", "denied"],
    ["/portal/akun", "finance", "allowed"],
    ["/portal/administrasi", "marketing", "allowed"],
  ] as const)("%s untuk %s: %s", (path, role, expected) => {
    expect(portalAccess(path, role, true)).toBe(expected);
  });
});

describe("safeNextPath", () => {
  it("memakai beranda role kalau next kosong atau bukan path portal", () => {
    expect(safeNextPath(null, "marketing")).toBe(ROLE_HOME.marketing);
    expect(safeNextPath("https://evil.example/portal", "admin")).toBe(ROLE_HOME.admin);
    expect(safeNextPath("//evil.example", "admin")).toBe(ROLE_HOME.admin);
    expect(safeNextPath("/portal/login", "admin")).toBe(ROLE_HOME.admin);
  });

  it("meneruskan ke path yang diizinkan, menolak yang tidak", () => {
    expect(safeNextPath("/portal/crm/leads", "marketing")).toBe("/portal/crm/leads");
    expect(safeNextPath("/portal/admin", "marketing")).toBe(ROLE_HOME.marketing);
  });
});

describe("portalAreasFor", () => {
  it("owner melihat semua area, marketing hanya area marketing", () => {
    expect(portalAreasFor("owner")).toHaveLength(PORTAL_AREAS.length);
    expect(portalAreasFor("marketing").map((area) => area.prefix)).toEqual([
      "/portal/crm",
      "/portal/marketing",
      "/portal/absensi",
    ]);
    expect(portalAreasFor("finance").map((area) => area.prefix)).toEqual(["/portal/crm"]);
  });
});
