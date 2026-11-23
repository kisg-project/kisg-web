import { describe, expect, it } from "vitest";
import type { OrgPosition } from "./types";
import { coverageFor, delegateOptions, vacantCount } from "./utils";

const person = (id: string) => ({ id, name: `Orang ${id}` });
const holder = (id: string) => ({ id: `h-${id}`, person: person(id), startedAt: "2026-11-23" });

function position(
  id: string,
  parentId: string | null,
  holders: string[] = [],
  delegateToId: string | null = null,
): OrgPosition {
  return {
    id,
    code: id,
    title: `Jabatan ${id}`,
    departmentId: "d",
    level: 6,
    parentId,
    delegateToId,
    defaultRole: "marketing",
    holders: holders.map(holder),
  };
}

const owners = [person("owner")];

describe("coverageFor", () => {
  it("jabatan terisi dipegang pemegangnya sendiri", () => {
    const tree = [position("du", null, ["owner"]), position("mgr", "du", ["m1"])];
    const [, manager] = tree;
    expect(manager && coverageFor(manager, tree, owners).people).toEqual([person("m1")]);
  });

  it("jabatan kosong naik ke atasan terdekat yang terisi", () => {
    const tree = [
      position("du", null, ["owner"]),
      position("gm", "du"),
      position("mgr", "gm", ["m1"]),
      position("spv", "mgr"),
      position("staf", "spv"),
    ];
    const staf = tree[4];
    const result = staf ? coverageFor(staf, tree, owners) : null;
    expect(result?.people).toEqual([person("m1")]);
    expect(result?.via?.id).toBe("mgr");
  });

  it("pelimpahan khusus mengalahkan atasan langsung", () => {
    const tree = [
      position("du", null, ["owner"]),
      position("mgr", "du", ["m1"]),
      position("akuntansi", "mgr", ["a1"]),
      position("kasir", "mgr", [], "akuntansi"),
    ];
    const kasir = tree[3];
    expect(kasir && coverageFor(kasir, tree, owners).people).toEqual([person("a1")]);
  });

  it("seluruh rantai kosong berakhir di Direktur Utama", () => {
    const tree = [position("du", null), position("gm", "du"), position("staf", "gm")];
    const staf = tree[2];
    const result = staf ? coverageFor(staf, tree, owners) : null;
    expect(result?.people).toEqual(owners);
    expect(result?.via).toBeNull();
  });

  it("pelimpahan yang berputar tidak membuat macet", () => {
    const tree = [position("du", null), position("a", "du", [], "b"), position("b", "du", [], "a")];
    const a = tree[1];
    expect(a && coverageFor(a, tree, owners).people).toEqual(owners);
  });
});

describe("vacantCount dan delegateOptions", () => {
  it("menghitung jabatan kosong dan menolak pelimpahan ke diri sendiri atau berbalik", () => {
    const tree = [
      position("du", null, ["owner"]),
      position("a", "du", [], "b"),
      position("b", "du"),
    ];
    expect(vacantCount(tree)).toBe(2);
    const b = tree[2];
    expect(b ? delegateOptions(b, tree).map((item) => item.id) : []).toEqual(["du"]);
  });
});
