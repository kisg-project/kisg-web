import { afterEach, describe, expect, it, vi } from "vitest";
import { handleContentError } from "./query-error";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("handleContentError", () => {
  it("melempar error di luar preview", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() => handleContentError("banner", { code: "PGRST205", message: "x" }, [])).toThrow(
      "Gagal memuat banner: x",
    );
  });

  it("di preview, schema yang belum dimigrasi menghasilkan konten kosong", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(handleContentError("banner", { code: "PGRST205", message: "x" }, [])).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it("di preview, error lain tetap dilempar", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(() => handleContentError("banner", { code: "42501", message: "ditolak" }, [])).toThrow();
    expect(() => handleContentError("banner", { message: "jaringan" }, [])).toThrow();
  });
});
