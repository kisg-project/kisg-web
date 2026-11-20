import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// Warna brand ditulis langsung karena klien email tidak membaca CSS variable. Nilainya sama dengan
// token di src/app/globals.css dan docs/brand.md (primary-700, primary-900, gold-400).
export const EMAIL_COLORS = {
  primary: "#0f6d5f",
  primaryDark: "#0b3d36",
  gold: "#d7ae5f",
  text: "#1c2a28",
  muted: "#5b6b68",
  border: "#dde7e4",
  surface: "#f3f7f6",
  white: "#ffffff",
} as const;

export interface BrandLayoutProps {
  /** Teks pratinjau di daftar kotak masuk. */
  preview: string;
  /** URL absolut website, untuk logo. */
  siteUrl: string;
  legalName: string;
  address: string;
  children: ReactNode;
}

/**
 * Kerangka email berkop KIS: logo, garis emas, isi, dan footer alamat kantor. Tata letak tabel dan
 * style inline (React Email) supaya rapi di Gmail, Outlook, dan aplikasi email HP.
 */
export function BrandLayout({ preview, siteUrl, legalName, address, children }: BrandLayoutProps) {
  return (
    <Html lang="id">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: EMAIL_COLORS.surface,
          margin: 0,
          padding: "24px 0",
          fontFamily: "'Plus Jakarta Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: EMAIL_COLORS.text,
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            backgroundColor: EMAIL_COLORS.white,
            border: `1px solid ${EMAIL_COLORS.border}`,
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <Section style={{ padding: "24px 32px 16px" }}>
            <Img
              src={new URL("/brand/logo-kis.png", siteUrl).toString()}
              alt="KIS Group"
              width="112"
              height="66"
              style={{ display: "block" }}
            />
          </Section>
          <Section style={{ height: "4px", backgroundColor: EMAIL_COLORS.gold }} />
          <Section style={{ padding: "28px 32px 8px" }}>{children}</Section>
          <Hr style={{ borderColor: EMAIL_COLORS.border, margin: "16px 32px" }} />
          <Section style={{ padding: "0 32px 28px" }}>
            <Text
              style={{ fontSize: "12px", lineHeight: "18px", color: EMAIL_COLORS.muted, margin: 0 }}
            >
              {legalName}
              <br />
              {address}
            </Text>
            <Text
              style={{
                fontSize: "12px",
                lineHeight: "18px",
                color: EMAIL_COLORS.muted,
                margin: "8px 0 0",
              }}
            >
              Email ini dikirim otomatis oleh sistem KIS Operasional.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
