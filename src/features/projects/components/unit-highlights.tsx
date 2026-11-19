import {
  Bath,
  BedDouble,
  CarFront,
  CircleCheck,
  CircleMinus,
  House,
  LandPlot,
  Landmark,
  LockKeyhole,
  Route,
  ShoppingCart,
  TrainFront,
  Trees,
  type LucideIcon,
} from "lucide-react";
import type { FeaturedProject } from "@/config/featured-project";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

const FEATURE_ICONS: Record<FeaturedProject["features"][number]["key"], LucideIcon> = {
  carport: CarFront,
  backyard: Trees,
  smartLock: LockKeyhole,
};

const NEARBY_ICONS: Record<FeaturedProject["nearby"][number]["key"], LucideIcon> = {
  station: TrainFront,
  toll: Route,
  bank: Landmark,
  shopping: ShoppingCart,
};

interface Highlight {
  icon: LucideIcon;
  label: string;
  value?: string;
}

function HighlightItem({ icon: Icon, label, value }: Highlight) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 text-sm leading-tight">
        {value ? <span className="block font-semibold text-foreground">{value}</span> : null}
        <span
          className={cn("block", value ? "text-muted-foreground" : "font-semibold text-foreground")}
        >
          {label}
        </span>
      </span>
    </li>
  );
}

function HighlightList({
  label,
  items,
  className,
}: {
  label: string;
  items: Highlight[];
  className?: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
      <ul aria-label={label} className={cn("mt-3 grid gap-4", className)}>
        {items.map((item) => (
          <HighlightItem key={item.label} {...item} />
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

/** Ringkasan spesifikasi unit, fasilitas, dan tempat sekitar dengan ikon, gaya situs listing rumah. */
export function UnitHighlights({
  project,
  className,
}: {
  project: FeaturedProject;
  className?: string;
}) {
  const { unitType } = project;
  const specs: Highlight[] = [
    { icon: BedDouble, value: `${unitType.bedrooms}`, label: "Kamar tidur" },
    { icon: Bath, value: `${unitType.bathrooms}`, label: "Kamar mandi" },
    { icon: House, value: `${unitType.buildingArea} m²`, label: "Luas bangunan" },
    { icon: LandPlot, value: `${unitType.landArea} m²`, label: "Luas tanah" },
  ];
  const features = project.features.map((item) => ({
    icon: FEATURE_ICONS[item.key],
    label: item.label,
  }));
  const nearby = project.nearby.map((item) => ({
    icon: NEARBY_ICONS[item.key],
    label: item.label,
  }));

  return (
    <div className={cn("rounded-lg border bg-card p-5 shadow-xs sm:p-6", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-xl font-bold">{unitType.name}</h2>
        <p className="text-xl font-bold text-highlight-text tabular">
          {formatRupiah(unitType.price)}
        </p>
      </div>
      <div className="mt-4 grid gap-4 rounded-md bg-surface p-4 sm:grid-cols-2">
        <CostList title="Harga sudah termasuk" items={project.priceIncludes} included />
        <CostList title="Belum termasuk" items={project.priceExcludes} included={false} />
      </div>
      <div className="mt-6 grid gap-6">
        <HighlightList label="Spesifikasi" items={specs} className="grid-cols-2 lg:grid-cols-4" />
        <HighlightList label="Fasilitas" items={features} className="grid-cols-1 sm:grid-cols-3" />
        <HighlightList
          label="Akses dan sekitar"
          items={nearby}
          className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        />
      </div>
    </div>
  );
}
