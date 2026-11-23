const PORTAL_PATH = /^\/portal(?=\/|$)/;

export function safePortalHref(href: string | null | undefined): string {
  if (!href || !PORTAL_PATH.test(href) || href.includes("//") || href.includes("\\"))
    return "/portal";
  return href;
}

export function publicPortalPath(href: string, base: string): string {
  const path = safePortalHref(href);
  if (base === "/portal") return path;
  return path.replace(PORTAL_PATH, "") || "/";
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export function pushPayload(input: {
  title: string;
  body: string;
  href: string;
  dedupeKey: string;
}): PushPayload {
  return {
    title: input.title.slice(0, 120),
    body: input.body.slice(0, 240),
    url: safePortalHref(input.href),
    tag: input.dedupeKey.slice(0, 64),
  };
}

export function unreadBadge(count: number): string | null {
  if (count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}
