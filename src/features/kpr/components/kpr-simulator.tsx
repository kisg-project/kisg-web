"use client";

import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useWatch,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPR_DEFAULTS } from "@/config/kpr";
import { formatRupiah, parseRupiah } from "@/lib/format";
import {
  kprKonvensionalSchema,
  kprSyariahSchema,
  type KprKonvensionalInput,
  type KprSyariahInput,
} from "../schemas/kpr";
import {
  calculateKprKonvensional,
  calculateKprSyariah,
  downPaymentFromPercent,
  downPaymentPercent,
} from "../utils/calculate";

const DISCLAIMER =
  "Hasil simulasi bersifat estimasi. Bunga, margin, dan angsuran akhir mengikuti ketentuan bank yang menyetujui pembiayaan.";

const noopSubscribe = () => () => undefined;

/**
 * true setelah React aktif di browser. Field dinonaktifkan sebelum itu supaya ketikan di HP lambat
 * tidak hilang tanpa validasi (race hydration).
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const text = String(value).trim().replace(",", ".");
  return text === "" ? Number.NaN : Number(text);
}

function parseMoney(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = parseRupiah(String(value));
  return parsed === null ? Number.NaN : Number(parsed);
}

interface FieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  suffix?: string;
  money?: boolean;
  hint?: string;
}

function NumberField<T extends FieldValues>({
  form,
  name,
  label,
  suffix,
  money = false,
  hint,
}: FieldProps<T>) {
  const id = useId();
  const error = form.formState.errors[name]?.message;
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {money ? (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-subtle-foreground">
            Rp
          </span>
        ) : null}
        <Input
          id={id}
          inputMode={money ? "numeric" : "decimal"}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={money ? "h-11 pl-10 tabular" : suffix ? "h-11 pr-16 tabular" : "h-11 tabular"}
          {...form.register(name, { setValueAs: money ? parseMoney : parseNumber })}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-subtle-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-subtle-foreground">
          {hint}
        </p>
      ) : null}
      {typeof error === "string" ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Field persen uang muka yang mengisi nominal uang muka di form. */
function DownPaymentPercentField({
  price,
  downPayment,
  onChange,
}: {
  price: number;
  downPayment: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const shown =
    draft ??
    (Number.isFinite(price) && Number.isFinite(downPayment)
      ? String(downPaymentPercent(price, downPayment))
      : "");
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Uang muka (persen)</Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          className="h-11 pr-10 tabular"
          value={shown}
          onChange={(event) => {
            setDraft(event.target.value);
            const percent = parseNumber(event.target.value);
            if (Number.isFinite(percent) && Number.isFinite(price))
              onChange(downPaymentFromPercent(price, percent));
          }}
          onBlur={() => {
            setDraft(null);
          }}
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-subtle-foreground">
          %
        </span>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className={emphasis ? "font-semibold" : "text-subtle-foreground"}>{label}</dt>
      <dd
        className={
          emphasis ? "text-xl font-bold text-primary tabular sm:text-2xl" : "font-semibold tabular"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function ResultPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-surface p-5" aria-live="polite">
      <h3 className="text-base font-bold">Hasil simulasi</h3>
      {children}
      <p className="mt-3 text-xs text-subtle-foreground">{DISCLAIMER}</p>
    </div>
  );
}

function InvalidResult() {
  return (
    <p className="mt-3 text-sm text-subtle-foreground">
      Lengkapi data di form untuk melihat hasil.
    </p>
  );
}

function KonvensionalForm({ price }: { price: number }) {
  const hydrated = useHydrated();
  const defaults = KPR_DEFAULTS.konvensional;
  const form = useForm<KprKonvensionalInput>({
    resolver: zodResolver(kprKonvensionalSchema),
    mode: "onChange",
    defaultValues: {
      price,
      downPayment: downPaymentFromPercent(price, defaults.downPaymentPercent),
      tenorYears: defaults.tenorYears,
      fixedRatePercent: defaults.fixedRatePercent,
      fixedYears: defaults.fixedYears,
      floatingRatePercent: defaults.floatingRatePercent,
    },
  });
  const values = useWatch({ control: form.control });
  const parsed = kprKonvensionalSchema.safeParse(values);
  const result = parsed.success ? calculateKprKonvensional(parsed.data) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        noValidate
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <fieldset disabled={!hydrated} className="contents">
          <div className="sm:col-span-2">
            <NumberField form={form} name="price" label="Harga rumah" money />
          </div>
          <DownPaymentPercentField
            price={values.price ?? Number.NaN}
            downPayment={values.downPayment ?? Number.NaN}
            onChange={(value) => {
              form.setValue("downPayment", value, { shouldValidate: true });
            }}
          />
          <NumberField form={form} name="downPayment" label="Uang muka (rupiah)" money />
          <NumberField form={form} name="tenorYears" label="Tenor" suffix="tahun" />
          <NumberField form={form} name="fixedYears" label="Masa bunga fixed" suffix="tahun" />
          <NumberField form={form} name="fixedRatePercent" label="Bunga fixed" suffix="% / tahun" />
          <NumberField
            form={form}
            name="floatingRatePercent"
            label="Bunga floating"
            suffix="% / tahun"
          />
          <p className="text-xs text-subtle-foreground sm:col-span-2">
            Angka awal bunga dan masa fixed hanya contoh. Ubah sesuai penawaran bank.
          </p>
        </fieldset>
      </form>
      <ResultPanel>
        {result ? (
          <dl className="mt-3 divide-y">
            <ResultRow
              emphasis
              label={
                result.monthlyFloating === null
                  ? "Cicilan per bulan"
                  : `Cicilan per bulan, tahun 1 sampai ${result.fixedMonths / 12}`
              }
              value={formatRupiah(result.monthlyFixed)}
            />
            {result.monthlyFloating !== null ? (
              <ResultRow
                label={`Perkiraan cicilan setelah masa fixed (${result.floatingMonths} bulan)`}
                value={formatRupiah(result.monthlyFloating)}
              />
            ) : null}
            <ResultRow label="Uang muka" value={formatRupiah(result.downPayment)} />
            <ResultRow label="Pokok pinjaman" value={formatRupiah(result.loanAmount)} />
            <ResultRow label="Total bunga" value={formatRupiah(result.totalInterest)} />
            <ResultRow label="Total pembayaran cicilan" value={formatRupiah(result.totalPayment)} />
          </dl>
        ) : (
          <InvalidResult />
        )}
      </ResultPanel>
    </div>
  );
}

