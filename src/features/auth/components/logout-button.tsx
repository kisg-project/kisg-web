import { Button } from "@/components/ui/button";
import { Logout03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/shared/icon";

export function LogoutButton({
  action = "/portal/auth/keluar",
  iconOnly = false,
}: {
  action?: string;
  iconOnly?: boolean;
}) {
  return (
    <form action={action} method="post">
      {iconOnly ? (
        <button
          type="submit"
          aria-label="Keluar"
          title="Keluar"
          className="hit-44 flex size-9 items-center justify-center rounded-lg border border-(--line-strong,var(--color-border)) bg-card text-foreground transition-colors hover:bg-danger-50 hover:text-danger-700 motion-safe:active:scale-95"
        >
          <Icon icon={Logout03Icon} className="size-[1.125rem]" />
        </button>
      ) : (
        <Button type="submit" variant="ghost">
          <Icon icon={Logout03Icon} />
          Keluar
        </Button>
      )}
    </form>
  );
}
