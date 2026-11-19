import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: readonly EmailOtpType[] = ["invite", "recovery", "email", "email_change"];

function isAllowedType(value: string | null): value is EmailOtpType {
  return (ALLOWED_TYPES as readonly (string | null)[]).includes(value);
}

/** Hanya path portal internal (cegah open redirect). */
function safePortalPath(next: string | null, fallback: string): string {
  return next && /^\/portal(\/[\w\-/]*)?$/.test(next) ? next : fallback;
}

/**
 * Tautan dari email (undangan, lupa password). Template email memakai token_hash
 * (supabase/templates). Parameter code (PKCE) didukung sebagai cadangan.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const next = safePortalPath(searchParams.get("next"), "/portal/reset-password");
  const supabase = await createSupabaseServerClient();

  let ok = false;
  if (tokenHash && isAllowedType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  const target = ok ? next : "/portal/login?error=tautan";
  return NextResponse.redirect(new URL(target, request.url));
}
