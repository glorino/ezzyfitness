import { NextRequest } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, badRequest, guard, notFound } from "@/lib/api";
import { one, query, withTransaction } from "@/lib/db";

const METHODS = ["cash", "transfer", "pos", "card", "other"];

/**
 * POST — record a payment (front desk / admin) and optionally renew the
 * membership by extending expiry from the later of today or current expiry.
 */
export async function POST(req: NextRequest) {
  const g = await guard("admin", "frontdesk");
  if (g.error) return g.error;

  return api(async () => {
    const b = await req.json().catch(() => null);
    const memberId = Number(b?.memberId);
    const planId = Number(b?.planId) || null;
    const amount = Math.round(Number(b?.amount ?? 0));
    const method = METHODS.includes(b?.method) ? b.method : "cash";
    const reference = String(b?.reference ?? "").trim().slice(0, 60);
    const notes = String(b?.notes ?? "").trim().slice(0, 500);
    const extend = b?.extend !== false;

    if (!memberId) return badRequest("Select the member paying.");
    if (!Number.isFinite(amount) || amount <= 0) return badRequest("Enter a valid amount.");

    const member = await one<{ id: number; expires_at: string | null; status: string }>(
      `SELECT u.id, m.expires_at::text AS expires_at, m.status
         FROM users u JOIN members m ON m.user_id = u.id
        WHERE u.id = $1`,
      [memberId]
    );
    if (!member) return notFound("Member not found.");

    let duration = 0;
    if (planId) {
      const plan = await one<{ duration_days: number; price_ngn: number }>(
        `SELECT duration_days, price_ngn FROM plans WHERE id = $1`,
        [planId]
      );
      if (!plan) return notFound("Membership plan not found.");
      duration = plan.duration_days;
    }

    const payment = await withTransaction(async (tx) => {
      const res = await tx.query(
        `INSERT INTO payments (member_id, plan_id, amount_ngn, method, status, reference,
                               period_from, period_to, notes, recorded_by)
         VALUES ($1, $2, $3, $4, 'paid', $5, CURRENT_DATE,
                 CASE WHEN $6::int IS NULL THEN NULL ELSE CURRENT_DATE + $6::int END, $7, $8)
         RETURNING id, paid_at::text AS paid_at`,
        [memberId, planId, amount, method, reference || null, duration || null, notes || null, g.user.id]
      );

      let expiresAt = member.expires_at;
      if (extend && duration) {
        const ext = await tx.query(
          `UPDATE members
              SET expires_at = GREATEST(COALESCE(expires_at, CURRENT_DATE), CURRENT_DATE) + $1::int,
                  status = CASE WHEN status = 'frozen' THEN status ELSE 'active' END,
                  plan_id = COALESCE($2, plan_id),
                  updated_at = now()
            WHERE user_id = $3
            RETURNING expires_at::text AS expires_at`,
          [duration, planId, memberId]
        );
        expiresAt = ext.rows[0]?.expires_at ?? expiresAt;
      }

      return { id: Number(res.rows[0].id), expiresAt };
    });

    await logActivity(g.user.id, "Recorded payment", "payment", {
      memberId,
      amount,
      method,
      reference,
    });

    return { ok: true, paymentId: payment.id, expiresAt: payment.expiresAt };
  });
}
