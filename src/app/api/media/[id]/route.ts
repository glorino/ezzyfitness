import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, guard, notFound } from "@/lib/api";
import { one, query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/**
 * GET — stream an image straight from Neon (BYTEA → binary response).
 * Avatars never change, so the browser may cache them for a week; the row
 * itself carries an ETag so revalidation stays cheap.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const mediaId = Number(id);
  if (!Number.isFinite(mediaId)) return notFound("Image not found.");

  const row = await one<{
    mime: string;
    size_bytes: number;
    data: Buffer;
    created_at: string;
    kind: string;
  }>(
    `SELECT mime, size_bytes, data, kind, created_at::text AS created_at
       FROM media WHERE id = $1`,
    [mediaId]
  );
  if (!row) return notFound("Image not found.");

  const bytes = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data as unknown as Uint8Array);

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(bytes.length),
      "Cache-Control":
        row.kind === "avatar"
          ? "public, max-age=604800, stale-while-revalidate=2592000"
          : "public, max-age=3600, stale-while-revalidate=86400",
      ETag: `"m${mediaId}-${row.size_bytes}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** DELETE — remove an upload (admin only) and free Neon storage. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const mediaId = Number(id);

    // Detach from any avatars before deleting so FK stays clean.
    await query(`UPDATE users SET avatar_media_id = NULL WHERE avatar_media_id = $1`, [mediaId]);
    const rows = await query(`DELETE FROM media WHERE id = $1 RETURNING id`, [mediaId]);
    if (!rows.length) return notFound("Image not found.");

    await logActivity(g.user.id, "Deleted image", "media", { id: mediaId });
    return NextResponse.json({ ok: true });
  });
}
