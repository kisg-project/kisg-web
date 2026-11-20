import type { ReactNode } from "react";
import { Container } from "@/components/shared/container";

/** Tata letak halaman legal: lebar baca nyaman, heading berurutan, tautan bergaris bawah. */
export function LegalBody({ children }: { children: ReactNode }) {
  return (
    <Container className="py-10 sm:py-14">
      <div className="grid max-w-3xl gap-4 text-base leading-relaxed [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-1.5 [&_ul]:pl-6">
        {children}
      </div>
    </Container>
  );
}
