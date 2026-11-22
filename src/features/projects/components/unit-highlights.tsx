import Link from "next/link";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Calculator,
  CarFront,
  CircleCheck,
  CircleMinus,
  House,
  LandPlot,
  Landmark,
  LockKeyhole,
  MapPin,
  Route,
  ShoppingCart,
  TrainFront,
  Trees,
  type LucideIcon,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NearbyPlace, UnitType } from "../types";
import { formatNearbyDistance } from "../utils/map";

// Ikon fasilitas unit dicocokkan dari nama (diisi admin). Nama yang tidak dikenal memakai ikon umum.
const FEATURE_ICONS: [RegExp, LucideIcon][] = [
  [/carport|garasi|car ?porch/i, CarFront],
  [/halaman|taman/i, Trees],
  [/smart|kunci|door lock/i, LockKeyhole],
];

const NEARBY: Record<string, { icon: LucideIcon; label: string }> = {
  transportasi: { icon: TrainFront, label: "Transportasi umum" },
  tol: { icon: Route, label: "Akses tol" },
  bank: { icon: Landmark, label: "Perbankan" },
  belanja: { icon: ShoppingCart, label: "Belanja" },
};

function featureIcon(name: string): LucideIcon {
  return FEATURE_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? CircleCheck;
}

interface Highlight {
  icon: LucideIcon;
  label: string;
  value?: string;
  detail?: string;
}

function IconChip({ icon: Icon, size = "md" }: { icon: LucideIcon; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary-700 text-white",
        size === "lg" ? "size-12 rounded-2xl" : "size-11 rounded-xl",
      )}
    >
      <Icon aria-hidden="true" className={size === "lg" ? "size-6" : "size-5"} />
    </span>
  );
}

/** Empat angka utama unit sebagai kartu yang sama besar. */
function SpecGrid({ items }: { items: Highlight[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground">Spesifikasi</h3>
      <ul aria-label="Spesifikasi" className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map(({ icon, value, label }) => (
          <li key={label} className="flex items-center gap-3 rounded-2xl bg-surface p-4">
            <IconChip icon={icon} size="lg" />
            <span className="min-w-0 leading-tight">
              <span className="block text-xl font-extrabold text-foreground tabular">{value}</span>
              <span className="block text-sm text-subtle-foreground">{label}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Panel daftar dengan baris sejajar: ikon, nama, dan keterangan singkat. */
function DetailPanel({ label, items }: { label: string; items: Highlight[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
      <ul aria-label={label} className="mt-2 divide-y divide-border">
        {items.map(({ icon, label: name, detail }) => (
          <li key={name} className="flex min-h-16 items-center gap-3 py-2.5">
            <IconChip icon={icon} />
            <span className="min-w-0 leading-tight">
              <span className="block font-semibold text-foreground">{name}</span>
              {detail ? (
                <span className="mt-0.5 block text-sm text-muted-foreground">{detail}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CostList({
  title,
  items,
  included,
}: {
  title: string;
  items: readonly string[];
  included: boolean;
}) {
  const Icon = included ? CircleCheck : CircleMinus;
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 grid gap-1.5 text-sm text-subtle-foreground">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Icon
              aria-hidden="true"
              className={cn(
                "mt-0.5 size-4 shrink-0",
                included ? "text-success-700" : "text-neutral-600",
              )}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Ringkasan tipe unit: harga, empat angka spesifikasi, fasilitas unit, akses sekitar (kategori dan
 * jarak kalau sudah diisi), dan rincian biaya. Tanpa efek hover (keputusan owner, 22 November 2026).
 */
export function UnitHighlights({
  unitType,
  nearby,
  className,
}: {
  unitType: UnitType;
  nearby: readonly NearbyPlace[];
  className?: string;
}) {
  const specs: Highlight[] = [
    { icon: BedDouble, value: String(unitType.bedrooms), label: "Kamar tidur" },
    { icon: Bath, value: String(unitType.bathrooms), label: "Kamar mandi" },
    { icon: House, value: `${String(unitType.buildingArea)} m²`, label: "Luas bangunan" },
    { icon: LandPlot, value: `${String(unitType.landArea)} m²`, label: "Luas tanah" },
  ];
  const features: Highlight[] = unitType.features.map((name) => ({
    icon: featureIcon(name),
    label: name,
    detail: "Termasuk di unit",
  }));
  const places: Highlight[] = nearby.map((place) => {
    const meta = NEARBY[place.category];
    const detail = [meta?.label, formatNearbyDistance(place)].filter(Boolean).join(", ");
    return { icon: meta?.icon ?? MapPin, label: place.name, detail: detail || undefined };
  });
  const hasCosts = unitType.priceIncludes.length > 0 || unitType.priceExcludes.length > 0;

  return (
    <div
      className={cn(
        "rounded-[2rem] border border-primary-100 bg-card p-5 shadow-sm sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Tipe unit</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-primary-950 dark:text-primary-50">
            {unitType.name}
          </h2>
        </div>
        <div className="sm:text-right">
          <p className="text-sm font-semibold text-muted-foreground">Harga</p>
          <p className="text-2xl font-extrabold text-highlight-text tabular">
            {unitType.price === null ? "Hubungi marketing" : formatRupiah(unitType.price)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <SpecGrid items={specs} />
        <div className="grid gap-4 lg:grid-cols-2">
          <DetailPanel label="Fasilitas" items={features} />
          <DetailPanel label="Akses dan sekitar" items={places} />
        </div>
        {unitType.materials.length > 0 ? (
          <div className="rounded-2xl border border-border p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-muted-foreground">Spesifikasi bangunan</h3>
            <dl aria-label="Spesifikasi bangunan" className="mt-2 grid gap-x-8 sm:grid-cols-2">
              {unitType.materials.map((item) => (
                <div
                  key={item.label}
                  className="flex min-h-12 items-center justify-between gap-4 border-b border-border py-2.5"
                >
                  <dt className="text-sm text-subtle-foreground">{item.label}</dt>
                  <dd className="text-right font-semibold text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
        {hasCosts ? (
          <div className="grid gap-4 rounded-2xl bg-surface p-5 sm:grid-cols-2">
            {unitType.priceIncludes.length > 0 ? (
              <CostList title="Harga sudah termasuk" items={unitType.priceIncludes} included />
            ) : null}
            {unitType.priceExcludes.length > 0 ? (
              <CostList title="Belum termasuk" items={unitType.priceExcludes} included={false} />
            ) : null}
          </div>
        ) : null}
        {unitType.price !== null ? (
          <Link
            href="/simulasi-kpr"
            className="inline-flex min-h-11 items-center gap-2 justify-self-start rounded-full bg-primary-50 px-5 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-100"
          >
            <Calculator aria-hidden="true" className="size-4" />
            Hitung cicilan KPR tipe ini
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
