"use client";

import { usePathname } from "next/navigation";
import type { MascotPose } from "@/config/mascots";
import { Mascot } from "./mascot";

function poseFor(pathname: string): MascotPose {
  if (/lupa-password|reset-password/.test(pathname)) return "kunci";
  if (pathname.includes("aktivasi")) return "melambai";
  return "login";
}

export function AuthMascot({ className }: { className?: string }) {
  return (
    <Mascot
      pose={poseFor(usePathname())}
      eager
      sizes="(min-width: 1024px) 300px, 170px"
      className={className}
    />
  );
}
