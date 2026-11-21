import { describe, expect, it } from "vitest";
import { cmsAccess } from "./cms";

describe("cmsAccess", () => {
  it("halaman login, keluar, dan ditolak selalu terbuka", () => {
    expect(cmsAccess("/cms/login", [], false)).toBe("public");
    expect(cmsAccess("/cms/ditolak", ["owner"], true)).toBe("public");
  });

  it("belum login diarahkan ke halaman masuk CMS", () => {
    expect(cmsAccess("/cms/berita", [], false)).toBe("login");
  });

  it("hanya role cms yang boleh, owner dan karyawan ditolak", () => {
    expect(cmsAccess("/cms/berita", ["cms"], true)).toBe("allowed");
    expect(cmsAccess("/cms", ["owner"], true)).toBe("denied");
    expect(cmsAccess("/cms", ["marketing", "finance"], true)).toBe("denied");
  });
});
