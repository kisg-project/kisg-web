import { getImageProps } from "next/image";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { featuredProject } from "@/config/featured-project";
import { whatsappLink } from "@/config/site";
import { formatRupiah } from "@/lib/format";

// Hero Banner beranda: penuh satu layar di bawah navbar (keputusan owner, Fase 1).
// Fase 3 dan 4: gambar dan teks diambil dari tabel banners yang diatur admin, bisa beberapa slide.
const HERO_IMAGES = {
  desktop: { src: "/images/hero/sgv-hero-desktop.webp", width: 2048, height: 1337 },
  mobile: { src: "/images/hero/sgv-hero-mobile.webp", width: 1626, height: 2048 },
} as const;

const HERO_ALT = `Deretan rumah ${featuredProject.unitType.name} di ${featuredProject.name}`;

export function HeroBanner() {
  const common = { alt: HERO_ALT, sizes: "100vw" };
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...common, ...HERO_IMAGES.desktop });
  const {
    props: { srcSet: mobileSrcSet, ...imageProps },
  } = getImageProps({ ...common, ...HERO_IMAGES.mobile });

  return (
    <section
      aria-labelledby="hero-judul"
      className="relative isolate h-hero min-h-[28rem] overflow-hidden"
    >
      <picture>
        {/* Foto mendatar untuk layar lebar dan HP posisi mendatar, foto tegak untuk HP posisi tegak. */}
        <source media="(min-width: 768px), (orientation: landscape)" srcSet={desktopSrcSet} />
        <source srcSet={mobileSrcSet} />
        {/* Art direction memakai getImageProps (dokumentasi next/image), jadi elemen img biasa. */}
        <img
          {...imageProps}
          alt={HERO_ALT}
          fetchPriority="high"
          loading="eager"
          className="absolute inset-0 -z-20 size-full object-cover"
        />
      </picture>
      {/* Lapisan gelap di bagian bawah supaya teks putih terbaca di atas foto. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-primary-950/90 via-primary-950/45 to-primary-950/0"
      />

      <Container className="flex h-full flex-col justify-end pb-10 sm:pb-14 lg:pb-20">
        <div className="max-w-2xl text-white">
          <p className="text-sm font-semibold tracking-wide text-gold-300 uppercase">
            {featuredProject.area}, {featuredProject.regency}
          </p>
          <h1
            id="hero-judul"
            className="mt-2 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {featuredProject.name}
          </h1>
          <p className="mt-4 text-lg sm:text-xl">
            Rumah {featuredProject.unitType.name}, {featuredProject.unitType.bedrooms} kamar tidur.{" "}
            <span className="font-bold text-gold-300 tabular">
              {formatRupiah(featuredProject.unitType.price)}.
            </span>
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="highlight" size="lg">
              <a
                href={whatsappLink(`Halo, saya ingin info ${featuredProject.name}.`)}
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
    </section>
  );
}
