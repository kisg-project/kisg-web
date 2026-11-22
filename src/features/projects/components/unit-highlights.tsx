import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NearbyPlace, UnitType } from "../types";
import { formatNearbyDistance } from "../utils/map";
import {
  ArrowRight02Icon,
  BankIcon,
  Bathtub01Icon,
  BedDoubleIcon,
  Calculator01Icon,
  Car01Icon,
  CheckmarkCircle02Icon,
  Home01Icon,
  Location01Icon,
  LockPasswordIcon,
  MapsSquare01Icon,
  MinusSignCircleIcon,
  Route01Icon,
  ShoppingCart01Icon,
  Train01Icon,
  Tree06Icon,
} from "@hugeicons/core-free-icons";
import { Icon, type AppIcon } from "@/components/shared/icon";

const FEATURE_ICONS: [RegExp, AppIcon][] = [
  [/carport|garasi|car ?porch/i, Car01Icon],
  [/halaman|taman/i, Tree06Icon],
  [/smart|kunci|door lock/i, LockPasswordIcon],
];

const NEARBY: Record<string, { icon: AppIcon; label: string }> = {
  transportasi: { icon: Train01Icon, label: "Transportasi umum" },
  tol: { icon: Route01Icon, label: "Akses tol" },
  bank: { icon: BankIcon, label: "Perbankan" },
  belanja: { icon: ShoppingCart01Icon, label: "Belanja" },
};

function featureIcon(name: string): AppIcon {
  return FEATURE_ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? CheckmarkCircle02Icon;
}

interface Highlight {
  icon: AppIcon;
  label: string;
  value?: string;
  detail?: string;
}

function IconChip({ icon, size = "md" }: { icon: AppIcon; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary-700 text-white",
        size === "lg" ? "size-12 rounded-2xl" : "size-11 rounded-xl",
      )}
    >
      <Icon icon={icon} className={size === "lg" ? "size-6" : "size-5"} />
    </span>
  );
}

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
  const mark = included ? CheckmarkCircle02Icon : MinusSignCircleIcon;
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 grid gap-1.5 text-sm text-subtle-foreground">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Icon
              icon={mark}
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
    { icon: BedDoubleIcon, value: String(unitType.bedrooms), label: "Kamar tidur" },
    { icon: Bathtub01Icon, value: String(unitType.bathrooms), label: "Kamar mandi" },
    { icon: Home01Icon, value: `${String(unitType.buildingArea)} m²`, label: "Luas bangunan" },
    { icon: MapsSquare01Icon, value: `${String(unitType.landArea)} m²`, label: "Luas tanah" },
  ];
  const features: Highlight[] = unitType.features.map((name) => ({
    icon: featureIcon(name),
    label: name,
    detail: "Termasuk di unit",
  }));
  const places: Highlight[] = nearby.map((place) => {
    const meta = NEARBY[place.category];
    const detail = [meta?.label, formatNearbyDistance(place)].filter(Boolean).join(", ");
    return { icon: meta?.icon ?? Location01Icon, label: place.name, detail: detail || undefined };
  });
  const hasCosts = unitType.priceIncludes.length > 0 || unitType.priceExcludes.length > 0;

  return (
    <section
      aria-labelledby={`unit-${unitType.slug}`}
      className={cn(
        "rounded-[2rem] border border-primary-100 bg-card p-5 shadow-sm sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Tipe unit</p>
          <h2
            id={`unit-${unitType.slug}`}
            className="text-2xl font-extrabold tracking-tight text-primary-950 dark:text-primary-50"
          >
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
            <Icon icon={Calculator01Icon} aria-hidden="true" className="size-4" />
            Hitung cicilan KPR tipe ini
            <Icon icon={ArrowRight02Icon} aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
