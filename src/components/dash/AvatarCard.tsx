"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/client";
import { ImageUpload } from "@/components/dash/ImageUpload";

/**
 * Avatar upload wired to /api/media (BYTEA in Neon) + the user record.
 * Uses /api/profile which every signed-in role may call.
 */
export function AvatarCard({
  fullName,
  mediaId,
  label = "Profile photo",
}: {
  fullName: string;
  mediaId: number | null;
  label?: string;
}) {
  const router = useRouter();
  const { push } = useToast();

  async function saveAvatar(id: number | null) {
    try {
      await callApi("/api/profile", "PATCH", { avatarMediaId: id });
      push("success", id ? "Photo updated." : "Photo removed.");
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Could not save the photo.");
    }
  }

  return (
    <div className="surface-raised p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-smoke-200">{label}</h3>
      <p className="mt-1 text-xs text-smoke-500">
        Shown across Ezzy Fitness. Photos are resized automatically before upload.
      </p>
      <div className="mt-4">
        <ImageUpload
          kind="avatar"
          name={fullName}
          label={label}
          currentMediaId={mediaId}
          onUploaded={(id) => saveAvatar(id)}
          onRemoved={() => saveAvatar(null)}
        />
      </div>
    </div>
  );
}