function SyariahForm({ price }: { price: number }) {
  const hydrated = useHydrated();
  const defaults = KPR_DEFAULTS.syariah;
  const form = useForm<KprSyariahInput>({
    resolver: zodResolver(kprSyariahSchema),
    mode: "onChange",
    defaultValues: {
      price,
      downPayment: downPaymentFromPercent(price, defaults.downPaymentPercent),
      tenorYears: defaults.tenorYears,
      marginPercent: defaults.marginPercent,
    },
  });
  const values = useWatch({ control: form.control });
  const parsed = kprSyariahSchema.safeParse(values);
  const result = parsed.success ? calculateKprSyariah(parsed.data) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        noValidate
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <fieldset disabled={!hydrated} className="contents">
          <div className="sm:col-span-2">
            <NumberField form={form} name="price" label="Harga rumah" money />
          </div>
          <DownPaymentPercentField
            price={values.price ?? Number.NaN}
            downPayment={values.downPayment ?? Number.NaN}
            onChange={(value) => {
              form.setValue("downPayment", value, { shouldValidate: true });
            }}
          />
          <NumberField form={form} name="downPayment" label="Uang muka (rupiah)" money />
          <NumberField form={form} name="tenorYears" label="Tenor" suffix="tahun" />
          <NumberField
            form={form}
            name="marginPercent"
            label="Margin"
            suffix="% / tahun"
            hint="Margin flat per tahun (akad murabahah). Angka awal hanya contoh."
          />
        </fieldset>
      </form>
      <ResultPanel>
        {result ? (
          <dl className="mt-3 divide-y">
            <ResultRow
              emphasis
              label="Angsuran tetap per bulan"
              value={formatRupiah(result.monthly)}
            />
            <ResultRow label="Lama angsuran" value={`${result.months} bulan`} />
            <ResultRow label="Uang muka" value={formatRupiah(result.downPayment)} />
            <ResultRow label="Pembiayaan" value={formatRupiah(result.financingAmount)} />
            <ResultRow label="Total margin" value={formatRupiah(result.totalMargin)} />
            <ResultRow
              label="Total pembayaran angsuran"
              value={formatRupiah(result.totalPayment)}
            />
          </dl>
        ) : (
          <InvalidResult />
        )}
      </ResultPanel>
    </div>
  );
}

/** Simulasi KPR konvensional dan syariah. Semua angka bisa diubah pengunjung. */
export function KprSimulator({ price }: { price: number }) {
  return (
    <Tabs defaultValue="konvensional" className="gap-6">
      <TabsList className="h-11 w-full sm:w-auto">
        <TabsTrigger value="konvensional" className="flex-1 sm:flex-none">
          KPR konvensional
        </TabsTrigger>
        <TabsTrigger value="syariah" className="flex-1 sm:flex-none">
          KPR syariah
        </TabsTrigger>
      </TabsList>
      <TabsContent value="konvensional">
        <KonvensionalForm price={price} />
      </TabsContent>
      <TabsContent value="syariah">
        <SyariahForm price={price} />
      </TabsContent>
    </Tabs>
  );
}
