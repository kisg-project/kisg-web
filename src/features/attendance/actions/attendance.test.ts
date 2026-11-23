import { beforeEach, describe, expect, it, vi } from "vitest";

const USER = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const LOCATION = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const RECORD = "9b2d6c4e-1f3a-4b5c-8d7e-6f5a4b3c2d1e";
const PHOTO = `${USER}/2026-11-21/masuk-1.webp`;

const state = {
  roles: ["marketing"] as string[],
  rpcData: null as unknown,
  rpcError: null as { code?: string; message: string } | null,
  writeError: null as { message: string } | null,
  existingSchedule: null as { id: string } | null,
};
const rpcCalls: { name: string; args: Record<string, unknown> }[] = [];
const writes: { table: string; op: string; values?: unknown; filters: [string, unknown][] }[] = [];

vi.mock("@/env", () => ({ env: {} }));

const notifications = vi.hoisted(() => ({
  approversOf: vi.fn(() => Promise.resolve(["owner-1"])),
  notify: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/features/notifications/server", () => notifications);

function from(table: string) {
  const write: { table: string; op: string; values?: unknown; filters: [string, unknown][] } = {
    table,
    op: "select",
    filters: [],
  };
  const query = {
    select: () => query,
    eq: (column: string, value: unknown) => {
      write.filters.push([column, value]);
      return query;
    },
    neq: (column: string, value: unknown) => {
      write.filters.push([`!${column}`, value]);
      return query;
    },
    is: () => query,
    insert: (values: unknown) => {
      Object.assign(write, { op: "insert", values });
      writes.push(write);
      return query;
    },
    update: (values: unknown) => {
      Object.assign(write, { op: "update", values });
      writes.push(write);
      return query;
    },
    delete: () => {
      write.op = "delete";
      writes.push(write);
      return query;
    },
    single: () =>
      Promise.resolve(
        state.writeError
          ? { data: null, error: state.writeError }
          : { data: { id: LOCATION }, error: null },
      ),
    maybeSingle: () => {
      if (table === "profiles") {
        return Promise.resolve({
          data: {
            email: "uji@kis.test",
            full_name: "Karyawan Uji",
            phone: "+6281234567890",
            avatar_path: "a.webp",
            activated_at: "2026-11-20T00:00:00Z",
            needs_password: false,
            is_active: true,
            deleted_at: null,
          },
          error: null,
        });
      }
      if (table === "work_locations") {
        return Promise.resolve({ data: { name: "Kantor Bekasi" }, error: null });
      }
      return Promise.resolve({ data: state.existingSchedule, error: null });
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
      auth: { getClaims: () => Promise.resolve({ data: { claims: { sub: USER } } }) },
      from,
      rpc: (name: string, args: Record<string, unknown>) => {
        if (name === "my_inherited_duties") return Promise.resolve({ data: [], error: null });
        rpcCalls.push({ name, args });
        return Promise.resolve({ data: state.rpcData, error: state.rpcError });
      },
    }),
}));

const {
  clockAction,
  deleteScheduleAction,
  requestExceptionAction,
  saveScheduleAction,
  saveWorkLocationAction,
} = await import("./attendance");

const clockInput = {
  kind: "masuk" as const,
  lat: -6.2,
  lng: 106.8,
  accuracy: 12.345,
  photoPath: PHOTO,
};

beforeEach(() => {
  state.roles = ["marketing"];
  state.rpcData = null;
  state.rpcError = null;
  state.writeError = null;
  state.existingSchedule = null;
  rpcCalls.length = 0;
  writes.length = 0;
});

describe("clockAction", () => {
  it("mengirim lokasi ke database dan menambahkan nama titik", async () => {
    state.rpcData = {
      status: "ok",
      record_id: RECORD,
      location_id: LOCATION,
      distance_m: 12,
      late_minutes: 5,
      early_minutes: 0,
    };
    const result = await clockAction(clockInput);
    expect(rpcCalls[0]).toEqual({
      name: "attendance_clock",
      args: { p_kind: "masuk", p_lat: -6.2, p_lng: 106.8, p_accuracy: 12.3, p_photo_path: PHOTO },
    });
    expect(result.data).toMatchObject({
      status: "ok",
      late_minutes: 5,
      locationName: "Kantor Bekasi",
    });
  });

  it("di luar radius dikembalikan dengan titik terdekat", async () => {
    state.rpcData = {
      status: "di_luar_radius",
      nearest_location_id: LOCATION,
      distance_m: 1200,
      radius_m: 100,
    };
    const result = await clockAction(clockInput);
    expect(result.data).toMatchObject({
      status: "di_luar_radius",
      distance_m: 1200,
      locationName: "Kantor Bekasi",
    });
  });

  it("pesan database untuk karyawan ditampilkan apa adanya", async () => {
    state.rpcError = { code: "22023", message: "Anda sudah clock in hari ini." };
    expect((await clockAction(clockInput)).serverError).toBe("Anda sudah clock in hari ini.");
  });

  it("akun yang tidak wajib absen mendapat pesan jelas", async () => {
    state.rpcError = { code: "42501", message: "permission denied" };
    expect((await clockAction(clockInput)).serverError).toBe("Akun ini tidak memakai absensi.");
  });

  it("respons tidak dikenal tidak dianggap berhasil", async () => {
    state.rpcData = { status: "aneh" };
    expect((await clockAction(clockInput)).serverError).toBeDefined();
    expect((await clockAction(clockInput)).data).toBeUndefined();
  });

  it("foto di luar folder yang sah ditolak sebelum ke database", async () => {
    const result = await clockAction({ ...clockInput, photoPath: "../rahasia.webp" });
    expect(result.validationErrors).toBeDefined();
    expect(rpcCalls).toHaveLength(0);
  });
});

describe("requestExceptionAction", () => {
  it("alasan dikirim bersama lokasi dan foto", async () => {
    state.rpcData = RECORD;
    const result = await requestExceptionAction({
      ...clockInput,
      reason: "  Survei lahan calon pembeli.  ",
    });
    expect(result.data).toEqual({ id: RECORD });
    expect(rpcCalls[0]?.name).toBe("request_attendance_exception");
    expect(rpcCalls[0]?.args.p_reason).toBe("Survei lahan calon pembeli.");
    expect(notifications.approversOf).toHaveBeenCalledWith(USER, ["owner", "admin"]);
    expect(notifications.notify).toHaveBeenCalledWith(
      ["owner-1"],
      expect.objectContaining({
        kind: "absen_luar_lokasi_diajukan",
        title: "Karyawan Uji mengajukan absen masuk di luar lokasi",
        href: "/portal/owner/absensi",
        dedupeKey: `absen-luar:${RECORD}:diajukan`,
        email: true,
      }),
    );
  });

  it("alasan terlalu pendek ditolak", async () => {
    const result = await requestExceptionAction({ ...clockInput, reason: "Survei" });
    expect(result.validationErrors?.reason?._errors?.[0]).toMatch(/minimal 10 karakter/);
  });
});

describe("pengaturan absensi (owner)", () => {
  const location = {
    name: "Kantor Bekasi",
    kind: "kantor" as const,
    projectId: null,
    lat: -6.2234567,
    lng: 106.9876543,
    radiusM: 100,
    isActive: true,
  };

  it("karyawan biasa tidak bisa menambah titik absensi", async () => {
    const result = await saveWorkLocationAction(location);
    expect(result.serverError).toBeDefined();
    expect(writes).toHaveLength(0);
  });

  it("owner menambah titik, koordinat dibulatkan 6 desimal", async () => {
    state.roles = ["owner"];
    const result = await saveWorkLocationAction(location);
    expect(result.data).toEqual({ id: LOCATION });
    expect(writes[0]).toMatchObject({
      table: "work_locations",
      op: "insert",
      values: { lat: -6.223457, lng: 106.987654, project_id: null, created_by: USER },
    });
  });

  it("titik jenis proyek wajib memilih proyek", async () => {
    state.roles = ["owner"];
    const result = await saveWorkLocationAction({ ...location, kind: "proyek" });
    expect(result.validationErrors?.projectId?._errors?.[0]).toMatch(/Pilih proyek/);
  });

  it("owner mengubah titik yang sudah ada", async () => {
    state.roles = ["owner"];
    await saveWorkLocationAction({ ...location, id: LOCATION });
    expect(writes[0]).toMatchObject({ op: "update", filters: [["id", LOCATION]] });
  });

  it("gagal menyimpan titik dilaporkan", async () => {
    state.roles = ["owner"];
    state.writeError = { message: "gagal" };
    expect((await saveWorkLocationAction(location)).serverError).toBeDefined();
  });

  const schedule = {
    scope: "lokasi" as const,
    targetId: LOCATION,
    startTime: "07:30",
    endTime: "16:30",
    workdays: [3, 1, 1, 2],
    lateToleranceMin: 10,
  };

  it("jam kerja per titik baru disimpan dengan hari kerja urut tanpa duplikat", async () => {
    state.roles = ["owner"];
    expect((await saveScheduleAction(schedule)).data).toEqual({ ok: true });
    expect(writes[0]).toMatchObject({
      table: "work_schedules",
      op: "insert",
      values: { work_location_id: LOCATION, user_id: null, workdays: [1, 2, 3], created_by: USER },
    });
  });

  it("jam kerja yang sudah ada diperbarui, bukan ditambah", async () => {
    state.roles = ["owner"];
    state.existingSchedule = { id: RECORD };
    await saveScheduleAction({ ...schedule, scope: "karyawan", targetId: USER });
    expect(writes[0]).toMatchObject({
      op: "update",
      values: { user_id: USER, work_location_id: null },
      filters: [["id", RECORD]],
    });
  });

  it("jam pulang harus setelah jam masuk dan target wajib dipilih", async () => {
    state.roles = ["owner"];
    const result = await saveScheduleAction({ ...schedule, endTime: "07:00", targetId: null });
    expect(result.validationErrors?.endTime?._errors?.[0]).toMatch(/setelah jam masuk/);
    expect(result.validationErrors?.targetId?._errors?.[0]).toMatch(/Pilih titik/);
  });

  it("gagal menyimpan jam kerja dilaporkan", async () => {
    state.roles = ["owner"];
    state.writeError = { message: "gagal" };
    expect((await saveScheduleAction(schedule)).serverError).toBeDefined();
  });

  it("hapus jam kerja tidak pernah menyentuh jam perusahaan", async () => {
    state.roles = ["owner"];
    expect((await deleteScheduleAction({ id: RECORD })).data).toEqual({ ok: true });
    expect(writes[0]).toMatchObject({
      op: "delete",
      filters: [
        ["id", RECORD],
        ["!scope", "perusahaan"],
      ],
    });
  });

  it("gagal menghapus jam kerja dilaporkan", async () => {
    state.roles = ["owner"];
    state.writeError = { message: "gagal" };
    expect((await deleteScheduleAction({ id: RECORD })).serverError).toBeDefined();
  });
});
