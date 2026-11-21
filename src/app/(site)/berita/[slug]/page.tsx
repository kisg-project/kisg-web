import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/container";
import { JsonLd } from "@/components/shared/json-ld";
import { Section } from "@/components/shared/section";
import { MediaCard } from "@/components/site/media-card";
import { PageHero } from "@/components/site/page-hero";
import { env } from "@/env";
import { ContentBlocks, getPostBySlug, getPublishedPosts } from "@/features/cms";
import { formatDateWIB } from "@/lib/format";
import { articleJsonLd, jsonLdGraph, organizationJsonLd } from "@/lib/seo/structured-data";
import { shareMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata({ params }: PageProps<"/berita/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Berita tidak ditemukan", robots: { index: false } };
  return shareMetadata({
    path: `/berita/${post.slug}`,
    title: post.title,
    description: post.excerpt ?? post.title,
    imageAlt: post.title,
    type: "article",
    publishedTime: post.publishedAt,
  });
}

export default async function PostPage({ params }: PageProps<"/berita/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const path = `/berita/${post.slug}`;
  // Tautan internal ke berita lain (SEO dan lama kunjungan).
  const others = (await getPublishedPosts(4)).filter((item) => item.id !== post.id).slice(0, 3);

  return (
    <>
      <JsonLd
        data={jsonLdGraph([
          articleJsonLd(env.NEXT_PUBLIC_SITE_URL, {
            title: post.title,
            path,
            publishedAt: post.publishedAt,
            image: post.cover?.src ?? null,
            description: post.excerpt,
          }),
          // Penulis dan penerbit artikel menunjuk ke node ini.
          organizationJsonLd(env.NEXT_PUBLIC_SITE_URL),
        ])}
      />
      <PageHero
        title={post.title}
        crumbs={[
          { name: "Berita", path: "/berita" },
          { name: post.title, path },
        ]}
      >
        <p className="mt-4 text-sm text-subtle-foreground">
          <time dateTime={post.publishedAt}>{formatDateWIB(post.publishedAt)}</time>
        </p>
      </PageHero>
      <Container className="py-10 sm:py-14">
        {post.cover ? (
          <div className="relative mb-8 aspect-[16/9] max-w-3xl overflow-hidden rounded-3xl">
            <Image
              src={post.cover.src}
              alt={post.cover.alt}
              fill
              sizes="(min-width: 768px) 48rem, 100vw"
              className="object-cover"
              fetchPriority="high"
            />
          </div>
        ) : null}
        <ContentBlocks blocks={post.body} />
      </Container>
      {others.length > 0 ? (
        <Section id="berita-lainnya" tone="surface" title="Berita lainnya">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((item) => (
              <li key={item.id}>
                <MediaCard
                  href={`/berita/${item.slug}`}
                  title={item.title}
                  image={item.cover}
                  meta={<time dateTime={item.publishedAt}>{formatDateWIB(item.publishedAt)}</time>}
                >
                  {item.excerpt}
                </MediaCard>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
