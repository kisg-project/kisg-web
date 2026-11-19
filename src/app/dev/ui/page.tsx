import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/state-message";
import { UnitStatusBadge } from "@/components/shared/unit-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { featuredProject } from "@/config/featured-project";
import { UNIT_STATUSES } from "@/config/units";
import { KprSimulator } from "@/features/kpr";
import { UnitHighlights } from "@/features/projects";
import { formatRupiah } from "@/lib/format";
import { ImageCompressTester } from "./image-compress-tester";
import { InteractiveDemos } from "./interactive-demos";

export const metadata: Metadata = {
  title: "Review UI",
  robots: { index: false, follow: false },
};

// Halaman review token dan komponen. Hanya aktif di development, atau di CI lewat ENABLE_DEV_UI=1.
function isEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.ENABLE_DEV_UI === "1";
}

const SCALES = ["primary", "gold", "neutral", "success", "warning", "danger", "info"] as const;
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t py-8">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function DevUiPage() {
  if (!isEnabled()) notFound();

  return (
    <main id="konten" className="flex-1">
      <Container className="py-10">
        <PageHeader
          title="Review UI"
          description="Token warna dan komponen dasar dari docs/brand.md."
        />

        <DemoSection title="Skala warna">
          <div className="grid gap-4">
            {SCALES.map((scale) => (
              <div key={scale}>
                <p className="mb-2 text-sm font-semibold">{scale}</p>
                <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
                  {STEPS.map((step) => (
                    <li key={step} className="text-xs">
                      <span
                        className="block h-12 rounded-sm border"
                        style={{ backgroundColor: `var(--color-${scale}-${step})` }}
                      />
                      <span className="mt-1 block tabular">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DemoSection>

        <DemoSection title="Tombol">
          <div className="flex flex-wrap gap-3">
            <Button>Utama</Button>
            <Button variant="highlight">Hubungi marketing</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Sekunder</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Hapus</Button>
            <Button variant="link">Tautan</Button>
            <Button disabled>Nonaktif</Button>
          </div>
        </DemoSection>

        <DemoSection title="Form">
          <div className="grid max-w-xl gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="demo-nama">Nama lengkap</Label>
              <Input id="demo-nama" className="h-11" autoComplete="name" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="demo-hp">Nomor HP</Label>
              <Input
                id="demo-hp"
                className="h-11"
                inputMode="tel"
                aria-invalid="true"
                aria-describedby="demo-hp-error"
              />
              <p id="demo-hp-error" className="text-sm text-destructive">
                Nomor HP tidak valid. Contoh: 0812 3456 7890.
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="demo-pesan">Pesan</Label>
              <Textarea id="demo-pesan" />
            </div>
          </div>
        </DemoSection>

        <DemoSection title="Komponen interaktif">
          <InteractiveDemos />
        </DemoSection>

        <DemoSection title="Badge dan status unit">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Baru</Badge>
            <Badge variant="secondary">Draft</Badge>
            <Badge variant="outline">Arsip</Badge>
            {UNIT_STATUSES.map((status) => (
              <UnitStatusBadge key={status} status={status} />
            ))}
          </div>
        </DemoSection>

        <DemoSection title="Kartu, tab, dan tabel">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{featuredProject.unitType.name}</CardTitle>
                <CardDescription>{featuredProject.name}</CardDescription>
              </CardHeader>
              <CardContent className="tabular">
                {formatRupiah(featuredProject.unitType.price)}
              </CardContent>
            </Card>
            <Tabs defaultValue="satu">
              <TabsList>
                <TabsTrigger value="satu">Ringkasan</TabsTrigger>
                <TabsTrigger value="dua">Detail</TabsTrigger>
              </TabsList>
              <TabsContent value="satu">Isi tab ringkasan.</TabsContent>
              <TabsContent value="dua">Isi tab detail.</TabsContent>
            </Tabs>
          </div>
          <div className="mt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kavling</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {UNIT_STATUSES.map((status, index) => (
                  <TableRow key={status}>
                    <TableCell>Contoh {index + 1}</TableCell>
                    <TableCell>{featuredProject.unitType.name}</TableCell>
                    <TableCell>
                      <UnitStatusBadge status={status} />
                    </TableCell>
                    <TableCell className="text-right tabular">
                      {formatRupiah(featuredProject.unitType.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DemoSection>

        <DemoSection title="Keadaan kosong, error, dan memuat">
          <div className="grid gap-6 lg:grid-cols-3">
            <EmptyState
              title="Belum ada laporan."
              description="Laporan harian yang dikirim akan tampil di sini."
            />
            <ErrorState
              title="Data gagal dimuat."
              description="Periksa koneksi internet, lalu coba lagi."
            />
            <div className="grid gap-3" aria-hidden="true">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </DemoSection>

        <DemoSection title="Ringkasan unit">
          <UnitHighlights project={featuredProject} />
        </DemoSection>

        <DemoSection title="Simulasi KPR">
          <KprSimulator price={featuredProject.unitType.price} />
        </DemoSection>

        <DemoSection title="Uji kompresi gambar">
          <ImageCompressTester />
        </DemoSection>
      </Container>
    </main>
  );
}
