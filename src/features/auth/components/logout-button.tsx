"use client";

import { LogOut } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { logoutAction } from "../actions/auth";

export function LogoutButton() {
  const { execute, isExecuting } = useAction(logoutAction, {
    onSuccess({ data }) {
      window.location.replace(data.redirectTo);
    },
  });
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => {
        execute();
      }}
      disabled={isExecuting}
    >
      <LogOut aria-hidden="true" />
      Keluar
    </Button>
  );
}
