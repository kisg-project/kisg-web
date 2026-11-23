import {
  Agreement01Icon,
  Building03Icon,
  CalendarCheckIn01Icon,
  CalendarRemove01Icon,
  ClipboardCheckIcon,
  Clock01Icon,
  Contact01Icon,
  DashboardSquare01Icon,
  DocumentValidationIcon,
  FilterIcon,
  Home09Icon,
  Image01Icon,
  Invoice01Icon,
  Location01Icon,
  Money03Icon,
  Note01Icon,
  PackageIcon,
  Settings02Icon,
  Target02Icon,
  TaskDaily01Icon,
  UserGroupIcon,
  UserMultiple02Icon,
  UserSearch01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement as AppIcon } from "@hugeicons/react";
import { PORTAL_AREAS, ROLE_HOME } from "./portal";
import type { AppRole } from "./roles";

export type ShortcutTone = "green" | "violet" | "orange" | "blue" | "red" | "amber" | "gold";

export interface NavFeature {
  href: string;
  label: string;
  icon: AppIcon;
  tone: ShortcutTone;
  roles: readonly AppRole[];
  ready: boolean;
  rail?: boolean;
  bottom?: boolean;
}

export interface PortalNavItem {
  href: string;
  label: string;
  icon: AppIcon;
  home: boolean;
}

const rolesOf = (prefix: string) =>
  PORTAL_AREAS.find((area) => area.prefix === prefix)?.roles ?? [];
const OWNER = rolesOf("/portal/owner");
const ATTEND = rolesOf("/portal/absensi");
const STAFF: readonly AppRole[] = [
  "marketing_manager",
  "marketing",
  "site_manager",
  "site_supervisor",
  "finance",
];
const SALES: readonly AppRole[] = ["marketing_manager", "marketing"];
const SITE: readonly AppRole[] = ["site_manager", "site_supervisor"];

