import { describe, expect, it } from "vitest";
import { publicPortalPath, pushPayload, safePortalHref, unreadBadge } from "./utils";

describe("safePortalHref", () => {
  it("menerima halaman portal", () => {
    expect(safePortalHref("/portal/absensi")).toBe("/portal/absensi");
    expect(safePortalHref("/portal")).toBe("/portal");
  });

  it("menolak tautan keluar portal", () => {
    expect(safePortalHref("https://contoh.test")).toBe("/portal");
    expect(safePortalHref("/portalx")).toBe("/portal");
    expect(safePortalHref("/portal//contoh.test")).toBe("/portal");
    expect(safePortalHref("/website")).toBe("/portal");
    expect(safePortalHref(null)).toBe("/portal");
  });
});

describe("publicPortalPath", () => {
  it("mempertahankan /portal di host utama", () => {
    expect(publicPortalPath("/portal/akun", "/portal")).toBe("/portal/akun");
  });

  it("memakai path bersih di subdomain portal", () => {
    expect(publicPortalPath("/portal/akun", "")).toBe("/akun");
    expect(publicPortalPath("/portal", "")).toBe("/");
  });
});

describe("pushPayload", () => {
  it("memotong teks panjang dan mengamankan tautan", () => {
    const payload = pushPayload({
      title: "a".repeat(200),
      body: "b".repeat(300),
      href: "https://contoh.test",
      dedupeKey: "k".repeat(100),
    });
    expect(payload.title).toHaveLength(120);
    expect(payload.body).toHaveLength(240);
    expect(payload.url).toBe("/portal");
    expect(payload.tag).toHaveLength(64);
  });
});

describe("unreadBadge", () => {
  it("menyembunyikan nol dan meringkas angka besar", () => {
    expect(unreadBadge(0)).toBeNull();
    expect(unreadBadge(7)).toBe("7");
    expect(unreadBadge(150)).toBe("99+");
  });
});
