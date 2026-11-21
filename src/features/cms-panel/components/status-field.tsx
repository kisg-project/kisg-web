"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EditableStatus = "draft" | "terbit";

/** Status konten: draf atau terbit (dropdown custom, CLAUDE.md bagian 6). */
export function StatusField({
  id,
  value,
  onChange,
  hint,
}: {
  id: string;
  value: EditableStatus;
  onChange: (value: EditableStatus) => void;
  hint?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:max-w-xs">
      <Label htmlFor={id}>Status</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          onChange(next === "terbit" ? "terbit" : "draft");
        }}
      >
        <SelectTrigger id={id} className="h-11 w-full rounded-md px-3">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="draft" className="min-h-10">
            Draf
          </SelectItem>
          <SelectItem value="terbit" className="min-h-10">
            Terbit
          </SelectItem>
        </SelectContent>
      </Select>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
