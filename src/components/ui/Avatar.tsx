"use client";

import { cn, initials } from "@/lib/format";
import Image from "next/image";
import { useState } from "react";

/**
 * Avatar: DB-stored photo (`/api/media/{id}`) when available, otherwise an
 * on-brand monogram tile.
 */
export function Avatar({
  name,
  mediaId,
  size = "md",
  className,
}: {
  name: string | null | undefined;
  mediaId?: number | string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const sizes = {
    xs: "h-8 w-8 text-[11px]",
    sm: "h-10 w-10 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  };
  const hasPhoto = mediaId != null && !failed;

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/12 bg-gradient-to-br from-volt-300/25 via-ink-700 to-ink-900 font-semibold text-volt-200",
        sizes[size],
        className
      )}
      aria-hidden
    >
      {hasPhoto ? (
        <Image
          src={`/api/media/${mediaId}`}
          alt={name ?? "avatar"}
          fill
          sizes="96px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="tracking-tight">{initials(name)}</span>
      )}
    </div>
  );
}