export const FEATURES: readonly NavFeature[] = [
  {
    href: "/portal/owner/absensi",
    label: "Kehadiran",
    icon: CalendarCheckIn01Icon,
    tone: "green",
    roles: OWNER,
    ready: true,
    rail: true,
    bottom: true,
  },
  {
    href: "/portal/owner/karyawan",
    label: "Karyawan",
    icon: UserGroupIcon,
    tone: "violet",
    roles: OWNER,
    ready: true,
    rail: true,
    bottom: true,
  },
  {
    href: "/portal/owner/titik-absensi",
    label: "Titik absensi",
    icon: Location01Icon,
    tone: "blue",
    roles: OWNER,
    ready: true,
    rail: true,
  },
  {
    href: "/portal/owner/jam-kerja",
    label: "Jam kerja",
    icon: Clock01Icon,
    tone: "orange",
    roles: OWNER,
    ready: true,
    rail: true,
  },
  {
    href: "/portal/absensi",
    label: "Absensi",
    icon: CalendarCheckIn01Icon,
    tone: "green",
    roles: ATTEND,
    ready: true,
    rail: true,
    bottom: true,
  },
  {
    href: "/portal/absensi/rencana",
    label: "Rencana kerja",
    icon: TaskDaily01Icon,
    tone: "violet",
    roles: ATTEND,
    ready: true,
  },
  {
    href: "/portal/absensi/hasil",
    label: "Hasil kerja",
    icon: ClipboardCheckIcon,
    tone: "blue",
    roles: ATTEND,
    ready: true,
  },
  {
    href: "/portal/crm",
    label: "CRM",
    icon: UserMultiple02Icon,
    tone: "violet",
    roles: rolesOf("/portal/crm"),
    ready: true,
    rail: true,
    bottom: true,
  },
  {
    href: "/portal/lapangan",
    label: "Lapangan",
    icon: Building03Icon,
    tone: "blue",
    roles: rolesOf("/portal/lapangan"),
    ready: false,
    rail: true,
    bottom: true,
  },
  {
    href: "/portal/admin",
    label: "Admin",
    icon: Settings02Icon,
    tone: "green",
    roles: rolesOf("/portal/admin"),
    ready: true,
    rail: true,
  },
  {
    href: "#leads",
    label: "Leads",
    icon: UserSearch01Icon,
    tone: "violet",
    roles: SALES,
    ready: false,
  },
  {
    href: "#pipeline",
    label: "Pipeline",
    icon: FilterIcon,
    tone: "blue",
    roles: SALES,
    ready: false,
  },
  {
    href: "#analisa",
    label: "Analisa konsumen",
    icon: DocumentValidationIcon,
    tone: "green",
    roles: SALES,
    ready: false,
  },
  {
    href: "#survei",
    label: "Jadwal survei",
    icon: Home09Icon,
    tone: "orange",
    roles: SALES,
    ready: false,
  },
  {
    href: "#booking",
    label: "Booking unit",
    icon: Agreement01Icon,
    tone: "gold",
    roles: SALES,
    ready: false,
  },
  {
    href: "#kontak",
    label: "Kontak",
    icon: Contact01Icon,
    tone: "red",
    roles: SALES,
    ready: false,
  },
  { href: "#target", label: "Target", icon: Target02Icon, tone: "red", roles: SALES, ready: false },
  {
    href: "#promosi",
    label: "Materi promosi",
    icon: Image01Icon,
    tone: "violet",
    roles: SALES,
    ready: false,
  },
  {
    href: "#progres",
    label: "Progres unit",
    icon: Building03Icon,
    tone: "blue",
    roles: SITE,
    ready: false,
  },
  {
    href: "#laporan-lapangan",
    label: "Laporan harian",
    icon: Note01Icon,
    tone: "violet",
    roles: SITE,
    ready: false,
  },
  {
    href: "#material",
    label: "Material",
    icon: PackageIcon,
    tone: "orange",
    roles: SITE,
    ready: false,
  },
  {
    href: "#kendala",
    label: "Kendala",
    icon: Wrench01Icon,
    tone: "red",
    roles: SITE,
    ready: false,
  },
  {
    href: "#pengajuan",
    label: "Pengajuan",
    icon: Invoice01Icon,
    tone: "amber",
    roles: [...OWNER, ...STAFF],
    ready: false,
  },
  {
    href: "#penggajian",
    label: "Penggajian",
    icon: Money03Icon,
    tone: "gold",
    roles: [...OWNER, "finance"],
    ready: false,
  },
  {
    href: "#penjualan",
    label: "Penjualan",
    icon: Target02Icon,
    tone: "red",
    roles: OWNER,
    ready: false,
  },
  {
    href: "#izin",
    label: "Izin dan cuti",
    icon: CalendarRemove01Icon,
    tone: "orange",
    roles: STAFF,
    ready: false,
  },
  {
    href: "#slip",
    label: "Slip gaji",
    icon: Money03Icon,
    tone: "gold",
    roles: STAFF,
    ready: false,
  },
  {
    href: "#notulen",
    label: "Notulen",
    icon: Note01Icon,
    tone: "violet",
    roles: [...OWNER, ...STAFF],
    ready: false,
  },
];

const allowed = (feature: NavFeature, roles: readonly AppRole[]) =>
  feature.roles.some((role) => roles.includes(role));

export function featuresFor(roles: readonly AppRole[], primary: AppRole): NavFeature[] {
  const home = ROLE_HOME[primary];
  const seen = new Set<string>();
  return FEATURES.filter((feature) => {
    if (
      !feature.ready ||
      feature.href === home ||
      !allowed(feature, roles) ||
      seen.has(feature.label)
    )
      return false;
    seen.add(feature.label);
    return true;
  });
}

const homeItem = (primary: AppRole): PortalNavItem => ({
  href: ROLE_HOME[primary],
  label: "Beranda",
  icon: DashboardSquare01Icon,
  home: true,
});

const toItem = (feature: NavFeature): PortalNavItem => ({
  href: feature.href,
  label: feature.label,
  icon: feature.icon,
  home: false,
});

export function railItems(roles: readonly AppRole[], primary: AppRole): PortalNavItem[] {
  return [
    homeItem(primary),
    ...featuresFor(roles, primary)
      .filter((item) => item.rail)
      .map(toItem),
  ];
}

export function bottomItems(roles: readonly AppRole[], primary: AppRole): PortalNavItem[] {
  const main = featuresFor(roles, primary)
    .filter((item) => item.bottom)
    .slice(0, 2)
    .map(toItem);
  return [homeItem(primary), ...main];
}
