import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/container";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { env } from "@/env";
import { ContentBlocks, getPostBySlug } from "@/features/cms";
import { formatDateWIB } from "@/lib/format";
import { articleJsonLd, jsonLdGraph } from "@/lib/seo/structured-data";

export async function generateMetadata({ params }: PageProps<"/berita/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Berita tidak ditemukan", robots: { index: false } };
  const path = `/berita/${post.slug}`;
  const images = post.cover ? [{ url: post.cover.src, alt: post.cover.alt }] : [];
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      title: post.title,
      description: post.excerpt ?? undefined,
      publishedTime: post.publishedAt,
      images,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/berita/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const path = `/berita/${post.slug}`;

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
        ])}
      />
      <PageHero
        title={post.title}
        crumbs={[
          { name: "Berita", path: "/berita" },
          { name: post.title, path },
        ]}
      >
        <p className="mt-4 text-sm text-primary-100">
          <time dateTime={post.publishedAt}>{formatDateWIB(post.publishedAt)}</time>
        </p>
      </PageHero>
      <Container className="py-10 sm:py-14">
        {post.cover ? (
          <div className="relative mb-8 aspect-[16/9] max-w-3xl overflow-hidden rounded-lg">
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
    </>
  );
}
