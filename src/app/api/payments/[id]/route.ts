import { NextRequest } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, badRequest, guard, notFound } from "@/lib/api";
import { one, query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };
const STATUSES = ["paid", "pending", "failed", "refunded"];

/** PATCH — correct a payment status or attach notes (admin only for refunds). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard("admin", "frontdesk");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const b = await req.json().catch(() => null);
    const status = String(b?.status ?? "");

    if (status && !STATUSES.includes(status)) return badRequest("Invalid payment status.");
    if (status === "refunded" && g.user.role !== "admin") {
      return badRequest("Only an admin can mark a payment as refunded.");
    }

    const row = await one(
      `UPDATE payments
          SET status = COALESCE(NULLIF($1, ''), status),
              notes = COALESCE(NULLIF($2, ''), notes)
        WHERE id = $3
        RETURNING id, member_id, amount_ngn, status`,
      [status, String(b?.notes ?? ""), Number(id)]
    );
    if (!row) return notFound("Payment not found.");

    await logActivity(g.user.id, `Payment marked ${row.status}`, "payment", {
      id: row.id,
      amount: row.amount_ngn,
    });

    return { ok: true, row };
  });
}

/** DELETE — remove a mistaken payment entry (admin only). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const rows = await query(`DELETE FROM payments WHERE id = $1 RETURNING id`, [Number(id)]);
    if (!rows.length) return notFound("Payment not found.");
    await logActivity(g.user.id, "Deleted payment record", "payment", { id });
    return { ok: true };
  });
}
