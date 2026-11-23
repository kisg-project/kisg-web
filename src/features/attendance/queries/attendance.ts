import "server-only";
import { mustAttend } from "@/config/attendance";
import { ROLE_LABELS, type AppRole } from "@/config/roles";
import { workdaysFor, type ScheduleRule } from "../utils/schedule";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  scope: "perusahaan" | "lokasi" | "karyawan" | "role";
  targetId: string | null;
  role: AppRole | null;
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
      "id, scope, work_location_id, user_id, role, start_time, end_time, workdays, late_tolerance_min, work_locations(name), profiles(full_name)",
    )
    .order("scope");
  if (error) throw new Error(`Gagal memuat jam kerja: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    scope: row.scope,
    targetId: row.work_location_id ?? row.user_id,
    targetName:
      row.work_locations?.name ??
      row.profiles?.full_name ??
      (row.role ? ROLE_LABELS[row.role] : null),
    role: row.role,
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

export interface WorkReport {
  content: string;
  attachments: { path: string; name: string; type: string; size: number }[];
  updatedAt: string;
}

export async function getMyWorkReports(
  userId: string,
): Promise<{ rencana: WorkReport | null; hasil: WorkReport | null }> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("work_reports")
    .select("kind, content, attachments, updated_at")
    .eq("user_id", userId)
    .eq("work_date", todayWib());
  const pick = (kind: "rencana" | "hasil"): WorkReport | null => {
    const row = (data ?? []).find((item) => item.kind === kind);
    return row
      ? {
          content: row.content,
          attachments: row.attachments as unknown as WorkReport["attachments"],
          updatedAt: row.updated_at,
        }
      : null;
  };
  return { rencana: pick("rencana"), hasil: pick("hasil") };
}

export interface OverviewAttachment {
  name: string;
  type: string;
  size: number;
  url: string | null;
}

export interface OverviewReport {
  content: string;
  updatedAt: string;
  attachments: OverviewAttachment[];
}

export interface OverviewEmployee {
  id: string;
  name: string;
  day:
    | (AttendanceDay & { selfieIn: string | null; selfieOut: string | null; outside: boolean })
    | null;
  rencana: OverviewReport | null;
  hasil: OverviewReport | null;
}

export interface OverviewException {
  id: string;
  userName: string;
  kind: "masuk" | "pulang";
  workDate: string;
  requestedAt: string;
  nearestName: string | null;
  nearestDistanceM: number | null;
  reason: string;
  photoUrl: string | null;
  status: "menunggu" | "disetujui" | "ditolak";
  decidedAt: string | null;
  decisionNote: string | null;
  signerName: string | null;
  verifyCode: string | null;
}

export interface AttendanceOverview {
  date: string;
  employees: OverviewEmployee[];
  pending: OverviewException[];
  decided: OverviewException[];
  summary: { total: number; present: number; late: number; absent: number; pending: number };
}

const SIGNED_URL_SECONDS = 10 * 60;

const EXCEPTION_SELECT =
  "id, user_id, kind, work_date, requested_at, nearest_distance_m, reason, photo_path, status, decided_at, decision_note, nearest:work_locations!attendance_exceptions_nearest_location_id_fkey(name)";

type ExceptionRow = {
  id: string;
  user_id: string;
  kind: "masuk" | "pulang";
  work_date: string;
  requested_at: string;
  nearest_distance_m: number | null;
  reason: string;
  photo_path: string;
  status: "menunggu" | "disetujui" | "ditolak";
  decided_at: string | null;
  decision_note: string | null;
  nearest: { name: string } | null;
};

type OverviewRecordRow = RecordRow & {
  user_id: string;
  clock_in_photo_path: string;
  clock_out_photo_path: string | null;
  clock_in_exception_id: string | null;
  clock_out_exception_id: string | null;
};

type StoredAttachment = { path: string; name: string; type: string; size: number };

async function signedUrls(bucket: string, paths: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrls(unique, SIGNED_URL_SECONDS);
  return new Map(
    (data ?? []).flatMap((item) =>
      item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : [],
    ),
  );
}

export async function getAttendanceOverview(date: string): Promise<AttendanceOverview> {
  const supabase = await createSupabaseServerClient();
  const [people, records, reports, pendingRows, decidedRows] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, user_roles(role)")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("full_name"),
    supabase
      .from("attendance_records")
      .select(
        RECORD_SELECT +
          ", user_id, clock_in_photo_path, clock_out_photo_path, clock_in_exception_id, clock_out_exception_id",
      )
      .eq("work_date", date),
    supabase
      .from("work_reports")
      .select("user_id, kind, content, attachments, updated_at")
      .eq("work_date", date),
    supabase
      .from("attendance_exceptions")
      .select(EXCEPTION_SELECT)
      .eq("status", "menunggu")
      .order("requested_at"),
    supabase
      .from("attendance_exceptions")
      .select(EXCEPTION_SELECT)
      .eq("work_date", date)
      .neq("status", "menunggu")
      .order("decided_at", { ascending: false }),
  ]);
  if (people.error) throw new Error(`Gagal memuat karyawan: ${people.error.message}`);
  if (records.error) throw new Error(`Gagal memuat absensi: ${records.error.message}`);

  const staff = people.data.filter((row) => mustAttend(row.user_roles.map((item) => item.role)));
  const recordRows = records.data as unknown as OverviewRecordRow[];
  const reportRows = (reports.data ?? []).map((row) => ({
    ...row,
    attachments: row.attachments as unknown as StoredAttachment[],
  }));
  const pendingList = (pendingRows.data ?? []) as unknown as ExceptionRow[];
  const decidedList = (decidedRows.data ?? []) as unknown as ExceptionRow[];

  const [selfies, files, stamps] = await Promise.all([
    signedUrls("attendance-photos", [
      ...recordRows.flatMap((row) => [row.clock_in_photo_path, row.clock_out_photo_path ?? ""]),
      ...[...pendingList, ...decidedList].map((row) => row.photo_path),
    ]),
    signedUrls(
      "work-attachments",
      reportRows.flatMap((row) => row.attachments.map((item) => item.path)),
    ),
    decidedList.length > 0
      ? supabase
          .from("approval_stamps")
          .select("doc_id, signer_name, verify_code")
          .eq("doc_type", "absen_luar_lokasi")
          .in(
            "doc_id",
            decidedList.map((row) => row.id),
          )
      : Promise.resolve({ data: [] }),
  ]);
  const stampOf = new Map((stamps.data ?? []).map((row) => [row.doc_id, row]));
  const nameOf = new Map(people.data.map((row) => [row.id, row.full_name || row.email]));

  const toReport = (userId: string, kind: "rencana" | "hasil"): OverviewReport | null => {
    const row = reportRows.find((item) => item.user_id === userId && item.kind === kind);
    return row
      ? {
          content: row.content,
          updatedAt: row.updated_at,
          attachments: row.attachments.map((item) => ({
            name: item.name,
            type: item.type,
            size: item.size,
            url: files.get(item.path) ?? null,
          })),
        }
      : null;
  };

  const toException = (row: ExceptionRow): OverviewException => {
    const stamp = stampOf.get(row.id);
    return {
      id: row.id,
      userName: nameOf.get(row.user_id) ?? "Karyawan",
      kind: row.kind,
      workDate: row.work_date,
      requestedAt: row.requested_at,
      nearestName: row.nearest?.name ?? null,
      nearestDistanceM: row.nearest_distance_m,
      reason: row.reason,
      photoUrl: selfies.get(row.photo_path) ?? null,
      status: row.status,
      decidedAt: row.decided_at,
      decisionNote: row.decision_note,
      signerName: stamp?.signer_name ?? null,
      verifyCode: stamp?.verify_code ?? null,
    };
  };

  const employees: OverviewEmployee[] = staff.map((person) => {
    const record = recordRows.find((row) => row.user_id === person.id);
    return {
      id: person.id,
      name: person.full_name || person.email,
      day: record
        ? {
            ...toDay(record),
            selfieIn: selfies.get(record.clock_in_photo_path) ?? null,
            selfieOut: record.clock_out_photo_path
              ? (selfies.get(record.clock_out_photo_path) ?? null)
              : null,
            outside: Boolean(record.clock_in_exception_id ?? record.clock_out_exception_id),
          }
        : null,
      rencana: toReport(person.id, "rencana"),
      hasil: toReport(person.id, "hasil"),
    };
  });
  const pending = pendingList.map(toException);
  const present = employees.filter((item) => item.day).length;
  return {
    date,
    employees,
    pending,
    decided: decidedList.map(toException),
    summary: {
      total: employees.length,
      present,
      late: employees.filter((item) => (item.day?.lateMinutes ?? 0) > 0).length,
      absent: employees.length - present,
      pending: pending.length,
    },
  };
}

export interface AttendanceTrendDay {
  date: string;
  workday: boolean;
  onTime: number;
  late: number;
  absent: number;
  reportsComplete: number | null;
}

function addDays(date: string, days: number): string {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function isoWeekday(date: string): number {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

export async function getAttendanceTrend(days = 14): Promise<AttendanceTrendDay[]> {
  const supabase = await createSupabaseServerClient();
  const end = todayWib();
  const { data: first } = await supabase
    .from("attendance_records")
    .select("work_date")
    .order("work_date")
    .limit(1)
    .maybeSingle();
  const windowStart = addDays(end, -(days - 1));
  const start =
    first && first.work_date > windowStart ? first.work_date : first ? windowStart : end;
  const span = Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
  const [people, records, reports, schedule] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, created_at, user_roles(role, is_primary)")
      .eq("is_active", true)
      .is("deleted_at", null),
    supabase
      .from("attendance_records")
      .select("user_id, work_date, late_minutes")
      .gte("work_date", start)
      .lte("work_date", end),
    supabase
      .from("work_reports")
      .select("user_id, work_date, kind")
      .gte("work_date", start)
      .lte("work_date", end),
    supabase.from("work_schedules").select("scope, user_id, role, workdays"),
  ]);
  if (records.error) throw new Error(`Gagal memuat tren absensi: ${records.error.message}`);
  const staff = (people.data ?? []).filter((row) =>
    mustAttend(row.user_roles.map((item) => item.role)),
  );
  const staffIds = new Set(staff.map((row) => row.id));
  const rules: ScheduleRule[] = (schedule.data ?? []).map((row) => ({
    scope: row.scope,
    userId: row.user_id,
    role: row.role,
    workdays: row.workdays,
  }));
  const companyDays = new Set(
    rules.find((rule) => rule.scope === "perusahaan")?.workdays ?? [1, 2, 3, 4, 5, 6],
  );
  const staffDays = new Map(
    staff.map((row) => [
      row.id,
      new Set(
        workdaysFor(
          {
            id: row.id,
            roles: row.user_roles.map((item) => ({ role: item.role, isPrimary: item.is_primary })),
          },
          rules,
        ),
      ),
    ]),
  );
  const filed = new Set(
    (reports.data ?? []).map((row) => `${row.user_id}|${row.work_date}|${row.kind}`),
  );

  return Array.from({ length: span }, (_, index) => {
    const date = addDays(start, index);
    const present = records.data.filter(
      (row) => row.work_date === date && staffIds.has(row.user_id),
    );
    const late = present.filter((row) => row.late_minutes > 0).length;
    const weekday = isoWeekday(date);
    const presentIds = new Set(present.map((row) => row.user_id));
    const expected = staff.filter(
      (row) =>
        todayWib(new Date(row.created_at)) <= date && Boolean(staffDays.get(row.id)?.has(weekday)),
    );
    const workday = expected.length > 0 || companyDays.has(weekday);
    const complete = present.filter(
      (row) =>
        filed.has(`${row.user_id}|${date}|rencana`) && filed.has(`${row.user_id}|${date}|hasil`),
    ).length;
    return {
      date,
      workday,
      onTime: present.length - late,
      late,
      absent: expected.filter((row) => !presentIds.has(row.id)).length,
      reportsComplete: present.length > 0 ? Math.round((complete / present.length) * 100) : null,
    };
  });
}
