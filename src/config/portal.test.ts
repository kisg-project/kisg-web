import { describe, expect, it } from "vitest";
import { portalAccess, portalAreasFor, ROLE_HOME, safeNextPath } from "./portal";

describe("portalAccess", () => {
  it("halaman login dan lupa password publik", () => {
    expect(portalAccess("/portal/login", [], false)).toBe("public");
    expect(portalAccess("/portal/lupa-password", [], false)).toBe("public");
    expect(portalAccess("/portal/auth/confirm", [], false)).toBe("public");
    expect(portalAccess("/portal/auth/keluar", ["marketing"], true)).toBe("public");
  });

  it("halaman portal lain butuh login", () => {
    expect(portalAccess("/portal", [], false)).toBe("login");
    expect(portalAccess("/portal/admin", [], false)).toBe("login");
  });

  it("login tanpa role aktif ditolak, tetapi halaman penolakan tetap bisa dibuka", () => {
    expect(portalAccess("/portal", [], true)).toBe("denied");
    expect(portalAccess("/portal/akses-ditolak", [], true)).toBe("allowed");
  });

  it.each([
    ["/portal/admin", "admin", "allowed"],
    ["/portal/lapangan", "owner", "denied"],
    ["/portal/owner/karyawan", "owner", "allowed"],
    ["/portal/admin", "marketing", "denied"],
    ["/portal/owner", "site_manager", "denied"],
    ["/portal/crm/leads", "marketing", "allowed"],
    ["/portal/crm", "site_supervisor", "denied"],
    ["/portal/crm", "finance", "allowed"],
    ["/portal/lapangan", "site_supervisor", "allowed"],
    ["/portal/lapangan", "marketing", "denied"],
    ["/portal/absensi", "marketing", "allowed"],
    ["/portal/absensi", "finance", "allowed"],
    ["/portal/absensi", "owner", "denied"],
    ["/portal/akun", "finance", "allowed"],
    ["/portal/administrasi", "marketing", "allowed"],
  ] as const)("%s untuk %s: %s", (path, role, expected) => {
    expect(portalAccess(path, [role], true)).toBe(expected);
  });
});

describe("safeNextPath", () => {
  it("memakai beranda role kalau next kosong atau bukan path portal", () => {
    expect(safeNextPath(null, ["marketing"])).toBe(ROLE_HOME.marketing);
    expect(safeNextPath("https://evil.example/portal", ["admin"])).toBe(ROLE_HOME.admin);
    expect(safeNextPath("//evil.example", ["admin"])).toBe(ROLE_HOME.admin);
    expect(safeNextPath("/portal/login", ["admin"])).toBe(ROLE_HOME.admin);
  });

  it("meneruskan ke path yang diizinkan, menolak yang tidak", () => {
    expect(safeNextPath("/portal/crm/leads", ["marketing"])).toBe("/portal/crm/leads");
    expect(safeNextPath("/portal/admin", ["marketing"])).toBe(ROLE_HOME.marketing);
  });
});

describe("portalAreasFor", () => {
  it("setiap role hanya melihat area yang sudah bisa dipakai", () => {
    expect(portalAreasFor(["owner"]).map((area) => area.prefix)).toEqual([
      "/portal/owner",
      "/portal/crm",
    ]);
    expect(portalAreasFor(["marketing"]).map((area) => area.prefix)).toEqual([
      "/portal/crm",
      "/portal/absensi",
    ]);
    expect(portalAreasFor(["finance"]).map((area) => area.prefix)).toEqual([
      "/portal/crm",
      "/portal/absensi",
    ]);
  });
});

describe("multi role (rangkap jabatan)", () => {
  it("akses adalah gabungan semua role", () => {
    const roles = ["finance", "site_supervisor"] as const;
    expect(portalAccess("/portal/crm", roles, true)).toBe("allowed");
    expect(portalAccess("/portal/lapangan", roles, true)).toBe("allowed");
    expect(portalAccess("/portal/owner", roles, true)).toBe("denied");
  });

  it("menu gabungan tanpa duplikat, beranda mengikuti role utama", () => {
    expect(portalAreasFor(["marketing", "site_supervisor"]).map((area) => area.prefix)).toEqual([
      "/portal/crm",
      "/portal/lapangan",
      "/portal/absensi",
    ]);
    expect(safeNextPath(null, ["site_supervisor", "marketing"])).toBe(ROLE_HOME.site_supervisor);
    expect(safeNextPath(null, [])).toBe("/portal/akses-ditolak");
  });
});
