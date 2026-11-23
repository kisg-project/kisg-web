import type { AppRole } from "@/config/roles";

export interface OrgPerson {
  id: string;
  name: string;
}

export interface OrgHolder {
  id: string;
  person: OrgPerson;
  startedAt: string;
}

export interface OrgPosition {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  level: number;
  parentId: string | null;
  delegateToId: string | null;
  defaultRole: AppRole;
  holders: OrgHolder[];
}

export interface OrgDepartment {
  id: string;
  name: string;
}

export interface OrgCoverage {
  people: OrgPerson[];
  via: OrgPosition | null;
}

export interface OrgChart {
  departments: OrgDepartment[];
  positions: OrgPosition[];
  owners: OrgPerson[];
  employees: OrgPerson[];
}
