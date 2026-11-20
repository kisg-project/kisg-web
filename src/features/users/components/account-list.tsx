"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/config/roles";
import { formatDateWIB } from "@/lib/format";
import { setUserActiveAction, setUserRoleAction } from "../actions/users";
import type { PortalAccount } from "../queries/list";
import { manageProblem } from "../utils/rules";

/**
 * Daftar akun portal sebagai kartu (rapi di HP dan desktop). Akun sendiri dan akun owner (bagi admin)
 * tidak bisa diubah, sesuai aturan yang sama dengan server.
 */
export function AccountList({
  accounts,
  actor,
}: {
  accounts: readonly PortalAccount[];
  actor: { id: string; role: AppRole };
}) {
  const router = useRouter();
  const onSuccess = () => {
    router.refresh();
  };
  const roleAction = useAction(setUserRoleAction, { onSuccess });
  const activeAction = useAction(setUserActiveAction, { onSuccess });
  const error = roleAction.result.serverError ?? activeAction.result.serverError;

  return (
    <div className="grid gap-3">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <ul aria-label="Daftar pengguna" className="grid gap-3">
        {accounts.map((account) => {
          const locked =
            manageProblem({
              actorId: actor.id,
              actorRole: actor.role,
              targetId: account.id,
              targetRole: account.role,
            }) !== null;
          const busy = roleAction.isExecuting || activeAction.isExecuting;
          return (
            <li
              key={account.id}
              aria-label={account.fullName || account.email}
              className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <span className="truncate">{account.fullName || "Tanpa nama"}</span>
                  {account.isActive ? null : <Badge variant="secondary">Nonaktif</Badge>}
                  {account.id === actor.id ? <Badge variant="outline">Anda</Badge> : null}
                </p>
                <p className="truncate text-sm text-muted-foreground">{account.email}</p>
                <p className="text-xs text-muted-foreground">
                  Dibuat {formatDateWIB(account.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={account.role ?? undefined}
                  disabled={locked || busy}
                  onValueChange={(value) => {
                    roleAction.execute({ userId: account.id, role: value as AppRole });
                  }}
                >
                  <SelectTrigger
                    aria-label={`Role ${account.fullName || account.email}`}
                    className="h-11 w-44 rounded-md px-3"
                  >
                    <SelectValue placeholder="Tanpa role" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {APP_ROLES.map((role) => (
                      <SelectItem key={role} value={role} className="min-h-10">
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant={account.isActive ? "outline" : "default"}
                  disabled={locked || busy}
                  onClick={() => {
                    activeAction.execute({ userId: account.id, active: !account.isActive });
                  }}
                >
                  {account.isActive ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
