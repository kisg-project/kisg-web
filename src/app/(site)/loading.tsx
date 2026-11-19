import { Container } from "@/components/shared/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Memuat halaman">
      <Skeleton className="h-hero w-full rounded-none" />
      <Container className="py-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-40 w-full" />
      </Container>
    </div>
  );
}
