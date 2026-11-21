import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { relativeRedirect } from "@/lib/http/redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// magiclink: tautan undangan yang dikirim ulang (akun sudah ada, belum aktivasi).
const ALLOWED_TYPES: readonly EmailOtpType[] = [
  "invite",
  "magiclink",
  "recovery",
  "email",
  "email_change",
];

function isAllowedType(value: string | null): value is EmailOtpType {
  return (ALLOWED_TYPES as readonly (string | null)[]).includes(value);
}

/** Hanya path CMS internal (cegah open redirect). */
function safeCmsPath(next: string | null, fallback: string): string {
  return next && /^\/cms(\/[\w\-/]*)?$/.test(next) ? next : fallback;
}

/**
 * Tautan dari email untuk akun CMS (lupa password), sama dengan /portal/auth/confirm. Template email memakai token_hash
 * (supabase/templates). Parameter code (PKCE) didukung sebagai cadangan.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const next = safeCmsPath(searchParams.get("next"), "/cms/reset-password");
  const supabase = await createSupabaseServerClient();

  let ok = false;
  if (tokenHash && isAllowedType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  const target = ok ? next : "/cms/login?error=tautan";
  return relativeRedirect(target);
}
