import { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { whatsappLink } from "@/config/site";
import { formatRupiahRange } from "@/lib/format";
import type { Banner } from "../types";
import { HeroCarousel, type HeroSlide } from "./hero-carousel";

export interface HeroProject {
  name: string;
  area: string | null;
  /** Harga terendah yang boleh tampil, atau null ("Hubungi marketing"). */
  lowestPrice: number | null;
}

function slideImage(banner: Banner) {
  // Foto mengisi setengah lebar layar di desktop dan penuh di HP.
  const common = { alt: banner.alt, fill: true, sizes: "(min-width: 1024px) 50vw, 100vw" } as const;
  const desktop = getImageProps({ ...common, src: banner.image }).props;
  const mobile = getImageProps({ ...common, src: banner.mobileImage ?? banner.image }).props;
  return {
    desktopSrcSet: desktop.srcSet,
    mobileSrcSet: mobile.srcSet,
    src: mobile.src,
    sizes: mobile.sizes,
    alt: banner.alt,
  };
}

function SlideContent({
  banner,
  project,
  isFirst,
}: {
  banner: Banner;
  project: HeroProject | null;
  isFirst: boolean;
}) {
  // Satu h1 per halaman: judul slide pertama. Slide lain memakai paragraf dengan gaya yang sama.
  const Title = isFirst ? "h1" : "p";
  return (
    <div className="max-w-xl">
      {project?.area ? (
        <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-primary-800 shadow-xs ring-1 ring-primary-100">
          <MapPin aria-hidden="true" className="size-4 text-primary-600" />
          {project.name}, {project.area}
        </p>
      ) : null}
      <Title className="mt-5 text-4xl font-extrabold tracking-tight text-balance text-primary-950 sm:text-5xl lg:text-6xl">
        {banner.title}
      </Title>
      {banner.subtitle ? (
        <p className="mt-5 text-lg text-subtle-foreground sm:text-xl">{banner.subtitle}</p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {banner.cta ? (
          <Button asChild size="lg" className="shadow-md">
            <Link href={banner.cta.href}>
              {banner.cta.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-primary-200 bg-white text-primary-900 hover:border-primary-300 hover:bg-primary-50"
        >
          <a
            href={whatsappLink(
              project
                ? `Halo, saya ingin info ${project.name}.`
                : "Halo, saya ingin info rumah KIS Group.",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Phone aria-hidden="true" />
            Hubungi marketing
          </a>
        </Button>
      </div>
    </div>
  );
}

/** Chip harga yang melayang di sudut kiri bawah foto. */
function PriceChip({ price }: { price: number }) {
  return (
    <p className="absolute -bottom-4 left-4 rounded-2xl bg-highlight px-4 py-2.5 text-base font-extrabold text-highlight-foreground shadow-lg sm:left-6 sm:text-lg">
      Mulai {formatRupiahRange(price)}
    </p>
  );
}

/** Hero Banner beranda dari tabel banners (diatur admin). Penuh satu layar di bawah navbar. */
export function HeroBanner({
  banners,
  project,
}: {
  banners: Banner[];
  project: HeroProject | null;
}) {
  if (banners.length === 0) {
    // Belum ada banner terbit: judul tetap ada supaya halaman punya satu h1.
    return (
      <section className="bg-surface py-16 sm:py-24">
        <Container>
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-balance text-primary-950 sm:text-5xl">
            {project?.name ?? "KIS Group"}
          </h1>
          {project?.area ? (
            <p className="mt-3 text-lg text-subtle-foreground">{project.area}</p>
          ) : null}
        </Container>
      </section>
    );
  }
  const slides: HeroSlide[] = banners.map((banner, index) => ({
    id: banner.id,
    label: banner.title,
    image: slideImage(banner),
    content: <SlideContent banner={banner} project={project} isFirst={index === 0} />,
    aside: project?.lowestPrice ? <PriceChip price={project.lowestPrice} /> : undefined,
  }));
  return <HeroCarousel slides={slides} />;
}
