import { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { api, badRequest, guard } from "@/lib/api";
import { one, query } from "@/lib/db";
import { logActivity } from "@/lib/auth";

/**
 * Flutterwave Webhook Handler
 * Verifies payment status server-side and updates membership
 * CRITICAL: This prevents payment fraud
 */
export async function POST(req: NextRequest) {
  const secretHash = process.env.FLW_SECRET_HASH || process.env.FLW_WEBHOOK_SECRET_HASH;
  
  // Verify webhook signature
  const signature = req.headers.get("verif-hash");
  if (!signature) {
    return new Response("No signature", { status: 401 });
  }

  // Verify with Flutterwave secret hash
  if (secretHash && signature !== secretHash) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const payload = await req.json();
    
    // Only process successful payments
    if (payload.event !== "charge.completed" || payload.data.status !== "successful") {
      return new Response("Event ignored", { status: 200 });
    }

    const { tx_ref, flw_ref, amount, currency, customer } = payload.data;

    // Verify transaction with Flutterwave API
    const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${flw_ref}/verify`, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const verifyData = await verifyRes.json();

    if (verifyData.status !== "success" || verifyData.data.status !== "successful") {
      return new Response("Transaction verification failed", { status: 400 });
    }

    // Check if payment already recorded
    const existing = await one(
      `SELECT id FROM payments WHERE reference = $1`,
      [tx_ref]
    );

    if (existing) {
      return new Response("Payment already processed", { status: 200 });
    }

    // Extract member_id from notes or reference
    // Format: EZZY-{timestamp} or include member_id
    const notes = verifyData.data.meta?.note || "";
    const memberIdMatch = notes.match(/member_id:(\d+)/);
    const memberId = memberIdMatch ? parseInt(memberIdMatch[1]) : null;

    if (!memberId) {
      console.error("No member_id found in transaction:", tx_ref);
      return new Response("Member not found", { status: 400 });
    }

    // Get member and plan
    const member = await one(
      `SELECT u.id, m.expires_at::text AS expires_at, m.status
         FROM users u JOIN members m ON m.user_id = u.id
        WHERE u.id = $1`,
      [memberId]
    );

    if (!member) {
      return new Response("Member not found", { status: 404 });
    }

    // Get plan from notes
    const planIdMatch = notes.match(/plan_id:(\d+)/);
    const planId = planIdMatch ? parseInt(planIdMatch[1]) : null;

    let duration = 0;
    if (planId) {
      const plan = await one<{ duration_days: number }>(
        `SELECT duration_days FROM plans WHERE id = $1`,
        [planId]
      );
      duration = plan?.duration_days || 0;
    }

    // Record payment
    const payment = await query(
      `INSERT INTO payments (member_id, plan_id, amount_ngn, method, status, reference,
                             period_from, period_to, notes, recorded_by)
       VALUES ($1, $2, $3, 'card', 'paid', $4, CURRENT_DATE,
               CASE WHEN $5::int IS NULL THEN NULL ELSE CURRENT_DATE + $5::int END, $6, NULL)
       RETURNING id`,
      [memberId, planId, amount, tx_ref, duration || null, `Flutterwave: ${flw_ref}`]
    );

    // Extend membership if duration > 0
    if (duration > 0) {
      await query(
        `UPDATE members
            SET expires_at = GREATEST(COALESCE(expires_at, CURRENT_DATE), CURRENT_DATE) + $1::int,
                status = CASE WHEN status = 'frozen' THEN status ELSE 'active' END,
                plan_id = COALESCE($2, plan_id),
                updated_at = now()
          WHERE user_id = $3`,
        [duration, planId, memberId]
      );
    }

    await logActivity(memberId, "Flutterwave payment received", "payment", {
      amount,
      reference: tx_ref,
      flutterwave_ref: flw_ref,
    });

    return new Response("Payment processed", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
