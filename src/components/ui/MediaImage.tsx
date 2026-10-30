"use client";

import { cn, img as unsplash } from "@/lib/format";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/**
 * Image with a designed fallback: if the URL fails (offline, expired CDN,
 * removed record) the block degrades to an on-brand gradient tile instead of
 * a broken-image icon.
 *
 * - Local `/logo.jpeg` and `/api/media/*` go through next/image (optimised).
 * - Unsplash editorial imagery is `unoptimized` (fetched by the browser).
 */
export function MediaImage({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  fallbackIcon: Icon = ImageIcon,
  fill = false,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  sizes?: string;
  fallbackIcon?: typeof ImageIcon;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const isRemote = /^https?:\/\//.test(src);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-ink-700 via-ink-850 to-ink-950",
        className
      )}
    >
      {failed ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/5 text-smoke-500">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          priority={priority}
          sizes={sizes}
          unoptimized={isRemote}
          onError={() => setFailed(true)}
          className={cn("object-cover", imgClassName)}
        />
      )}
    </div>
  );
}

/** Convenience for unsplash ids: `<Unsplash id="photo-..." />`. */
export function Unsplash({
  id,
  alt,
  className,
  imgClassName,
  width = 1200,
  priority = false,
  sizes,
}: {
  id: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  width?: number;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <MediaImage
      src={unsplash(id, width)}
      alt={alt}
      className={className}
      imgClassName={imgClassName}
      priority={priority}
      fill
      sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"}
    />
  );
}
