import { beforeEach, describe, expect, it, vi } from "vitest";

const POST_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

const state = {
  roles: ["cms"] as string[],
  existingPublishedAt: null as string | null,
  existing: true,
  writeError: null as { code?: string; message: string } | null,
};
const writes: { table: string; op: string; values: Record<string, unknown> }[] = [];
const updateTag = vi.fn<(tag: string) => void>();

vi.mock("next/cache", () => ({ updateTag }));
vi.mock("@/env", () => ({ env: {} }));

function from(table: string) {
  let op = "select";
  const query = {
    select: () => query,
    eq: () => query,
    is: () => query,
    insert: (values: Record<string, unknown>) => {
      op = "insert";
      writes.push({ table, op, values });
      return query;
    },
    update: (values: Record<string, unknown>) => {
      op = "update";
      writes.push({ table, op, values });
      return query;
    },
    single: () =>
      Promise.resolve(
        state.writeError
          ? { data: null, error: state.writeError }
          : { data: { id: POST_ID }, error: null },
      ),
    maybeSingle: () => {
      if (table === "profiles") {
        return Promise.resolve({
          data: {
            email: "cms@kis.test",
            full_name: "Pengelola CMS",
            phone: null,
            avatar_path: null,
            activated_at: null,
            needs_password: false,
            is_active: true,
            deleted_at: null,
          },
          error: null,
        });
      }
      return Promise.resolve({
        data: state.existing ? { published_at: state.existingPublishedAt } : null,
        error: null,
      });
    },
    then: (resolve: (value: unknown) => void) => {
      if (table === "user_roles") {
        resolve({
          data: state.roles.map((role, index) => ({ role, is_primary: index === 0 })),
          error: null,
        });
        return;
      }
      resolve({ error: state.writeError });
    },
  };
  return query;
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: { getClaims: () => Promise.resolve({ data: { claims: { sub: "cms-1" } } }) },
      from,
    }),
}));

const { deleteCareerAction, deletePostAction, saveCareerAction, savePostAction } =
  await import("./content");

const post = {
  title: "Judul berita uji",
  slug: "judul-berita-uji",
  excerpt: "Ringkasan berita uji yang cukup panjang.",
  coverPath: "",
  coverAlt: "",
  body: [{ type: "paragraph" as const, text: "Isi" }],
  status: "terbit" as const,
};

beforeEach(() => {
  state.roles = ["cms"];
  state.existingPublishedAt = null;
  state.existing = true;
  state.writeError = null;
  writes.length = 0;
  updateTag.mockClear();
});

describe("savePostAction", () => {
  it("berita baru yang terbit mendapat tanggal terbit dan cache berita diperbarui", async () => {
    expect((await savePostAction(post)).data).toEqual({ id: POST_ID });
    const insert = writes.find((write) => write.op === "insert");
    expect(insert?.values).toMatchObject({
      slug: "judul-berita-uji",
      content_status: "terbit",
      cover_path: null,
      cover_alt: null,
      created_by: "cms-1",
    });
    expect(insert?.values.published_at).toEqual(expect.any(String));
    expect(updateTag).toHaveBeenCalledWith("posts");
  });

  it("draf tidak punya tanggal terbit", async () => {
    await savePostAction({ ...post, status: "draft" });
    expect(writes.find((write) => write.op === "insert")?.values.published_at).toBeNull();
  });

  it("mengubah berita terbit tidak mengubah tanggal terbitnya", async () => {
    state.existingPublishedAt = "2026-11-20T10:00:00Z";
    await savePostAction({ ...post, id: POST_ID });
    expect(writes.find((write) => write.op === "update")?.values.published_at).toBe(
      "2026-11-20T10:00:00Z",
    );
  });

  it("berita yang sudah dihapus tidak bisa diubah", async () => {
    state.existing = false;
    expect((await savePostAction({ ...post, id: POST_ID })).serverError).toMatch(/tidak ditemukan/);
  });

  it("slug bentrok diberi pesan jelas", async () => {
    state.writeError = { code: "23505", message: "duplicate key" };
    expect((await savePostAction(post)).serverError).toMatch(/Slug sudah dipakai berita lain/);
  });

  it("sampul wajib punya teks alternatif", async () => {
    const result = await savePostAction({ ...post, coverPath: "https://contoh.id/a.webp" });
    expect(result.validationErrors).toBeDefined();
  });

  it("hanya akun CMS", async () => {
    state.roles = ["owner"];
    expect((await savePostAction(post)).serverError).toBe("Anda tidak punya akses untuk aksi ini.");
    expect(writes).toHaveLength(0);
  });
});

describe("lowongan dan hapus", () => {
  it("lowongan disimpan dengan jenjang, teks kosong menjadi null", async () => {
    await saveCareerAction({
      title: "Staf teknik sipil",
      slug: "staf-teknik-sipil",
      department: "",
      location: "Bekasi",
      employmentType: "",
      level: "lapangan",
      closesOn: "",
      description: [{ type: "paragraph", text: "Mengawasi pekerjaan." }],
      requirements: ["S1 Teknik Sipil"],
      status: "terbit",
    });
    expect(writes.find((write) => write.op === "insert")?.values).toMatchObject({
      level: "lapangan",
      department: null,
      employment_type: null,
      closes_on: null,
      location: "Bekasi",
    });
    expect(updateTag).toHaveBeenCalledWith("careers");
  });

  it("hapus berita dan lowongan adalah soft delete", async () => {
    await deletePostAction({ id: POST_ID });
    await deleteCareerAction({ id: POST_ID });
    expect(writes.map((write) => [write.table, Object.keys(write.values)])).toEqual([
      ["posts", ["deleted_at"]],
      ["careers", ["deleted_at"]],
    ]);
  });
});
