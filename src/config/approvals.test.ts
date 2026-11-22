import { describe, expect, it } from "vitest";
import { carriesCompanyStamp } from "./approvals";

describe("cap perusahaan", () => {
  it("hanya keputusan disetujui yang memakai cap KIS", () => {
    expect(carriesCompanyStamp("disetujui")).toBe(true);
    expect(carriesCompanyStamp("ditolak")).toBe(false);
  });
});
