import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { DeleteContentButton, getCmsPost, PostForm, requireCmsUser } from "@/features/cms-panel";
import { LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export const metadata: Metadata = { title: "Ubah berita" };

export default async function CmsEditPostPage({ params }: PageProps<"/cms/berita/[id]">) {
  await requireCmsUser();
  const { id } = await params;
  const post = /^[0-9a-f-]{36}$/i.test(id) ? await getCmsPost(id) : null;
  if (!post) notFound();
  return (
    <div className="tone-orange grid gap-4 [&>:not(:first-child)]:mx-auto [&>:not(:first-child)]:w-full [&>:not(:first-child)]:max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Ubah berita" description={post.title} />
        <div className="flex flex-wrap gap-2">
          {post.status === "terbit" ? (
            <Button asChild variant="outline">
              <a href={`/berita/${post.slug}`} target="_blank" rel="noopener noreferrer">
                <Icon icon={LinkSquare02Icon} aria-hidden="true" />
                Lihat di website
              </a>
            </Button>
          ) : null}
          <DeleteContentButton kind="berita" id={post.id} title={post.title} />
        </div>
      </div>
      <PostForm
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          coverPath: post.coverPath,
          coverAlt: post.coverAlt ?? "",
          body: post.body,
          status: post.status,
        }}
      />
    </div>
  );
}
