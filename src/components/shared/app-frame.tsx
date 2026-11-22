import type { ReactNode } from "react";
import { Work_Sans } from "next/font/google";
import { BodyClass } from "./body-class";

const PREFERENCES = `try{var r=document.documentElement,s=localStorage;if(s.getItem("kis-tema")==="gelap")r.setAttribute("data-tema","gelap");if(s.getItem("kis-rel")==="lebar")r.setAttribute("data-rel","lebar")}catch(e){}`;

const workSans = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"], display: "swap" });

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className={workSans.variable}>
      <script dangerouslySetInnerHTML={{ __html: PREFERENCES }} />
      <BodyClass className={workSans.variable} />
      {children}
    </div>
  );
}
