import { describe, expect, it } from "vitest";
import { parseShortcutPrefs } from "./schemas";
import { arrangeShortcuts, visibleShortcuts } from "./utils";

const FEATURES = [{ href: "/a" }, { href: "/b" }, { href: "/c" }, { href: "/d" }];

describe("susunan shortcut", () => {
  it("tanpa pengaturan, semua fitur tampil sesuai urutan bawaan", () => {
    expect(visibleShortcuts(FEATURES, null).map((item) => item.href)).toEqual([
      "/a",
      "/b",
      "/c",
      "/d",
    ]);
  });

  it("mengikuti urutan tersimpan dan menyembunyikan yang dipilih", () => {
    const prefs = { order: ["/c", "/a", "/b", "/d"], hidden: ["/b"] };
    expect(visibleShortcuts(FEATURES, prefs).map((item) => item.href)).toEqual(["/c", "/a", "/d"]);
  });

  it("fitur baru muncul di akhir, fitur yang sudah hilang diabaikan", () => {
    const prefs = { order: ["/b", "/lama", "/a"], hidden: [] };
    expect(arrangeShortcuts(FEATURES, prefs).map((entry) => entry.item.href)).toEqual([
      "/b",
      "/a",
      "/c",
      "/d",
    ]);
  });

  it("fitur baru yang pernah disembunyikan tetap tersembunyi", () => {
    const prefs = { order: ["/a"], hidden: ["/d"] };
    expect(visibleShortcuts(FEATURES, prefs).map((item) => item.href)).toEqual(["/a", "/b", "/c"]);
  });

  it("urutan ganda tidak membuat fitur muncul dua kali", () => {
    const prefs = { order: ["/a", "/a", "/b"], hidden: [] };
    expect(arrangeShortcuts(FEATURES, prefs)).toHaveLength(4);
  });

  it("data metadata yang tidak valid dianggap tanpa pengaturan", () => {
    expect(parseShortcutPrefs(undefined)).toBeNull();
    expect(parseShortcutPrefs({ order: "salah" })).toBeNull();
    expect(parseShortcutPrefs({ order: ["/a"], hidden: [] })).toEqual({
      order: ["/a"],
      hidden: [],
    });
  });
});
