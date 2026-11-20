import type { Metadata } from "next";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { EmptyState } from "@/components/shared/state-message";
import { MediaCard } from "@/components/site/media-card";
import { PageHero } from "@/components/site/page-hero";
import { getPublishedPosts } from "@/features/cms";
import { formatDateWIB } from "@/lib/format";

export const metadata: Metadata = {
  title: "Berita",
  description:
    "Kabar terbaru dari KIS Group: progres proyek, kegiatan, dan informasi untuk pembeli rumah.",
  alternates: { canonical: "/berita" },
};

export default async function NewsPage() {
  const posts = await getPublishedPosts();
  return (
    <>
      <PageHero
        title="Berita"
        description="Kabar terbaru dari KIS Group."
        crumbs={[{ name: "Berita", path: "/berita" }]}
      />
      <Section>
        {posts.length === 0 ? (
          <EmptyState
            title="Belum ada berita."
            description="Berita dan kabar proyek akan tampil di sini."
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <li key={post.id}>
                <Reveal delay={(index % 3) * 80} className="h-full">
                  <MediaCard
                    href={`/berita/${post.slug}`}
                    title={post.title}
                    image={post.cover}
                    meta={
                      <time dateTime={post.publishedAt}>{formatDateWIB(post.publishedAt)}</time>
                    }
                  >
                    {post.excerpt}
                  </MediaCard>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
