import Image from "next/image";
import { cn } from "@/lib/format";

/**
 * Supplied logo is black artwork on white JPEG. `scripts/make-logo.mjs`
 * derives transparent PNGs from it:
 *   logo-white.png → white ink, transparent bg (dark surfaces)
 *   logo-dark.png  → black ink, transparent bg (light surfaces)
 */
export function Logo({
  className,
  variant = "white",
  priority = false,
  width = 320,
  height = 148,
}: {
  className?: string;
  variant?: "white" | "dark" | "original";
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  const src =
    variant === "original" ? "/logo.jpeg" : variant === "dark" ? "/logo-dark.png" : "/logo-white.png";

  return (
    <Image
      src={src}
      alt="Ezzy Fitness — Ezra Mall, Benin City"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-11 w-auto select-none", className)}
    />
  );
}
