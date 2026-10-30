import { NextRequest } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, badRequest, guard, notFound } from "@/lib/api";
import { one, query } from "@/lib/db";

/** POST — log a front-desk / trainer check-in for a member. */
export async function POST(req: NextRequest) {
  const g = await guard("admin", "frontdesk", "trainer");
  if (g.error) return g.error;

  return api(async () => {
    const b = await req.json().catch(() => null);
    const memberId = Number(b?.memberId);
    const note = String(b?.note ?? "").trim().slice(0, 240);
    const method = ["frontdesk", "trainer", "self"].includes(b?.method)
      ? b.method
      : g.user.role === "trainer"
        ? "trainer"
        : "frontdesk";

    if (!memberId) return badRequest("Select a member to check in.");

    const member = await one<{ id: number; status: string }>(
      `SELECT u.id, m.status FROM users u JOIN members m ON m.user_id = u.id WHERE u.id = $1`,
      [memberId]
    );
    if (!member) return notFound("Member not found.");

    const row = await one(
      `INSERT INTO check_ins (member_id, method, note, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at::text AS created_at`,
      [memberId, method, note || null, g.user.id]
    );

    await logActivity(g.user.id, "Member checked in", "check_in", { memberId, method });

    return {
      ok: true,
      row,
      membershipStatus: member.status,
      message: "Checked in.",
    };
  });
}

/** GET — recent check-ins (staff, lightweight for the front-desk widget). */
export async function GET(req: NextRequest) {
  const g = await guard("admin", "frontdesk", "trainer");
  if (g.error) return g.error;

  return api(async () => {
    const url = new URL(req.url);
    const limit = Math.min(200, Number(url.searchParams.get("limit") ?? 50) || 50);
    const rows = await query(
      `SELECT c.id, c.method, c.note, c.created_at::text AS created_at,
              u.id AS member_id, u.full_name, m.membership_no, m.status AS membership_status
         FROM check_ins c
         JOIN users u ON u.id = c.member_id
         LEFT JOIN members m ON m.user_id = u.id
        ORDER BY c.created_at DESC
        LIMIT ${limit}`
    );
    return { rows };
  });
}
