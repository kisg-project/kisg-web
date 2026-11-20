import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const headerValues = new Map<string, string>();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ rpc }),
}));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: (name: string) => headerValues.get(name) ?? null }),
}));

const { clientIp, hashKey, hitRateLimit } = await import("./rate-limit");

beforeEach(() => {
  rpc.mockReset();
  headerValues.clear();
});

describe("hashKey", () => {
  it("tidak menyimpan nilai mentah dan tidak peka huruf besar atau spasi", () => {
    const key = hashKey(" Nama@KISGroup.co.id ");
    expect(key).toHaveLength(32);
    expect(key).not.toContain("nama");
    expect(key).toBe(hashKey("nama@kisgroup.co.id"));
  });
});

describe("clientIp", () => {
  it("memakai IP pertama dari x-forwarded-for", async () => {
    headerValues.set("x-forwarded-for", "203.0.113.7, 10.0.0.1");
    await expect(clientIp()).resolves.toBe("203.0.113.7");
  });

  it("memakai x-real-ip kalau x-forwarded-for tidak ada", async () => {
    headerValues.set("x-real-ip", "198.51.100.4");
    await expect(clientIp()).resolves.toBe("198.51.100.4");
  });

  it("memberi nilai tetap kalau tidak ada header IP", async () => {
    await expect(clientIp()).resolves.toBe("tidak-diketahui");
  });
});

describe("hitRateLimit", () => {
  it("mengirim kunci ter-hash ke fungsi database", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(hitRateLimit("login-akun", "a@kisgroup.co.id", 900, 5)).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("rate_limit_hit", {
      p_key: `login-akun:${hashKey("a@kisgroup.co.id")}`,
      p_window_seconds: 900,
      p_max: 5,
    });
  });

  it("mengembalikan false saat batas terlewati", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(hitRateLimit("login-ip", "1.1.1.1", 900, 20)).resolves.toBe(false);
  });

  it("gagal tertutup kalau database error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "down" } });
    await expect(hitRateLimit("login-ip", "1.1.1.1", 900, 20)).resolves.toBe(false);
  });
});
