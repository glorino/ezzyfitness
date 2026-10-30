import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, badRequest, guard, notFound } from "@/lib/api";
import { one, query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/** PATCH — change inbox status (admin / front desk). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard("admin", "frontdesk");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const b = await req.json().catch(() => null);
    const status = String(b?.status ?? "");
    if (!["new", "read", "replied"].includes(status)) {
      return badRequest("Status must be new, read or replied.");
    }

    const row = await one(
      `UPDATE contact_messages SET status = $1 WHERE id = $2
       RETURNING id, name, email, subject, status`,
      [status, Number(id)]
    );
    if (!row) return notFound("Message not found.");

    await logActivity(g.user.id, `Marked message as ${status}`, "contact", { id });
    return { ok: true, row };
  });
}

/** DELETE — remove from inbox (admin only). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const res = await query(`DELETE FROM contact_messages WHERE id = $1 RETURNING id`, [Number(id)]);
    if (!res.length) return notFound("Message not found.");
    await logActivity(g.user.id, "Deleted message", "contact", { id });
    return NextResponse.json({ ok: true });
  });
}
