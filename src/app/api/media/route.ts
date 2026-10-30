import { NextRequest } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, badRequest, guard } from "@/lib/api";
import { one, query } from "@/lib/db";

/*
 * Media uploads are stored INSIDE Neon itself (BYTEA) so the whole site runs
 * on the Neon FREE plan — no S3/Cloudinary, no upgrade.
 * To stay inside the 0.5 GB free storage we enforce two budgets:
 *   • UPLOAD_MAX_KB  — per-file cap (default 900 KB) after client downscaling
 *   • MEDIA_BUDGET_MB — total media storage cap (default 120 MB)
 */

const MAX_KB = Math.max(100, Number(process.env.UPLOAD_MAX_KB ?? 900) || 900);
const BUDGET_MB = Math.max(10, Number(process.env.MEDIA_BUDGET_MB ?? 120) || 120);
const MAX_BYTES = MAX_KB * 1024;

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * POST — upload an image.
 * Body: JSON `{ kind, name, data: "<base64>" }` (client pre-compresses via
 * canvas so typical avatars land around 60–150 KB).
 * Any signed-in user may upload (members attach photos to their profile);
 * budget caps keep everything inside the Neon FREE plan.
 */
export async function POST(req: NextRequest) {
  const g = await guard();
  if (g.error) return g.error;

  return api(async () => {
    const body = (await req.json().catch(() => null)) as {
      kind?: string;
      name?: string;
      data?: string;
      width?: number;
      height?: number;
    } | null;

    if (!body?.data) return badRequest("No image data received.");
    const mime = String(body.data.slice(0, body.data.indexOf(",")) ?? "")
      .replace(/^data:/, "")
      .replace(/;base64$/, "");
    if (!ALLOWED_MIME[mime]) {
      return badRequest("Use a JPEG, PNG, WebP, GIF or AVIF image.");
    }

    const buffer = Buffer.from(body.data.slice(body.data.indexOf(",") + 1), "base64");
    if (!buffer.length) return badRequest("The uploaded file appears to be empty.");
    if (buffer.length > MAX_BYTES) {
      return badRequest(`That image is too large — keep it under ${MAX_KB} KB.`);
    }

    // Global storage budget (Neon free plan headroom).
    const usage = await one<{ used: number }>(
      `SELECT COALESCE(SUM(size_bytes), 0)::bigint AS used FROM media`
    );
    const budgetBytes = BUDGET_MB * 1024 * 1024;
    if ((usage?.used ?? 0) + buffer.length > budgetBytes) {
      return badRequest(
        `Image storage is full (${BUDGET_MB} MB budget). Delete an older upload and try again.`
      );
    }

    const kind = ["avatar", "trainer", "class", "gallery", "misc"].includes(String(body.kind))
      ? String(body.kind)
      : "misc";
    const base = (body.name || "upload").replace(/[^\w.\- ]+/g, "").slice(0, 60) || "upload";
    const name = `${base}.${ALLOWED_MIME[mime]}`;

    const rows = await query<{ id: number }>(
      `INSERT INTO media (kind, name, mime, size_bytes, data, width, height, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        kind,
        name,
        mime,
        buffer.length,
        buffer,
        Number(body.width) || null,
        Number(body.height) || null,
        g.user.id,
      ]
    );
    const id = Number(rows[0].id);

    await logActivity(g.user.id, "Uploaded image", "media", { id, kind, size: buffer.length });

    return {
      ok: true,
      id,
      url: `/api/media/${id}`,
      bytes: buffer.length,
      budgetUsedMb: ((usage?.used ?? 0) + buffer.length) / 1024 / 1024,
      budgetMb: BUDGET_MB,
    };
  });
}

/** GET — recent uploads for the given kind (staff tooling). */
export async function GET(req: NextRequest) {
  const g = await guard("admin", "trainer", "frontdesk");
  if (g.error) return g.error;

  return api(async () => {
    const kind = req.nextUrl.searchParams.get("kind") || undefined;
    const rows = await query(
      `SELECT id, kind, name, mime, size_bytes, width, height, created_at::text AS created_at
         FROM media
        WHERE ($1::text IS NULL OR kind = $1)
        ORDER BY created_at DESC
        LIMIT 60`,
      [kind ?? null]
    );
    return { media: rows };
  });
}
