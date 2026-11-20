import { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
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
  const common = { alt: banner.alt, fill: true, sizes: "100vw" } as const;
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
    <Container className="flex h-full flex-col justify-end pb-24 sm:pb-28 lg:pb-32">
      <div className="max-w-2xl text-white">
        {project?.area ? (
          <p className="text-sm font-semibold tracking-wide text-gold-300 uppercase">
            {project.name}, {project.area}
          </p>
        ) : null}
        <Title className="mt-2 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {banner.title}
        </Title>
        {banner.subtitle ? <p className="mt-4 text-lg sm:text-xl">{banner.subtitle}</p> : null}
        {project?.lowestPrice ? (
          <p className="mt-3 text-lg font-bold text-gold-300 sm:text-xl">
            Mulai {formatRupiahRange(project.lowestPrice)}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {banner.cta ? (
            <Button asChild variant="highlight" size="lg">
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
            className="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
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
    </Container>
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
  const slides: HeroSlide[] = banners.map((banner, index) => ({
    id: banner.id,
    label: banner.title,
    image: slideImage(banner),
    content: <SlideContent banner={banner} project={project} isFirst={index === 0} />,
  }));
  return <HeroCarousel slides={slides} />;
}
