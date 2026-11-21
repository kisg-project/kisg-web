import "server-only";
import { PARTNER_BANKS } from "@/config/banks";
import { KPR_DEFAULTS } from "@/config/kpr";
import { KPR_PRODUCTS } from "@/config/kpr-products";
import { formatOfficeAddress, siteConfig } from "@/config/site";
import { getActivePromos } from "@/features/cms";
import { formatAddress, getFeaturedProject, getPublishedProjects } from "@/features/projects";
import { formatDateWIB, formatRupiah } from "@/lib/format";

const STATUS = { segera: "segera dipasarkan", tersedia: "sedang dipasarkan", sold_out: "sold out" };

function lines(items: (string | null | undefined | false)[]): string {
  return items.filter(Boolean).join("\n");
}

/**
 * Data resmi KIS yang boleh dipakai Jaka, dari sumber yang sama dengan website (database dan
 * src/config). Hanya data publik: tanpa lead, tanpa harga internal, tanpa data karyawan.
 */
export async function buildKnowledge(): Promise<string> {
  const [featured, projects, promos] = await Promise.all([
    getFeaturedProject(),
    getPublishedProjects(),
    getActivePromos(),
  ]);

  const company = lines([
    `Perusahaan: ${siteConfig.legalName} (${siteConfig.name}), developer perumahan sejak ${String(siteConfig.company.foundedYear)}.`,
    `Kantor pemasaran: ${formatOfficeAddress()}.`,
    `WhatsApp marketing: ${siteConfig.whatsapp.display}.`,
    `Email: ${siteConfig.emails.map((item) => `${item.address} (${item.label.toLowerCase()})`).join(", ")}.`,
    `Instagram: ${siteConfig.instagram.handle}.`,
    `Website: ${siteConfig.domain}.`,
  ]);

  const project = featured
    ? lines([
        `Proyek unggulan: ${featured.name}, ${STATUS[featured.status]}.`,
        `Alamat: ${formatAddress(featured.address)}.`,
        featured.description ? `Tentang proyek: ${featured.description}` : null,
        ...featured.unitTypes.map((unit) =>
          lines([
            `Tipe ${unit.name}: luas tanah ${String(unit.landArea)} m2, luas bangunan ${String(unit.buildingArea)} m2, ${String(unit.bedrooms)} kamar tidur, ${String(unit.bathrooms)} kamar mandi, ${String(unit.floors)} lantai.`,
            unit.price !== null
              ? `Harga tipe ${unit.name}: ${formatRupiah(unit.price)}.`
              : `Harga tipe ${unit.name}: belum dibuka, arahkan ke marketing.`,
            unit.features.length > 0 ? `Fitur unit: ${unit.features.join(", ")}.` : null,
            unit.priceIncludes.length > 0
              ? `Harga sudah termasuk: ${unit.priceIncludes.join(", ")}.`
              : null,
            unit.priceExcludes.length > 0
              ? `Harga belum termasuk: ${unit.priceExcludes.join(", ")}.`
              : null,
          ]),
        ),
        featured.facilities.length > 0
          ? `Fasilitas: ${featured.facilities.map((item) => item.name).join(", ")}.`
          : null,
        featured.nearby.length > 0
          ? `Dekat dengan: ${featured.nearby
              .map((place) =>
                place.travelMinutes !== null
                  ? `${place.name} (sekitar ${String(place.travelMinutes)} menit)`
                  : place.name,
              )
              .join(", ")}.`
          : null,
        ...featured.faqs.map((faq) => `Tanya: ${faq.question} Jawab: ${faq.answer}`),
      ])
    : "Belum ada proyek yang sedang dipasarkan.";

  const others = projects
    .filter((item) => item.slug !== featured?.slug)
    .map((item) => `${item.name} (${formatAddress(item.address)}): ${STATUS[item.status]}.`);

  const promoText =
    promos.length > 0
      ? promos
          .map((promo) =>
            lines([
              `Promo: ${promo.title}${promo.endsAt ? `, berlaku sampai ${formatDateWIB(promo.endsAt)}` : ""}.`,
              promo.summary,
            ]),
          )
          .join("\n")
      : "Tidak ada promo yang sedang berlaku.";

  const banks = `Bank rekanan KPR: ${PARTNER_BANKS.map((bank) => `${bank.name} (${bank.schemes.join(" dan ")})`).join(", ")}.`;
  const products = KPR_PRODUCTS.map((product) => {
    const rates = product.segments
      .map(
        (segment) =>
          `${String(segment.ratePercent).replace(".", ",")}% selama ${String(segment.years)} tahun`,
      )
      .join(", lalu ");
    return `${product.name} (${product.scheme}): ${rates}, tenor ${String(product.tenor.min)} sampai ${String(product.tenor.max)} tahun.`;
  });

  return [
    "## Perusahaan dan kontak",
    company,
    "## Proyek",
    project,
    others.length > 0 ? `Proyek lain (portofolio):\n${others.join("\n")}` : "",
    "## Promo",
    promoText,
    "## KPR",
    banks,
    `Asumsi simulasi: uang muka ${String(KPR_DEFAULTS.downPaymentPercent)}%, tenor ${String(KPR_DEFAULTS.tenorYears)} tahun, bunga floating setelah masa tetap ${String(KPR_DEFAULTS.floatingRatePercent)}% (asumsi, bank tidak mempublikasikan angka pasti).`,
    ...products,
  ]
    .filter(Boolean)
    .join("\n");
}
