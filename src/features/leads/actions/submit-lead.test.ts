import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  allowed: true,
  turnstile: true,
  rpcError: null as { message: string } | null,
  project: { id: "p1" } as { id: string } | null,
};
const inserts: { table: string; row: Record<string, unknown> }[] = [];
const rpc = vi.fn<(name: string, args: Record<string, unknown>) => Promise<unknown>>(() =>
  Promise.resolve(
    state.rpcError
      ? { data: null, error: state.rpcError }
      : { data: [{ lead_id: "lead-1", is_new: true }], error: null },
  ),
);

function from(table: string) {
  const query = {
    insert: (row: Record<string, unknown>) => {
      inserts.push({ table, row });
      return Promise.resolve({ error: null });
    },
    select: () => query,
    eq: () => query,
    is: () => query,
    maybeSingle: () => Promise.resolve({ data: state.project, error: null }),
  };
  return query;
}

vi.mock("@/env", () => ({ env: {} }));
vi.mock("@/features/crm/server", () => ({ notifyLeadEntry: () => Promise.resolve() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: () => ({ from, rpc }) }));
vi.mock("@/lib/security/rate-limit", () => ({
  clientIp: () => Promise.resolve("203.0.113.5"),
  hashKey: (value: string) => `hash-${value}`,
  hitRateLimit: () => Promise.resolve(state.allowed),
}));
vi.mock("@/lib/security/turnstile", () => ({
  verifyTurnstile: () => Promise.resolve(state.turnstile),
}));
vi.mock("next/headers", () => ({
  headers: () => Promise.resolve({ get: () => "Mozilla/5.0" }),
}));

const { submitLeadAction } = await import("./submit-lead");

const valid = {
  fullName: "Budi",
  phone: "0812-3456-7890",
  email: "",
  message: "Info unit",
  consent: true,
  website: "",
  formKind: "minat" as const,
  projectSlug: "sejahtera-green-village",
  pagePath: "/proyek/sejahtera-green-village",
  tracking: { utmSource: "facebook", landingPath: "/proyek/sejahtera-green-village" },
};

beforeEach(() => {
  state.allowed = true;
  state.turnstile = true;
  state.rpcError = null;
  state.project = { id: "p1" };
  inserts.length = 0;
  rpc.mockClear();
  vi.unstubAllEnvs();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

const statuses = () =>
  inserts.filter((i) => i.table === "form_submissions").map((i) => i.row.status);

describe("submitLeadAction", () => {
  it("menyimpan lead dengan nomor E.164, proyek, sumber, UTM, dan catatan kiriman", async () => {
    const result = await submitLeadAction(valid);
    expect(result.data).toEqual({ ok: true, brochureUrl: null });
    expect(rpc).toHaveBeenCalledWith(
      "upsert_lead",
      expect.objectContaining({
        p_phone: "+6281234567890",
        p_project_id: "p1",
        p_source_kind: "website",
        p_source_detail: "Form minat website",
        p_email: null,
        p_note: "Info unit",
      }),
    );
    expect(inserts.find((i) => i.table === "utm_touchpoints")?.row).toMatchObject({
      lead_id: "lead-1",
      utm_source: "facebook",
    });
    expect(statuses()).toEqual(["diterima"]);
  });

  it("brosur menambah catatan permintaan brosur dan mengembalikan tautan PDF", async () => {
    const result = await submitLeadAction({
      ...valid,
      formKind: "brosur",
      projectSlug: "sejahtera-green-village",
      message: "",
    });
    expect(rpc).toHaveBeenCalledWith(
      "upsert_lead",
      expect.objectContaining({ p_note: "Minta brosur." }),
    );
    expect(result.data?.brochureUrl).toMatch(
      /^\/brosur\/sejahtera-green-village-[0-9a-f]{8}\.pdf$/,
    );
  });

  it("honeypot terisi: jawaban sukses tanpa menyimpan lead", async () => {
    const result = await submitLeadAction({ ...valid, website: "spam" });
    expect(result.data).toEqual({ ok: true, brochureUrl: null });
    expect(rpc).not.toHaveBeenCalled();
    expect(statuses()).toEqual(["ditolak_honeypot"]);
  });

  it("rate limit dan Turnstile gagal ditolak dengan pesan dan dicatat", async () => {
    state.allowed = false;
    expect((await submitLeadAction(valid)).serverError).toMatch(/Terlalu banyak kiriman/);
    state.allowed = true;
    state.turnstile = false;
    expect((await submitLeadAction(valid)).serverError).toMatch(/Verifikasi keamanan gagal/);
    expect(statuses()).toEqual(["ditolak_rate_limit", "ditolak_turnstile"]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("form tidak menulis di preview", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await submitLeadAction(valid)).serverError).toMatch(/tidak aktif di preview/);
    expect(inserts).toEqual([]);
  });

  it("tanpa persetujuan ditolak validasi sebelum menyentuh database", async () => {
    const result = await submitLeadAction({ ...valid, consent: false });
    expect(result.validationErrors).toBeDefined();
    expect(inserts).toEqual([]);
  });

  it("gagal simpan memberi pesan umum tanpa detail teknis", async () => {
    state.rpcError = { message: "relation does not exist" };
    expect((await submitLeadAction(valid)).serverError).toBe(
      "Terjadi kesalahan di server. Coba lagi sebentar lagi.",
    );
  });
});
