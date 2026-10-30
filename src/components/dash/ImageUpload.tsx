"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/client";
import { cn } from "@/lib/format";

/*
 * Client-side image uploader tuned for the Neon FREE plan:
 *   1. Downscale on a <canvas> (avatars rarely need more than 640px)
 *   2. Re-encode as JPEG/WebP and walk quality down until under the cap
 *   3. POST base64 to /api/media which stores it as BYTEA in Neon
 * Typical avatar: 60–150 KB. No paid blob storage anywhere.
 */

const TARGET_MAX_SIDE = 900; // px — enough for any display size on the site
const SERVER_MAX_KB = 900; // must match UPLOAD_MAX_KB in .env.local
const FALLBACK_QUALITIES = [0.82, 0.7, 0.6, 0.48, 0.36];

async function compress(file: File): Promise<{ data: string; width: number; height: number; bytes: number }> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("That file doesn't look like an image we can read.");

  const scale = Math.min(1, TARGET_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  // GIFs must keep their frames — store as-is if small enough.
  if (file.type === "image/gif" && file.size <= 300 * 1024) {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read that file."));
      reader.readAsDataURL(file);
    });
    return { data, width, height, bytes: file.size };
  }

  for (const q of FALLBACK_QUALITIES) {
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    const bytes = Math.round((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75);
    if (bytes <= SERVER_MAX_KB * 1024 * 0.92) return { data: dataUrl, width, height, bytes };
  }
  const dataUrl = canvas.toDataURL("image/jpeg", 0.3);
  return { data: dataUrl, width, height, bytes: file.size };
}

export function ImageUpload({
  kind = "misc",
  currentMediaId = null,
  name,
  label = "Profile photo",
  onUploaded,
  onRemoved,
  className,
}: {
  kind?: "avatar" | "trainer" | "class" | "gallery" | "misc";
  currentMediaId?: number | null;
  name?: string;
  label?: string;
  onUploaded?: (mediaId: number) => void;
  onRemoved?: () => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<number | null>(currentMediaId);
  const [tempUrl, setTempUrl] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const { data, width, height, bytes } = await compress(file);
      setSize(`${Math.round(bytes / 1024)} KB · ${width}×${height}`);
      const res = await callApi<{ id: number }>("/api/media", "POST", {
        kind,
        name: name || file.name.replace(/\.[^.]+$/, ""),
        data,
        width,
        height,
      });
      setTempUrl(data);
      setPreview(res.id);
      onUploaded?.(res.id);
      push("success", "Image uploaded to Ezzy Fitness storage.");
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-volt-300/20 via-ink-700 to-ink-900">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tempUrl ?? `/api/media/${preview}`}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImagePlus className="h-6 w-6 text-smoke-500" />
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-ink-950/70">
            <Loader2 className="h-5 w-5 animate-spin text-volt-300" />
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-smoke-200">{label}</p>
        <p className="mt-0.5 text-xs text-smoke-500">
          {size ?? "JPG, PNG or WebP · auto-resized before upload"}
        </p>
        <div className="mt-2 flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="btn-ghost btn-sm"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {preview ? "Replace" : "Upload"}
          </button>
          {preview && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPreview(null);
                setTempUrl(null);
                setSize(null);
                onRemoved?.();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-smoke-400 transition hover:border-ember/50 hover:text-ember"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
