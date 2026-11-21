import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/state-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCmsPosts, requireCmsUser } from "@/features/cms-panel";
import { formatDateWIB } from "@/lib/format";

export const metadata: Metadata = { title: "Berita" };

function StatusBadge({ status }: { status: "draft" | "terbit" }) {
  return (
    <Badge variant={status === "terbit" ? "default" : "secondary"}>
      {status === "terbit" ? "Terbit" : "Draf"}
    </Badge>
  );
}

export default async function CmsPostsPage() {
  await requireCmsUser();
  const posts = await listCmsPosts();
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Berita" description="Berita dan artikel di halaman /berita." />
        <Button asChild>
          <Link href="/cms/berita/baru">
            <Plus aria-hidden="true" />
            Tulis berita
          </Link>
        </Button>
      </div>
      {posts.length === 0 ? (
        <EmptyState
          title="Belum ada berita."
          description="Tulis berita pertama lewat tombol di atas."
        />
      ) : (
        <ul aria-label="Daftar berita CMS" className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/cms/berita/${post.id}`}
                className="group flex lift flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="block font-semibold group-hover:text-primary">{post.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    /berita/{post.slug}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  {post.publishedAt ? <span>Terbit {formatDateWIB(post.publishedAt)}</span> : null}
                  <StatusBadge status={post.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
