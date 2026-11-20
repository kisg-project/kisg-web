import "server-only";
import type { ReactElement } from "react";
import { render } from "@react-email/render";

/** HTML dan versi teks biasa dari satu template React Email. */
export async function renderEmail(element: ReactElement): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { html, text };
}
