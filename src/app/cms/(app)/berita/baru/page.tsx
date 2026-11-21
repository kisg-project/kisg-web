import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { PostForm, requireCmsUser } from "@/features/cms-panel";

export const metadata: Metadata = { title: "Tulis berita" };

export default async function CmsNewPostPage() {
  await requireCmsUser();
  return (
    <div className="grid max-w-4xl gap-6">
      <PageHeader
        title="Tulis berita"
        description="Simpan sebagai draf dulu kalau belum siap tayang."
      />
      <PostForm />
    </div>
  );
}
