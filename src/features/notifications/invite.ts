import "server-only";
import { createElement } from "react";
import { ROLE_LABELS, type AppRole } from "@/config/roles";
import { formatOfficeAddress, siteConfig } from "@/config/site";
import { env } from "@/env";
import { sendEmail, type EmailResult } from "@/lib/email/send";
import { INVITE_EMAIL_SUBJECT, InviteEmail } from "./emails/invite-email";
import { renderEmail } from "./emails/render";

/** Masa berlaku tautan undangan (jam). Sama dengan otp_expiry Supabase Auth. */
export const INVITE_VALID_HOURS = 24;

/** Mengirim email undangan berkop KIS. Mengembalikan sent=false kalau email belum dikonfigurasi. */
export async function sendInviteEmail(input: {
  email: string;
  name: string;
  inviterName: string;
  roles: readonly AppRole[];
  link: string;
}): Promise<EmailResult> {
  const { html, text } = await renderEmail(
    createElement(InviteEmail, {
      name: input.name,
      inviterName: input.inviterName,
      roleLabels: input.roles.map((role) => ROLE_LABELS[role]),
      link: input.link,
      validHours: INVITE_VALID_HOURS,
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
      legalName: siteConfig.legalName,
      address: formatOfficeAddress(),
    }),
  );
  return sendEmail({
    to: { email: input.email, name: input.name },
    subject: INVITE_EMAIL_SUBJECT,
    html,
    text,
  });
}
