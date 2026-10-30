import { NextRequest } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, badRequest, guard } from "@/lib/api";
import { query } from "@/lib/db";

/** POST — create a membership plan (admin only). */
export async function POST(req: NextRequest) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const b = await req.json().catch(() => null);
    const name = String(b?.name ?? "").trim();
    const tagline = String(b?.tagline ?? "").trim().slice(0, 120);
    const price = Math.round(Number(b?.price ?? 0));
    const duration = Math.round(Number(b?.durationDays ?? 0));
    const features = (Array.isArray(b?.features) ? b.features : [])
      .map((f: unknown) => String(f).trim())
      .filter(Boolean)
      .slice(0, 10);

    if (!name) return badRequest("Give the plan a name.");
    if (!Number.isFinite(price) || price <= 0) return badRequest("Enter a valid price in ₦.");
    if (!Number.isFinite(duration) || duration <= 0) return badRequest("Enter the duration in days.");

    const rows = await query<{ id: number }>(
      `INSERT INTO plans (name, tagline, price_ngn, duration_days, features, is_popular, sort_order)
       VALUES ($1, $2, $3, $4, $5::jsonb, false, COALESCE((SELECT MAX(sort_order) FROM plans), 0) + 1)
       RETURNING id`,
      [name, tagline || null, price, duration, JSON.stringify(features)]
    );

    await logActivity(g.user.id, "Created membership plan", "plan", { name, price });
    return { ok: true, id: Number(rows[0].id) };
  });
}
