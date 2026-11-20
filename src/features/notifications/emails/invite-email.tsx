import { Button, Heading, Link, Section, Text } from "@react-email/components";
import { BrandLayout, EMAIL_COLORS } from "./brand-layout";

export interface InviteEmailProps {
  name: string;
  inviterName: string;
  roleLabels: string[];
  link: string;
  /** Masa berlaku tautan dalam jam. */
  validHours: number;
  siteUrl: string;
  legalName: string;
  address: string;
}

export const INVITE_EMAIL_SUBJECT = "Undangan akun KIS Operasional";

const paragraph = { fontSize: "15px", lineHeight: "24px", margin: "0 0 16px" } as const;

/** Email undangan karyawan: satu tombol aktivasi, langkah singkat, dan tautan cadangan. */
export function InviteEmail(props: InviteEmailProps) {
  return (
    <BrandLayout
      preview={`${props.inviterName} mengundang Anda ke KIS Operasional. Aktifkan akun dalam ${String(props.validHours)} jam.`}
      siteUrl={props.siteUrl}
      legalName={props.legalName}
      address={props.address}
    >
      <Heading as="h1" style={{ fontSize: "22px", lineHeight: "30px", margin: "0 0 16px" }}>
        Halo, {props.name}
      </Heading>
      <Text style={paragraph}>
        {props.inviterName} mengundang Anda ke KIS Operasional, aplikasi kerja {props.legalName}.
      </Text>
      <Section
        style={{
          backgroundColor: EMAIL_COLORS.surface,
          borderRadius: "6px",
          padding: "12px 16px",
          margin: "0 0 20px",
        }}
      >
        <Text
          style={{ fontSize: "13px", lineHeight: "20px", margin: 0, color: EMAIL_COLORS.muted }}
        >
          Role
        </Text>
        <Text style={{ fontSize: "15px", lineHeight: "22px", margin: 0, fontWeight: 700 }}>
          {props.roleLabels.join(", ")}
        </Text>
      </Section>
      <Text style={paragraph}>Aktivasi akun hanya butuh tiga langkah:</Text>
      <Text style={{ ...paragraph, margin: "0 0 24px" }}>
        1. Buat password.
        <br />
        2. Ambil foto profil.
        <br />
        3. Isi nomor HP.
      </Text>
      <Button
        href={props.link}
        style={{
          backgroundColor: EMAIL_COLORS.primary,
          color: EMAIL_COLORS.white,
          fontSize: "16px",
          fontWeight: 700,
          borderRadius: "6px",
          padding: "14px 28px",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        Aktifkan akun
      </Button>
      <Text
        style={{ ...paragraph, margin: "24px 0 8px", fontSize: "13px", color: EMAIL_COLORS.muted }}
      >
        Tautan berlaku {props.validHours} jam dan hanya bisa dipakai sekali. Kalau sudah
        kedaluwarsa, minta owner mengirim ulang undangan.
      </Text>
      <Text
        style={{
          fontSize: "13px",
          lineHeight: "20px",
          margin: "0 0 8px",
          color: EMAIL_COLORS.muted,
        }}
      >
        Kalau tombol tidak bisa diklik, salin tautan ini ke browser:
      </Text>
      <Link
        href={props.link}
        style={{
          fontSize: "13px",
          lineHeight: "20px",
          color: EMAIL_COLORS.primary,
          wordBreak: "break-all",
        }}
      >
        {props.link}
      </Link>
    </BrandLayout>
  );
}
