import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, badRequest, guard, notFound } from "@/lib/api";
import { one, query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/** PATCH — edit a class (admin). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const b = (await req.json().catch(() => null)) ?? {};
    const p = b as Record<string, unknown>;

    const sets: string[] = [];
    const values: unknown[] = [];
    const add = (col: string, val: unknown) => {
      values.push(val);
      sets.push(`${col} = $${values.length}`);
    };

    if (p.name !== undefined) {
      const name = String(p.name).trim();
      if (!name) return badRequest("Class name is required.");
      add("name", name);
    }
    if (p.category !== undefined) add("category", String(p.category).trim() || "General");
    if (p.description !== undefined) add("description", String(p.description).trim().slice(0, 600));
    if (p.trainerId !== undefined) add("trainer_id", Number(p.trainerId) || null);
    if (p.day !== undefined) {
      const d = Number(p.day);
      if (!Number.isInteger(d) || d < 0 || d > 6) return badRequest("Pick a valid day.");
      add("day_of_week", d);
    }
    if (p.startTime !== undefined) {
      const t = String(p.startTime);
      if (!/^\d{2}:\d{2}/.test(t)) return badRequest("Start time must be HH:MM.");
      add("start_time", t.slice(0, 5));
    }
    if (p.endTime !== undefined) {
      const t = String(p.endTime);
      if (!/^\d{2}:\d{2}/.test(t)) return badRequest("End time must be HH:MM.");
      add("end_time", t.slice(0, 5));
    }
    if (p.capacity !== undefined) {
      const cap = Math.round(Number(p.capacity));
      if (!Number.isFinite(cap) || cap < 1) return badRequest("Capacity must be at least 1.");
      add("capacity", cap);
    }
    if (p.location !== undefined) add("location", String(p.location).trim() || "Main Floor");
    if (p.intensity !== undefined) {
      if (!["Low", "Medium", "High"].includes(String(p.intensity)))
        return badRequest("Intensity must be Low, Medium or High.");
      add("intensity", p.intensity);
    }
    if (p.isActive !== undefined) add("is_active", Boolean(p.isActive));

    if (!sets.length) return badRequest("Nothing to update.");

    values.push(Number(id));
    const row = await one(
      `UPDATE classes SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING id, name`,
      values
    );
    if (!row) return notFound("Class not found.");

    await logActivity(g.user.id, "Updated class", "class", { id, name: row.name });
    return { ok: true, row };
  });
}

/** DELETE — remove a class and its attendance history (admin). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const rows = await query(`DELETE FROM classes WHERE id = $1 RETURNING id, name`, [Number(id)]);
    if (!rows.length) return notFound("Class not found.");

    await logActivity(g.user.id, "Deleted class", "class", { id, name: rows[0].name });
    return NextResponse.json({ ok: true });
  });
}
