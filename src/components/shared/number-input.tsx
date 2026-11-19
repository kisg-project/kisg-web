"use client";

import { useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import {
  caretAfterFormat,
  formatNumberText,
  numberToInputText,
  parseNumberText,
  sanitizeNumberText,
  significantCount,
} from "@/lib/format/number-input";
import { cn } from "@/lib/utils";

interface NumberInputProps extends Omit<
  ComponentProps<"input">,
  "value" | "onChange" | "type" | "defaultValue"
> {
  /** NaN berarti kosong. */
  value: number;
  onValueChange: (value: number) => void;
  /** 0 untuk rupiah (titik ribuan), lebih dari 0 untuk persen dengan koma desimal. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

/**
 * Input angka gaya Indonesia: titik ribuan otomatis saat diketik, koma untuk desimal,
 * kursor tetap di posisinya setelah format ulang.
 */
export function NumberInput({
  value,
  onValueChange,
  decimals = 0,
  prefix,
  suffix,
  className,
  onBlur,
  ...props
}: NumberInputProps) {
  const options = { decimals };
  const [text, setText] = useState(() => numberToInputText(value, options));
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  // Nilai berubah dari luar (misal memilih produk bank): tampilkan ulang.
  const parsed = parseNumberText(text);
  if (!(Number.isNaN(parsed) && Number.isNaN(value)) && parsed !== value) {
    setText(numberToInputText(value, options));
  }

  useLayoutEffect(() => {
    if (pendingCaret.current === null || !inputRef.current) return;
    inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  });

  return (
    <div className="relative">
      {prefix ? (
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-subtle-foreground">
          {prefix}
        </span>
      ) : null}
      <Input
        {...props}
        ref={inputRef}
        type="text"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        autoComplete="off"
        value={text}
        className={cn("h-11 tabular", prefix && "pl-10", suffix && "pr-20", className)}
        onChange={(event) => {
          const raw = event.target.value;
          const caret = event.target.selectionStart ?? raw.length;
          const formatted = formatNumberText(sanitizeNumberText(raw, options));
          pendingCaret.current = caretAfterFormat(formatted, significantCount(raw, caret, options));
          setText(formatted);
          onValueChange(parseNumberText(formatted));
        }}
        onBlur={(event) => {
          // Rapikan sisa koma di akhir ("7," menjadi "7").
          setText(numberToInputText(parseNumberText(text), options));
          onBlur?.(event);
        }}
      />
      {suffix ? (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-subtle-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
