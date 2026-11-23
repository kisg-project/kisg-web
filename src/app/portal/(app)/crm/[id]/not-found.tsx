import Link from "next/link";
import { UserMultiple02Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "@/components/shared/state-message";
import { Button } from "@/components/ui/button";

export default function LeadNotFound() {
  return (
    <EmptyState
      icon={UserMultiple02Icon}
      title="Lead tidak ditemukan"
      description="Lead ini sudah dipindahkan ke marketing lain atau tidak ada."
      action={
        <Button asChild>
          <Link href="/portal/crm">Kembali ke CRM</Link>
        </Button>
      }
    />
  );
}
