import { Button, Heading, Link, Text } from "@react-email/components";
import { BrandLayout, EMAIL_COLORS } from "./brand-layout";

export interface NotificationEmailProps {
  name: string;
  title: string;
  body: string;
  link: string;
  siteUrl: string;
  legalName: string;
  address: string;
}

const muted = { fontSize: "13px", lineHeight: "20px", color: EMAIL_COLORS.muted } as const;

export function NotificationEmail(props: NotificationEmailProps) {
  return (
    <BrandLayout
      preview={props.body || props.title}
      siteUrl={props.siteUrl}
      legalName={props.legalName}
      address={props.address}
    >
      <Text style={{ ...muted, margin: "0 0 4px" }}>Halo, {props.name}</Text>
      <Heading as="h1" style={{ fontSize: "20px", lineHeight: "28px", margin: "0 0 12px" }}>
        {props.title}
      </Heading>
      {props.body ? (
        <Text style={{ fontSize: "15px", lineHeight: "24px", margin: "0 0 24px" }}>
          {props.body}
        </Text>
      ) : null}
      <Button
        href={props.link}
        style={{
          backgroundColor: EMAIL_COLORS.primary,
          color: EMAIL_COLORS.white,
          fontSize: "15px",
          fontWeight: 700,
          borderRadius: "999px",
          padding: "12px 24px",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        Buka KIS Operasional
      </Button>
      <Text style={{ ...muted, margin: "24px 0 8px" }}>
        Kalau tombol tidak bisa diklik, salin tautan ini ke browser:
      </Text>
      <Link
        href={props.link}
        style={{ ...muted, color: EMAIL_COLORS.primary, wordBreak: "break-all" }}
      >
        {props.link}
      </Link>
    </BrandLayout>
  );
}
