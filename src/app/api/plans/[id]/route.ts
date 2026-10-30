import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, badRequest, guard, notFound } from "@/lib/api";
import { one, query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/** PATCH — update a membership plan (admin only). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const planId = Number(id);
    const b = await req.json().catch(() => null);

    const exists = await one(`SELECT id FROM plans WHERE id = $1`, [planId]);
    if (!exists) return notFound("Plan not found.");

    const sets: string[] = [];
    const values: unknown[] = [];
    const add = (col: string, val: unknown) => {
      values.push(val);
      sets.push(`${col} = $${values.length}`);
    };

    if (b?.name !== undefined) {
      const name = String(b.name).trim();
      if (!name) return badRequest("Give the plan a name.");
      add("name", name);
    }
    if (b?.tagline !== undefined) add("tagline", String(b.tagline).trim().slice(0, 120) || null);
    if (b?.price !== undefined) {
      const price = Math.round(Number(b.price));
      if (!Number.isFinite(price) || price <= 0) return badRequest("Enter a valid price in ₦.");
      add("price_ngn", price);
    }
    if (b?.durationDays !== undefined) {
      const d = Math.round(Number(b.durationDays));
      if (!Number.isFinite(d) || d <= 0) return badRequest("Enter the duration in days.");
      add("duration_days", d);
    }
    if (b?.features !== undefined) {
      const features = (Array.isArray(b.features) ? b.features : [])
        .map((f: unknown) => String(f).trim())
        .filter(Boolean)
        .slice(0, 10);
      add("features", JSON.stringify(features));
    }
    if (b?.isPopular !== undefined) add("is_popular", Boolean(b.isPopular));
    if (b?.isActive !== undefined) add("is_active", Boolean(b.isActive));
    if (b?.sortOrder !== undefined) add("sort_order", Number(b.sortOrder) || 0);

    if (sets.length) {
      values.push(planId);
      await query(`UPDATE plans SET ${sets.join(", ")} WHERE id = $${values.length}`, values);
    }

    await logActivity(g.user.id, "Updated membership plan", "plan", { planId });
    return { ok: true };
  });
}

/** DELETE — archive a plan by disabling it (kept for payment history). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const planId = Number(id);
    const rows = await query(
      `UPDATE plans SET is_active = false WHERE id = $1 RETURNING id`,
      [planId]
    );
    if (!rows.length) return notFound("Plan not found.");

    await logActivity(g.user.id, "Archived membership plan", "plan", { planId });
    return NextResponse.json({ ok: true });
  });
}
