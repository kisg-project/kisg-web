import { NextResponse } from "next/server";

/**
 * Redirect dengan Location relatif. Browser menyelesaikannya terhadap URL yang sedang dibuka, jadi
 * host tetap sama di semua lingkungan. Di Next yang dijalankan sendiri, request.url di route handler
 * memakai localhost, sehingga redirect absolut bisa pindah host dan cookie sesi tertinggal.
 */
export function relativeRedirect(path: string, status: 303 | 307 = 307): NextResponse {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("relativeRedirect hanya untuk path internal.");
  }
  return new NextResponse(null, { status, headers: { location: path } });
}
