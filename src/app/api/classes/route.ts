import { NextRequest } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, badRequest, guard } from "@/lib/api";
import { one, query } from "@/lib/db";

const INTENSITIES = ["Low", "Medium", "High"];

function readClass(b: Record<string, unknown>, partial = false) {
  const out: Record<string, unknown> = {};
  const has = (k: string) => !partial || b[k] !== undefined;

  if (has("name")) {
    const name = String(b.name ?? "").trim();
    if (!name) return { error: "Class name is required." };
    out.name = name;
  }
  if (has("category")) out.category = String(b.category ?? "General").trim() || "General";
  if (has("description")) out.description = String(b.description ?? "").trim().slice(0, 600);

  if (has("trainerId")) out.trainer_id = Number(b.trainerId) || null;

  if (has("day")) {
    const day = Number(b.day);
    if (!Number.isInteger(day) || day < 0 || day > 6) return { error: "Pick a day of the week." };
    out.day_of_week = day;
  }
  if (has("startTime")) {
    const t = String(b.startTime ?? "");
    if (!/^\d{2}:\d{2}/.test(t)) return { error: "Start time must be in HH:MM format." };
    out.start_time = t.slice(0, 5);
  }
  if (has("endTime")) {
    const t = String(b.endTime ?? "");
    if (!/^\d{2}:\d{2}/.test(t)) return { error: "End time must be in HH:MM format." };
    out.end_time = t.slice(0, 5);
  }
  if (has("capacity")) {
    const cap = Math.round(Number(b.capacity));
    if (!Number.isFinite(cap) || cap < 1 || cap > 500) return { error: "Capacity must be 1–500." };
    out.capacity = cap;
  }
  if (has("location")) out.location = String(b.location ?? "Main Floor").trim() || "Main Floor";
  if (has("intensity")) {
    if (!INTENSITIES.includes(String(b.intensity))) return { error: "Intensity must be Low, Medium or High." };
    out.intensity = b.intensity;
  }
  if (has("isActive")) out.is_active = Boolean(b.isActive);

  return { values: out };
}

/** POST — create a class (admin). */
export async function POST(req: NextRequest) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const b = (await req.json().catch(() => null)) ?? {};
    const parsed = readClass(b as Record<string, unknown>);
    if (parsed.error) return badRequest(parsed.error);

    const v = parsed.values!;
    const keys = Object.keys(v);
    const cols = keys.join(", ");
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");

    const row = await one(
      `INSERT INTO classes (${cols}) VALUES (${placeholders}) RETURNING id, name`,
      keys.map((k) => v[k])
    );

    await logActivity(g.user.id, "Created class", "class", { name: v.name });
    return { ok: true, row };
  });
}

/** GET — staff-facing class list with attendance counts. */
export async function GET(req: NextRequest) {
  const g = await guard("admin", "frontdesk", "trainer");
  if (g.error) return g.error;

  return api(async () => {
    const url = new URL(req.url);
    const day = url.searchParams.get("day");
    const rows = await query(
      `SELECT c.id, c.name, c.category, c.description, c.day_of_week, c.start_time::text AS start,
              c.end_time::text AS end, c.capacity, c.location, c.intensity, c.is_active,
              c.trainer_id, u.full_name AS trainer,
              (SELECT count(*)::int FROM class_attendance a
                WHERE a.class_id = c.id AND a.session_date = CURRENT_DATE) AS today_attendance
         FROM classes c
         LEFT JOIN users u ON u.id = c.trainer_id
        ${day ? "WHERE c.day_of_week = $1" : ""}
        ORDER BY c.day_of_week, c.start_time`,
      day ? [Number(day)] : []
    );
    return { rows };
  });
}
