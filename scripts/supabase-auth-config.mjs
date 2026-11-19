#!/usr/bin/env node
// Menerapkan pengaturan Auth ke project Supabase remote (staging atau production) lewat Management API.
// config.toml hanya untuk lokal dan CI, karena `supabase config push` ikut membawa alamat 127.0.0.1.
// Dipanggil deploy-db.yml dan deploy-production.yml. Tidak pernah mencetak nilai rahasia.
//
// Env wajib: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SITE_URL
// Env opsional: ADDITIONAL_REDIRECT_URLS (dipisah koma), BREVO_SMTP_LOGIN, BREVO_SMTP_KEY,
//               SMTP_FROM (default notifikasi@kisgroup.co.id), SMTP_SENDER_NAME (default KIS Group)

import { readFileSync } from "node:fs";

const required = ["SUPABASE_ACCESS_TOKEN", "SUPABASE_PROJECT_REF", "SITE_URL"];
for (const name of required) {
  if (!process.env[name]) {
    console.error(`GAGAL env ${name} belum diisi.`);
    process.exit(1);
  }
}

const env = process.env;
const siteUrl = env.SITE_URL.replace(/\/$/, "");
const redirects = [`${siteUrl}/**`, ...(env.ADDITIONAL_REDIRECT_URLS ?? "").split(",")]
  .map((value) => value.trim())
  .filter(Boolean);

/** @type {Record<string, unknown>} */
const payload = {
  site_url: siteUrl,
  uri_allow_list: redirects.join(","),
  // Tanpa pendaftaran publik: akun hanya lewat undangan (CLAUDE.md bagian 8).
  disable_signup: true,
  external_email_enabled: true,
  password_min_length: 10,
  password_required_characters: "abcdefghijklmnopqrstuvwxyz:ABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789",
  security_update_password_require_reauthentication: true,
  mailer_secure_email_change_enabled: true,
  refresh_token_rotation_enabled: true,
  // 2FA TOTP (wajib untuk owner dan admin, dipaksa di aplikasi).
  mfa_totp_enroll_enabled: true,
  mfa_totp_verify_enabled: true,
  hook_custom_access_token_enabled: true,
  hook_custom_access_token_uri: "pg-functions://postgres/public/custom_access_token_hook",
  // Batas ketat per IP per 5 menit untuk login dan verifikasi.
  rate_limit_verify: 30,
  rate_limit_otp: 30,
  rate_limit_token_refresh: 150,
  // Template email berbahasa Indonesia (sama dengan lokal, supabase/templates).
  mailer_subjects_invite: "Undangan portal KIS Group",
  mailer_templates_invite_content: readFileSync("supabase/templates/invite.html", "utf8"),
  mailer_subjects_recovery: "Atur ulang password portal KIS Group",
  mailer_templates_recovery_content: readFileSync("supabase/templates/recovery.html", "utf8"),
};

const smtpReady = Boolean(env.BREVO_SMTP_LOGIN && env.BREVO_SMTP_KEY);
if (smtpReady) {
  Object.assign(payload, {
    smtp_host: "smtp-relay.brevo.com",
    smtp_port: "587",
    smtp_user: env.BREVO_SMTP_LOGIN,
    smtp_pass: env.BREVO_SMTP_KEY,
    smtp_admin_email: env.SMTP_FROM ?? "notifikasi@kisgroup.co.id",
    smtp_sender_name: env.SMTP_SENDER_NAME ?? "KIS Group",
    rate_limit_email_sent: 100,
  });
}

const response = await fetch(
  `https://api.supabase.com/v1/projects/${env.SUPABASE_PROJECT_REF}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  },
);

if (!response.ok) {
  const text = await response.text();
  console.error(`GAGAL menerapkan pengaturan Auth: HTTP ${response.status} ${text.slice(0, 300)}`);
  process.exit(1);
}

console.log(
  `OK    pengaturan Auth diterapkan ke ${env.SUPABASE_PROJECT_REF} (site_url ${siteUrl})`,
);
console.log(
  smtpReady
    ? "OK    SMTP Brevo aktif"
    : "INFO  SMTP Brevo belum diisi, email Auth memakai layanan bawaan Supabase (terbatas)",
);
