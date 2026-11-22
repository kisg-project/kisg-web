import Image from "next/image";
import { MASCOTS, mascotSrc, type MascotPose } from "@/config/mascots";
import { cn } from "@/lib/utils";

export function Mascot({
  pose,
  className,
  sizes = "160px",
  eager = false,
}: {
  pose: MascotPose;
  className?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const { width, height } = MASCOTS[pose];
  return (
    <Image
      src={mascotSrc(pose)}
      alt=""
      width={width}
      height={height}
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      className={cn("pointer-events-none h-auto select-none", className)}
    />
  );
}
