import { NextRequest } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, badRequest, guard, forbidden } from "@/lib/api";
import { one, query, withTransaction } from "@/lib/db";

const STATUS = ["present", "absent", "late", "cancelled"];

/**
 * POST — record attendance for one class session.
 * Accepts a single entry or a batch: { classId, date, entries: [{memberId, status}] }
 * Teachers may only mark their own classes.
 */
export async function POST(req: NextRequest) {
  const g = await guard("admin", "trainer", "frontdesk");
  if (g.error) return g.error;

  return api(async () => {
    const b = await req.json().catch(() => null);
    const classId = Number(b?.classId);
    const date = String(b?.date ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);
    const entries: { memberId: number; status: string }[] = Array.isArray(b?.entries)
      ? b.entries
      : b?.memberId
        ? [{ memberId: Number(b.memberId), status: String(b.status ?? "present") }]
        : [];

    if (!classId) return badRequest("Select a class.");
    if (!entries.length) return badRequest("No attendance entries supplied.");

    const cls = await one<{ id: number; trainer_id: number | null; name: string }>(
      `SELECT id, trainer_id, name FROM classes WHERE id = $1`,
      [classId]
    );
    if (!cls) return badRequest("That class no longer exists.");
    if (g.user.role === "trainer" && Number(cls.trainer_id) !== g.user.id) {
      return forbidden("You can only mark attendance for your own classes.");
    }

    const bad = entries.find((e) => !e.memberId || !STATUS.includes(e.status));
    if (bad) return badRequest("Each entry needs a member and a valid status.");

    const written = await withTransaction(async (tx) => {
      let n = 0;
      for (const e of entries) {
        const res = await tx.query(
          `INSERT INTO class_attendance (class_id, member_id, session_date, status, checked_in_at, recorded_by)
           VALUES ($1, $2, $3::date, $4, CASE WHEN $4 = 'absent' THEN NULL ELSE now() END, $5)
           ON CONFLICT (class_id, member_id, session_date)
             DO UPDATE SET status = EXCLUDED.status,
                           checked_in_at = EXCLUDED.checked_in_at,
                           recorded_by = EXCLUDED.recorded_by`,
          [classId, e.memberId, date, e.status, g.user.id]
        );
        n += res.rowCount ?? 0;
      }
      return n;
    });

    await logActivity(g.user.id, "Marked attendance", "attendance", {
      classId,
      date,
      count: written,
    });

    return { ok: true, count: written };
  });
}
