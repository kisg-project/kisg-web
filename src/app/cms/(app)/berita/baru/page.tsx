import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { PostForm, requireCmsUser } from "@/features/cms-panel";

export const metadata: Metadata = { title: "Tulis berita" };

export default async function CmsNewPostPage() {
  await requireCmsUser();
  return (
    <div className="tone-orange grid gap-4 [&>:not(:first-child)]:mx-auto [&>:not(:first-child)]:w-full [&>:not(:first-child)]:max-w-4xl">
      <PageHeader
        title="Tulis berita"
        description="Simpan sebagai draf dulu kalau belum siap tayang."
      />
      <PostForm />
    </div>
  );
}
