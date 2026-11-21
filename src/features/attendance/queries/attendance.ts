import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Tanggal kerja hari ini di Asia/Jakarta (YYYY-MM-DD), sama dengan private.today_wib(). */
export function todayWib(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(at);
}

export interface AttendanceDay {
  id: string;
  workDate: string;
  clockInAt: string;
  clockInLocation: string | null;
  lateMinutes: number;
  clockOutAt: string | null;
  clockOutLocation: string | null;
  earlyMinutes: number;
  /** Clock in dan clock out di titik absensi berbeda. */
  movedLocation: boolean;
}

export interface PendingException {
  id: string;
  kind: "masuk" | "pulang";
  requestedAt: string;
  status: "menunggu" | "disetujui" | "ditolak";
}

const RECORD_SELECT =
  "id, work_date, clock_in_at, late_minutes, clock_out_at, early_minutes, clock_in_location_id, clock_out_location_id, clock_in:work_locations!attendance_records_clock_in_location_id_fkey(name), clock_out:work_locations!attendance_records_clock_out_location_id_fkey(name)";

type RecordRow = {
  id: string;
  work_date: string;
  clock_in_at: string;
  late_minutes: number;
  clock_out_at: string | null;
  early_minutes: number;
  clock_in_location_id: string | null;
  clock_out_location_id: string | null;
  clock_in: { name: string } | null;
  clock_out: { name: string } | null;
};

function toDay(row: RecordRow): AttendanceDay {
  return {
    id: row.id,
    workDate: row.work_date,
    clockInAt: row.clock_in_at,
    clockInLocation: row.clock_in?.name ?? null,
    lateMinutes: row.late_minutes,
    clockOutAt: row.clock_out_at,
    clockOutLocation: row.clock_out?.name ?? null,
    earlyMinutes: row.early_minutes,
    movedLocation: Boolean(
      row.clock_out_location_id && row.clock_out_location_id !== row.clock_in_location_id,
    ),
  };
}

/** Absensi karyawan hari ini, riwayat 7 hari terakhir, dan pengajuan di luar lokasi hari ini. */
export async function getMyAttendance(userId: string): Promise<{
  today: AttendanceDay | null;
  history: AttendanceDay[];
  exceptions: PendingException[];
}> {
  const supabase = await createSupabaseServerClient();
  const today = todayWib();
  const [records, exceptions] = await Promise.all([
    supabase
      .from("attendance_records")
      .select(RECORD_SELECT)
      .eq("user_id", userId)
      .order("work_date", { ascending: false })
      .limit(8),
    supabase
      .from("attendance_exceptions")
      .select("id, kind, requested_at, status")
      .eq("user_id", userId)
      .eq("work_date", today)
      .order("requested_at", { ascending: false }),
  ]);
  if (records.error) throw new Error(`Gagal memuat absensi: ${records.error.message}`);
  const days = (records.data as unknown as RecordRow[]).map(toDay);
  return {
    today: days.find((day) => day.workDate === today) ?? null,
    history: days.filter((day) => day.workDate !== today).slice(0, 7),
    exceptions: (exceptions.data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind,
      requestedAt: row.requested_at,
      status: row.status,
    })),
  };
}

export interface WorkLocation {
  id: string;
  name: string;
  kind: "kantor" | "proyek";
  projectId: string | null;
  projectName: string | null;
  lat: number;
  lng: number;
  radiusM: number;
  isActive: boolean;
}

export async function listWorkLocations(): Promise<WorkLocation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("work_locations")
    .select("id, name, kind, project_id, lat, lng, radius_m, is_active, projects(name)")
    .is("deleted_at", null)
    .order("is_active", { ascending: false })
    .order("name");
  if (error) throw new Error(`Gagal memuat titik absensi: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    projectId: row.project_id,
    projectName: row.projects?.name ?? null,
    lat: row.lat,
    lng: row.lng,
    radiusM: row.radius_m,
    isActive: row.is_active,
  }));
}

export interface ProjectOption {
  id: string;
  name: string;
}

export async function listProjectOptions(): Promise<ProjectOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .is("deleted_at", null)
    .order("sort_order");
  return data ?? [];
}

export interface WorkSchedule {
  id: string;
  scope: "perusahaan" | "lokasi" | "karyawan";
  targetId: string | null;
  targetName: string | null;
  startTime: string;
  endTime: string;
  workdays: number[];
  lateToleranceMin: number;
}

export async function listWorkSchedules(): Promise<WorkSchedule[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("work_schedules")
    .select(
      "id, scope, work_location_id, user_id, start_time, end_time, workdays, late_tolerance_min, work_locations(name), profiles(full_name)",
    )
    .order("scope");
  if (error) throw new Error(`Gagal memuat jam kerja: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    scope: row.scope,
    targetId: row.work_location_id ?? row.user_id,
    targetName: row.work_locations?.name ?? row.profiles?.full_name ?? null,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    workdays: row.workdays,
    lateToleranceMin: row.late_tolerance_min,
  }));
}

export interface EmployeeOption {
  id: string;
  name: string;
}

/** Karyawan yang wajib absen (untuk jam kerja per karyawan). */
export async function listEmployeeOptions(): Promise<EmployeeOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, user_roles(role)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("full_name");
  return (data ?? [])
    .filter((row) => {
      const roles = row.user_roles.map((item) => item.role);
      return !roles.includes("owner") && !roles.includes("cms") && roles.length > 0;
    })
    .map((row) => ({ id: row.id, name: row.full_name || row.email }));
}
