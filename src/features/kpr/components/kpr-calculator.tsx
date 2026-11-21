"use client";

import { useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch, type Control, type FieldPath } from "react-hook-form";
import { CircleCheck, CircleMinus, Download, Phone, Plus, Trash2 } from "lucide-react";
import { NumberInput } from "@/components/shared/number-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bankByKey } from "@/config/banks";
import { KPR_COST_GROUPS, KPR_DEFAULTS, KPR_LIMITS } from "@/config/kpr";
import {
  firstFixedYears,
  lowestRate,
  productsFor,
  type KprProduct,
  type KprScheme,
} from "@/config/kpr-products";
import { whatsappLink } from "@/config/site";
import { formatDateWIB, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { kprFormSchema, type KprFormInput } from "../schemas/kpr";
import { KPR_TERMS, type KprTerms } from "../terms";
import { calculateKpr, downPaymentFromPercent, downPaymentPercent } from "../utils/calculate";
import { calculateCosts } from "../utils/costs";

const noopSubscribe = () => () => undefined;

/** true setelah React aktif. Sebelum itu field readOnly supaya ketikan tidak hilang tanpa validasi. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function percentText(value: number): string {
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function productValues(
  product: KprProduct | null,
  scheme: KprScheme,
  tenorYears: number,
): Pick<KprFormInput, "segments" | "afterRatePercent" | "tenorYears"> {
  const fallbackAfter =
    scheme === "syariah"
      ? KPR_DEFAULTS.syariahAfterMarginPercent
      : KPR_DEFAULTS.floatingRatePercent;
  if (!product) {
    return { segments: [], afterRatePercent: fallbackAfter, tenorYears };
  }
  return {
    segments: product.segments.map((segment) => ({ ...segment })),
    afterRatePercent: product.afterRatePercent ?? fallbackAfter,
    tenorYears: clamp(tenorYears, product.tenor.min, product.tenor.max),
  };
}

function productPeriodText(product: KprProduct, terms: KprTerms): string {
  const years = firstFixedYears(product);
  if (years === null) return terms.fixedUntilEnd;
  if (product.segments.length > 1) {
    const total = product.segments.reduce((sum, segment) => sum + segment.years, 0);
    return `Berjenjang ${total} tahun`;
  }
  return `${product.scheme === "syariah" ? "Tetap" : "Fixed"} ${years} tahun`;
}

interface MoneyFieldProps {
  control: Control<KprFormInput>;
  name: FieldPath<KprFormInput>;
  label: string;
  readOnly: boolean;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
}

function NumberField({
  control,
  name,
  label,
  readOnly,
  decimals = 0,
  prefix,
  suffix,
  hint,
}: MoneyFieldProps) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor={id}>{label}</Label>
          <NumberInput
            id={id}
            name={field.name}
            value={typeof field.value === "number" ? field.value : Number.NaN}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            decimals={decimals}
            prefix={prefix}
            suffix={suffix}
            readOnly={readOnly}
            aria-invalid={fieldState.error ? true : undefined}
            aria-describedby={
              [hint ? `${id}-hint` : null, fieldState.error ? `${id}-error` : null]
                .filter(Boolean)
                .join(" ") || undefined
            }
          />
          {hint ? (
            <p id={`${id}-hint`} className="text-xs text-subtle-foreground">
              {hint}
            </p>
          ) : null}
          {fieldState.error?.message ? (
            <p id={`${id}-error`} className="text-sm text-destructive">
              {fieldState.error.message}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}

/** Kelompok isian form dengan judul kecil dan garis pemisah, supaya form panjang tetap mudah dibaca. */
function FormGroup({
  title,
  children,
  first = false,
}: {
  title: ReactNode;
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <div className={cn("grid min-w-0 gap-4 sm:grid-cols-2", !first && "border-t pt-5")}>
      <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase sm:col-span-2">
        {title}
      </p>
      {children}
    </div>
  );
}

function Stat({
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
      <dd className={cn("text-right tabular", emphasis ? "text-lg font-bold" : "font-semibold")}>
        {value}
      </dd>
    </div>
  );
}

interface KprCalculatorProps {
  scheme: KprScheme;
  price: number;
  projectName: string;
  unitName: string;
}

/** Simulasi KPR lengkap untuk satu skema (konvensional atau syariah). */
export function KprCalculator({ scheme, price, projectName, unitName }: KprCalculatorProps) {
  const terms = KPR_TERMS[scheme];
  const products = productsFor(scheme);
  const hydrated = useHydrated();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedId, setSelectedId] = useState<string>(products[0]?.id ?? "custom");
  const [pdfState, setPdfState] = useState<"idle" | "busy" | "error">("idle");
  const selected = products.find((product) => product.id === selectedId) ?? null;
  const schema = kprFormSchema(terms.rateLabel);

  const form = useForm<KprFormInput>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      price,
      downPayment: downPaymentFromPercent(price, KPR_DEFAULTS.downPaymentPercent),
      npoptkp: KPR_DEFAULTS.npoptkp,
      otherCostsPercent: KPR_DEFAULTS.otherCostsPercent,
      ...productValues(products[0] ?? null, scheme, KPR_DEFAULTS.tenorYears),
    },
  });
  // Tanpa useFieldArray: library itu membuat ID baris dengan crypto.randomUUID() saat render,
  // yang memblokir prerender Next.js (Cache Components). Daftar periode pendek dan tidak diurutkan
  // ulang, jadi key berdasarkan urutan aman.
  const segmentValues = useWatch({ control: form.control, name: "segments" });
  const setSegments = (next: KprFormInput["segments"]) => {
    form.setValue("segments", next, { shouldValidate: true });
  };
  const values = useWatch({ control: form.control });
  const parsed = schema.safeParse(values);
  const result = parsed.success ? calculateKpr(parsed.data) : null;
  const costs =
    parsed.success && result
      ? calculateCosts({
          price: parsed.data.price,
          downPayment: parsed.data.downPayment,
          loanAmount: result.loanAmount,
          npoptkp: parsed.data.npoptkp,
          bphtbRatePercent: KPR_DEFAULTS.bphtbRatePercent,
          otherCostsPercent: parsed.data.otherCostsPercent,
        })
      : null;

  const currentPrice = values.price ?? Number.NaN;
  const currentDp = values.downPayment ?? Number.NaN;
  const dpPercent =
    Number.isFinite(currentPrice) && Number.isFinite(currentDp)
      ? downPaymentPercent(currentPrice, currentDp)
      : Number.NaN;
  const tenorRange = selected?.tenor ?? KPR_LIMITS.tenorYears;
  // Error level array (total periode) diambil dari hasil schema, karena mode onChange hanya
  // memperbarui error field yang sedang diubah (misal segments.1.years), bukan "segments".
  const segmentsError = parsed.success
    ? undefined
    : parsed.error.issues.find((issue) => issue.path.length === 1 && issue.path[0] === "segments")
        ?.message;

  function chooseProduct(id: string, scroll: boolean) {
    const product = products.find((item) => item.id === id) ?? null;
    setSelectedId(product ? product.id : "custom");
    // "Atur sendiri": angka yang sedang diisi dipertahankan.
    if (!product) return;
    const next = productValues(
      product,
      scheme,
      form.getValues("tenorYears") || KPR_DEFAULTS.tenorYears,
    );
    setSegments(next.segments);
    form.setValue("afterRatePercent", next.afterRatePercent, { shouldValidate: true });
    form.setValue("tenorYears", next.tenorYears, { shouldValidate: true });
    if (scroll) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      formRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }

  async function handleDownload() {
    if (!parsed.success || !result || !costs) return;
    setPdfState("busy");
    try {
      const { downloadKprPdf } = await import("../utils/pdf");
      await downloadKprPdf({
        scheme,
        terms,
        projectName,
        unitName,
        programName: selected?.name ?? "Atur sendiri",
        price: parsed.data.price,
        downPayment: parsed.data.downPayment,
        tenorYears: parsed.data.tenorYears,
        npoptkp: parsed.data.npoptkp,
        otherCostsPercent: parsed.data.otherCostsPercent,
        includedCosts: KPR_COST_GROUPS[0].items,
        result,
        costs,
        generatedAt: new Date(),
      });
      setPdfState("idle");
    } catch {
      setPdfState("error");
    }
  }

  const firstPeriod = result?.periods[0];
  const waMessage = result
    ? `Halo, saya ingin konsultasi ${terms.title} ${projectName} ${unitName}. Simulasi saya: uang muka ${formatRupiah(result.downPayment)}, ${terms.installmentLower} mulai ${formatRupiah(firstPeriod?.monthly ?? 0)} per bulan, ${String(values.tenorYears ?? "")} tahun.`
    : `Halo, saya ingin konsultasi ${terms.title} ${projectName}.`;

  return (
    <div className="grid gap-8">
      {products.length > 0 ? (
        <section aria-labelledby={`${scheme}-produk`}>
          <h3 id={`${scheme}-produk`} className="text-lg font-bold">
            Pilihan produk {terms.title}
          </h3>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const bank = bankByKey(product.bankKey);
              const active = product.id === selectedId;
              return (
                <li
                  key={product.id}
                  className={cn(
                    "flex flex-col rounded-lg border bg-card p-4",
                    active && "border-primary ring-2 ring-primary/20",
                  )}
                >
                  <div className="flex h-10 items-center">
                    {bank.logo ? (
                      <Image
                        src={bank.logo.src}
                        alt={bank.name}
                        width={bank.logo.width}
                        height={bank.logo.height}
                        unoptimized
                        className="h-8 w-auto max-w-32 object-contain"
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary">{bank.name}</span>
                    )}
                  </div>
                  <p className="mt-3 font-semibold">{product.name}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-subtle-foreground">{terms.rate} mulai</dt>
                      <dd className="font-bold text-primary tabular">
                        {percentText(lowestRate(product))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-subtle-foreground">Periode</dt>
                      <dd className="font-semibold">{productPeriodText(product, terms)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-subtle-foreground">{terms.tenor}</dt>
                      <dd className="font-semibold tabular">
                        {product.tenor.min} sampai {product.tenor.max} tahun
                      </dd>
                    </div>
                  </dl>
                  {product.note ? (
                    <p className="mt-2 text-xs text-subtle-foreground">{product.note}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-subtle-foreground">
                    Sumber:{" "}
                    <a
                      href={product.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      {product.source.label}
                    </a>
                    , diakses {formatDateWIB(`${product.source.accessedOn}T00:00:00+07:00`)}.
                    {product.source.official ? "" : " Perlu konfirmasi ke marketing."}
                  </p>
                  <Button
                    type="button"
                    variant={active ? "default" : "outline"}
                    className="mt-4 w-full"
                    aria-pressed={active}
                    onClick={() => {
                      chooseProduct(product.id, true);
                    }}
                  >
                    Hitung {terms.installmentLower}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
        <form
          ref={formRef}
          noValidate
          className="min-w-0 scroll-mt-24 rounded-lg border bg-card p-5 shadow-xs sm:p-6 xl:col-span-7"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <fieldset aria-label={`Data KPR ${scheme}`} className="grid min-w-0 gap-5">
            <FormGroup first title="Program dan harga">
              <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor={`${scheme}-program`}>{terms.programLabel}</Label>
                <Select
                  value={selectedId}
                  disabled={!hydrated}
                  onValueChange={(value) => {
                    chooseProduct(value, false);
                  }}
                >
                  <SelectTrigger
                    id={`${scheme}-program`}
                    className="h-11 w-full min-w-0 rounded-md bg-background px-3"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-80">
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id} className="min-h-10">
                        {product.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom" className="min-h-10">
                      Atur sendiri
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <NumberField
                  control={form.control}
                  name="price"
                  label="Harga rumah"
                  prefix="Rp"
                  readOnly={!hydrated}
                />
              </div>
            </FormGroup>
            <FormGroup title="Uang muka">
              <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor={`${scheme}-dp-slider`}>
                  Uang muka: {Number.isFinite(dpPercent) ? percentText(dpPercent) : "-"}
                </Label>
                <input
                  id={`${scheme}-dp-slider`}
                  type="range"
                  min={0}
                  max={KPR_LIMITS.downPaymentSliderMax}
                  step={1}
                  value={
                    Number.isFinite(dpPercent)
                      ? Math.min(KPR_LIMITS.downPaymentSliderMax, Math.round(dpPercent))
                      : 0
                  }
                  disabled={!hydrated}
                  className="h-11 w-full accent-primary"
                  onChange={(event) => {
                    if (!Number.isFinite(currentPrice)) return;
                    form.setValue(
                      "downPayment",
                      downPaymentFromPercent(currentPrice, Number(event.target.value)),
                      {
                        shouldValidate: true,
                      },
                    );
                  }}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <Label htmlFor={`${scheme}-dp-percent`}>Uang muka (persen)</Label>
                <NumberInput
                  id={`${scheme}-dp-percent`}
                  value={dpPercent}
                  decimals={1}
                  suffix="%"
                  readOnly={!hydrated}
                  onValueChange={(percent) => {
                    if (Number.isFinite(percent) && Number.isFinite(currentPrice)) {
                      form.setValue("downPayment", downPaymentFromPercent(currentPrice, percent), {
                        shouldValidate: true,
                      });
                    }
                  }}
                />
              </div>
              <NumberField
                control={form.control}
                name="downPayment"
                label="Uang muka (rupiah)"
                prefix="Rp"
                readOnly={!hydrated}
              />
            </FormGroup>
            <FormGroup title={terms.tenor}>
              <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor={`${scheme}-tenor-slider`}>
                  {terms.tenor}: {String(values.tenorYears ?? "-")} tahun
                </Label>
                <input
                  id={`${scheme}-tenor-slider`}
                  type="range"
                  min={tenorRange.min}
                  max={tenorRange.max}
                  step={1}
                  value={clamp(values.tenorYears ?? tenorRange.min, tenorRange.min, tenorRange.max)}
                  disabled={!hydrated}
                  className="h-11 w-full accent-primary"
                  onChange={(event) => {
                    form.setValue("tenorYears", Number(event.target.value), {
                      shouldValidate: true,
                    });
                  }}
                />
              </div>
              <NumberField
                control={form.control}
                name="tenorYears"
                label={terms.tenor}
                suffix="tahun"
                readOnly={!hydrated}
              />
            </FormGroup>
            <FormGroup title={terms.fixedPeriods}>
              <div className="grid gap-3 sm:col-span-2">
                {segmentValues.length === 0 ? (
                  <p className="text-sm text-subtle-foreground">
                    Tidak ada periode tetap. {terms.rate} di bawah berlaku sampai lunas.
                  </p>
                ) : null}
                {segmentValues.map((_segment, index) => (
                  // Key urutan: periode stabil dan tidak diurutkan ulang (lihat setSegments).
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                    <NumberField
                      control={form.control}
                      name={`segments.${index}.ratePercent`}
                      label={`Periode ${index + 1}: ${terms.rate}`}
                      decimals={2}
                      suffix="%/tahun"
                      readOnly={!hydrated}
                    />
                    <NumberField
                      control={form.control}
                      name={`segments.${index}.years`}
                      label="Lama"
                      suffix="tahun"
                      readOnly={!hydrated}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Hapus periode ${index + 1}`}
                      onClick={() => {
                        setSegments(
                          form
                            .getValues("segments")
                            .filter((_item, position) => position !== index),
                        );
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
                {segmentsError ? <p className="text-sm text-destructive">{segmentsError}</p> : null}
                {segmentValues.length < KPR_LIMITS.segments.max ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={() => {
                      setSegments([
                        ...form.getValues("segments"),
                        { ratePercent: values.afterRatePercent ?? 0, years: 1 },
                      ]);
                    }}
                  >
                    <Plus aria-hidden="true" />
                    Tambah periode
                  </Button>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <NumberField
                  control={form.control}
                  name="afterRatePercent"
                  label={segmentValues.length === 0 ? terms.fixedUntilEnd : terms.afterRate}
                  decimals={2}
                  suffix="%/tahun"
                  readOnly={!hydrated}
                  hint={
                    segmentValues.length === 0
                      ? undefined
                      : "Bank tidak mempublikasikan angka pasti. Ubah sesuai penawaran bank."
                  }
                />
              </div>
            </FormGroup>
            <FormGroup title="Biaya pembelian">
              <NumberField
                control={form.control}
                name="npoptkp"
                label="NPOPTKP untuk BPHTB"
                prefix="Rp"
                readOnly={!hydrated}
                hint="Sesuai perda daerah. UU HKPD: paling sedikit Rp 80.000.000."
              />
              <NumberField
                control={form.control}
                name="otherCostsPercent"
                label="Perkiraan biaya bank, notaris bank, asuransi"
                decimals={2}
                suffix={`% ${terms.principal === "Pokok pembiayaan" ? "pembiayaan" : "pinjaman"}`}
                readOnly={!hydrated}
              />
            </FormGroup>
          </fieldset>
        </form>

        {/* Hasil ringkas di kanan, menempel saat form di-scroll (layar 1280 px ke atas). */}
        <div
          className="grid min-w-0 content-start gap-4 xl:sticky xl:top-[calc(var(--header-height)+1.5rem)] xl:col-span-5"
          aria-live="polite"
        >
          <div className="rounded-3xl bg-surface p-4 sm:p-6">
            <h3 className="text-base font-bold">Hasil simulasi {terms.title}</h3>
            {result && costs && firstPeriod ? (
              <>
                <p className="mt-4 text-sm text-subtle-foreground">
                  {terms.installment} per bulan
                  {result.periods.length > 1
                    ? `, bulan ${firstPeriod.fromMonth} sampai ${firstPeriod.toMonth}`
                    : ""}
                </p>
                <p className="text-3xl font-extrabold text-primary tabular">
                  {formatRupiah(firstPeriod.monthly)}
                </p>
                <p className="text-sm text-subtle-foreground">
                  {terms.rate} {percentText(firstPeriod.ratePercent)} per tahun
                </p>

                {result.periods.length > 1 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <caption className="sr-only">{terms.installment} per periode</caption>
                      <thead>
                        <tr className="border-b text-left text-subtle-foreground">
                          <th scope="col" className="py-2 font-medium">
                            Periode
                          </th>
                          <th scope="col" className="py-2 text-right font-medium">
                            {terms.rate}
                          </th>
                          <th scope="col" className="py-2 text-right font-medium">
                            {terms.installment}/bulan
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.periods.map((period) => (
                          <tr key={period.fromMonth} className="border-b last:border-0">
                            <td className="py-2">
                              Bulan {period.fromMonth} sampai {period.toMonth}
                              {period.isAfter ? " (asumsi)" : ""}
                            </td>
                            <td className="py-2 text-right tabular">
                              {percentText(period.ratePercent)}
                            </td>
                            <td className="py-2 text-right font-semibold tabular">
                              {formatRupiah(period.monthly)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                <dl className="mt-4 divide-y">
                  <Stat label="Uang muka" value={formatRupiah(result.downPayment)} />
                  <Stat label={terms.principal} value={formatRupiah(result.loanAmount)} />
                  <Stat label={terms.totalInterest} value={formatRupiah(result.totalInterest)} />
                  <Stat label={terms.totalPayment} value={formatRupiah(result.totalPayment)} />
                  <Stat
                    emphasis
                    label="Perkiraan dana awal (uang muka + biaya)"
                    value={formatRupiah(costs.firstPayment)}
                  />
                </dl>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => {
                      void handleDownload();
                    }}
                    disabled={pdfState === "busy"}
                  >
                    <Download aria-hidden="true" />
                    {pdfState === "busy" ? "Menyiapkan PDF" : "Unduh PDF"}
                  </Button>
                  <Button
                    asChild
                    variant="highlight"
                    className="h-auto min-h-11 py-2.5 text-center whitespace-normal"
                  >
                    <a href={whatsappLink(waMessage)} target="_blank" rel="noopener noreferrer">
                      <Phone aria-hidden="true" />
                      Konsultasi {terms.title}
                    </a>
                  </Button>
                </div>
                {pdfState === "error" ? (
                  <p role="alert" className="mt-3 text-sm text-destructive">
                    PDF gagal dibuat. Coba lagi, atau hubungi marketing lewat WhatsApp.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-sm text-subtle-foreground">
                Lengkapi data di form untuk melihat hasil.
              </p>
            )}
          </div>

          <p className="text-xs text-subtle-foreground">
            Simulasi bersifat estimasi dan bukan penawaran bank. {terms.schemeNote} Persetujuan,{" "}
            {terms.rateLower}, dan biaya akhir mengikuti ketentuan bank.
          </p>
        </div>
      </div>

      {result && costs ? (
        <div className="grid gap-6 xl:grid-cols-12 xl:items-start">
          <div className="min-w-0 xl:col-span-5">
            <div className="rounded-lg border bg-card p-5">
              <h3 className="text-base font-bold">Rincian biaya</h3>
              <ul className="mt-3 grid gap-4 text-sm">
                {KPR_COST_GROUPS.map((group) => (
                  <li key={group.title}>
                    <p className="font-semibold">{group.title}</p>
                    <ul className="mt-1.5 grid gap-1 text-subtle-foreground">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          {group.included ? (
                            <CircleCheck
                              aria-hidden="true"
                              className="mt-0.5 size-4 shrink-0 text-success-700"
                            />
                          ) : (
                            <CircleMinus
                              aria-hidden="true"
                              className="mt-0.5 size-4 shrink-0 text-neutral-600"
                            />
                          )}
                          {item}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 divide-y border-t">
                <Stat
                  label="BPHTB (5% x harga dikurangi NPOPTKP)"
                  value={formatRupiah(costs.bphtb)}
                />
                <Stat
                  label={`Biaya bank, notaris bank, asuransi (perkiraan ${percentText(values.otherCostsPercent ?? 0)})`}
                  value={formatRupiah(costs.otherCosts)}
                />
                <Stat
                  emphasis
                  label="Total biaya di luar harga rumah"
                  value={formatRupiah(costs.totalCosts)}
                />
              </dl>
            </div>
          </div>
          <div className="min-w-0 xl:col-span-7">
            <details className="rounded-lg border bg-card p-5">
              <summary className="cursor-pointer font-bold">
                Jadwal {terms.installmentLower} per tahun
              </summary>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <caption className="sr-only">Jadwal {terms.installmentLower} per tahun</caption>
                  <thead>
                    <tr className="border-b text-subtle-foreground">
                      <th scope="col" className="py-2 text-left font-medium">
                        Tahun
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        {terms.installment}/bulan
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Pokok dibayar
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        {terms.interestPaid}
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Sisa pokok
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearly.map((row) => (
                      <tr key={row.year} className="border-b last:border-0">
                        <td className="py-1.5 tabular">{row.year}</td>
                        <td className="py-1.5 text-right tabular">{formatRupiah(row.monthly)}</td>
                        <td className="py-1.5 text-right tabular">
                          {formatRupiah(row.principalPaid)}
                        </td>
                        <td className="py-1.5 text-right tabular">
                          {formatRupiah(row.interestPaid)}
                        </td>
                        <td className="py-1.5 text-right tabular">
                          {formatRupiah(row.endingBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        </div>
      ) : null}
    </div>
  );
}
