import { describe, expect, it } from "vitest";
import { workdaysFor, type ScheduleRule } from "./schedule";

const RULES: ScheduleRule[] = [
  { scope: "perusahaan", userId: null, role: null, workdays: [1, 2, 3, 4, 5, 6] },
  { scope: "role", userId: null, role: "marketing", workdays: [1, 2, 3, 4, 5, 6, 7] },
  { scope: "karyawan", userId: "khusus", role: null, workdays: [1, 2, 3] },
];

describe("hari kerja per karyawan", () => {
  it("marketing memakai jadwal role, termasuk hari Minggu", () => {
    expect(
      workdaysFor({ id: "a", roles: [{ role: "marketing", isPrimary: true }] }, RULES),
    ).toContain(7);
  });

  it("role tanpa jadwal khusus memakai jadwal perusahaan", () => {
    expect(workdaysFor({ id: "b", roles: [{ role: "finance", isPrimary: true }] }, RULES)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });

  it("jadwal per karyawan mengalahkan jadwal role", () => {
    expect(
      workdaysFor({ id: "khusus", roles: [{ role: "marketing", isPrimary: true }] }, RULES),
    ).toEqual([1, 2, 3]);
  });

  it("rangkap jabatan mendahulukan role utama", () => {
    const rules: ScheduleRule[] = [
      ...RULES,
      { scope: "role", userId: null, role: "finance", workdays: [1, 2, 3, 4, 5] },
    ];
    expect(
      workdaysFor(
        {
          id: "c",
          roles: [
            { role: "marketing", isPrimary: false },
            { role: "finance", isPrimary: true },
          ],
        },
        rules,
      ),
    ).toEqual([1, 2, 3, 4, 5]);
  });

  it("tanpa jadwal sama sekali memakai Senin sampai Sabtu", () => {
    expect(workdaysFor({ id: "d", roles: [] }, [])).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
