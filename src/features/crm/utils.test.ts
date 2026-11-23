import { describe, expect, it } from "vitest";
import type { LeadSummary } from "./types";
import { leadsForView, matchesLead, slaState } from "./utils";

const base: LeadSummary = {
  id: "a",
  fullName: "Budi Santoso",
  phone: "+6281234567890",
  projectName: "Sejahtera Green Village",
  source: "website",
  stage: "baru",
  ownerId: "m1",
  ownerName: "Marketing Satu",
  slaDueAt: "2026-11-23T03:30:00Z",
  firstResponseAt: null,
  createdAt: "2026-11-23T03:00:00Z",
  lastActivityAt: "2026-11-23T03:00:00Z",
};

describe("slaState", () => {
  it("menghitung sisa menit sebelum batas respons", () => {
    expect(slaState(base, new Date("2026-11-23T03:10:30Z"))).toEqual({
      kind: "berjalan",
      minutesLeft: 19,
      dueAt: base.slaDueAt,
    });
  });

  it("menandai lewat batas", () => {
    expect(slaState(base, new Date("2026-11-23T03:31:00Z")).kind).toBe("lewat");
  });

  it("selesai setelah respons pertama, tanpa batas di antrean", () => {
    expect(slaState({ ...base, firstResponseAt: "2026-11-23T03:05:00Z" }, new Date()).kind).toBe(
      "selesai",
    );
    expect(slaState({ ...base, ownerId: null, slaDueAt: null }, new Date()).kind).toBe("tanpa");
  });
});

describe("leadsForView", () => {
  const leads = [base, { ...base, id: "b", ownerId: null }, { ...base, id: "c", ownerId: "m2" }];

  it("memisahkan lead saya, antrean, dan semua", () => {
    expect(leadsForView(leads, "saya", "m1").map((lead) => lead.id)).toEqual(["a"]);
    expect(leadsForView(leads, "antrean", "m1").map((lead) => lead.id)).toEqual(["b"]);
    expect(leadsForView(leads, "semua", "m1")).toHaveLength(3);
  });
});

describe("matchesLead", () => {
  it("mencari nama, proyek, dan nomor HP dengan format lokal", () => {
    expect(matchesLead(base, "budi")).toBe(true);
    expect(matchesLead(base, "green")).toBe(true);
    expect(matchesLead(base, "0812 3456")).toBe(true);
    expect(matchesLead(base, "siti")).toBe(false);
    expect(matchesLead(base, "")).toBe(true);
  });
});
