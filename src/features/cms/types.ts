export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  mobileImage: string | null;
  alt: string;
  cta: { label: string; href: string } | null;
}
