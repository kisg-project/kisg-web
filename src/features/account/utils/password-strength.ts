export type PasswordStrength = "kosong" | "lemah" | "sedang" | "kuat";

/**
 * Indikator kekuatan password untuk pengguna (bukan pengaman: aturan wajib ada di skema dan Supabase
 * Auth). Kuat: lolos aturan wajib, minimal 12 karakter dengan simbol, atau minimal 16 karakter.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (password.length === 0) return "kosong";
  const rules = [/[a-z]/, /[A-Z]/, /[0-9]/].filter((rule) => rule.test(password)).length;
  if (password.length < 10 || rules < 3) return "lemah";
  const symbol = /[^A-Za-z0-9]/.test(password);
  if ((password.length >= 12 && symbol) || password.length >= 16) return "kuat";
  return "sedang";
}
