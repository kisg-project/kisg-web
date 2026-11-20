"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INVITABLE_ROLES, ROLE_LABELS, type InvitableRole } from "@/config/roles";

export interface RoleSelection {
  roles: InvitableRole[];
  primaryRole: InvitableRole;
}

/**
 * Pilih satu atau beberapa role (rangkap jabatan) dan role utamanya. Role owner hanya muncul untuk
 * owner. Role utama otomatis berpindah ke role lain kalau role utamanya dilepas.
 */
export function RolePicker({
  idPrefix,
  value,
  onChange,
  allowOwner,
  disabled,
  rolesError,
  primaryError,
}: {
  idPrefix: string;
  value: RoleSelection;
  onChange: (next: RoleSelection) => void;
  allowOwner: boolean;
  disabled?: boolean;
  rolesError?: string;
  primaryError?: string;
}) {
  const options = INVITABLE_ROLES.filter((role) => allowOwner || role !== "owner");

  const toggle = (role: InvitableRole, checked: boolean) => {
    const roles = checked
      ? INVITABLE_ROLES.filter((item) => item === role || value.roles.includes(item))
      : value.roles.filter((item) => item !== role);
    const primaryRole = roles.includes(value.primaryRole) ? value.primaryRole : (roles[0] ?? role);
    onChange({ roles, primaryRole });
  };

  return (
    <div className="grid gap-4">
      <fieldset
        className="grid gap-2"
        aria-describedby={rolesError ? `${idPrefix}-roles-error` : undefined}
      >
        <legend className="mb-1 text-sm font-medium">Role (boleh lebih dari satu)</legend>
        <div className="grid gap-1 sm:grid-cols-2">
          {options.map((role) => {
            const id = `${idPrefix}-role-${role}`;
            return (
              <div
                key={role}
                className="flex min-h-11 items-center gap-3 rounded-md px-2 hover:bg-accent"
              >
                <Checkbox
                  id={id}
                  checked={value.roles.includes(role)}
                  disabled={disabled}
                  aria-invalid={rolesError ? true : undefined}
                  onCheckedChange={(checked) => {
                    toggle(role, checked === true);
                  }}
                  className="size-5"
                />
                <Label htmlFor={id} className="flex-1 cursor-pointer py-2 font-normal">
                  {ROLE_LABELS[role]}
                </Label>
              </div>
            );
          })}
        </div>
        {rolesError ? (
          <p id={`${idPrefix}-roles-error`} className="text-sm text-destructive">
            {rolesError}
          </p>
        ) : null}
      </fieldset>

      {value.roles.length > 1 ? (
        <div className="flex min-w-0 flex-col gap-1.5 sm:max-w-xs">
          <Label htmlFor={`${idPrefix}-utama`}>Role utama</Label>
          <Select
            value={value.primaryRole}
            disabled={disabled}
            onValueChange={(next) => {
              const role = value.roles.find((item) => item === next);
              if (role) onChange({ roles: value.roles, primaryRole: role });
            }}
          >
            <SelectTrigger
              id={`${idPrefix}-utama`}
              className="h-11 w-full rounded-md px-3"
              aria-invalid={primaryError ? true : undefined}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {value.roles.map((role) => (
                <SelectItem key={role} value={role} className="min-h-10">
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Menentukan beranda setelah masuk.</p>
          {primaryError ? <p className="text-sm text-destructive">{primaryError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
