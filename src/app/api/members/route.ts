import { NextRequest } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, badRequest, guard } from "@/lib/api";
import { one, query, withTransaction } from "@/lib/db";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/**
 * GET — lightweight member lookup for pickers (check-in desk, payment form,
 * attendance sheets) and list pages: `?q=name&status=active&limit=20`.
 */
export async function GET(req: NextRequest) {
  const g = await guard("admin", "frontdesk", "trainer");
  if (g.error) return g.error;

  return api(async () => {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const status = url.searchParams.get("status") ?? null;
    const limit = Math.min(200, Number(url.searchParams.get("limit") ?? 25) || 25);

    const rows = await query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_media_id,
              m.membership_no, m.status, m.expires_at::text AS expires_at, m.plan_id,
              p.name AS plan_name,
              EXISTS (SELECT 1 FROM check_ins c
                       WHERE c.member_id = u.id AND c.created_at::date = CURRENT_DATE) AS checked_in_today
         FROM users u
         JOIN members m ON m.user_id = u.id
         LEFT JOIN plans p ON p.id = m.plan_id
        WHERE u.role = 'member'
          AND ($1 = '' OR u.full_name ILIKE '%' || $1 || '%'
                       OR u.email ILIKE '%' || $1 || '%'
                       OR u.phone ILIKE '%' || $1 || '%'
                       OR m.membership_no ILIKE '%' || $1 || '%')
          AND ($2::text IS NULL OR m.status = $2)
        ORDER BY u.full_name
        LIMIT ${limit}`,
      [q, status]
    );
    return { rows };
  });
}

/**
 * POST — register a new member (front desk / admin).
 * Creates the login account and the membership record in one transaction,
 * including plan expiry derived from the chosen plan.
 */
export async function POST(req: NextRequest) {
  const g = await guard("admin", "frontdesk");
  if (g.error) return g.error;

  return api(async () => {
    const b = await req.json().catch(() => null);
    const fullName = String(b?.fullName ?? "").trim();
    const email = String(b?.email ?? "").trim().toLowerCase();
    const phone = String(b?.phone ?? "").trim();
    const planId = Number(b?.planId) || null;
    const gender = ["male", "female", "other"].includes(b?.gender) ? b.gender : null;
    const dob = b?.dateOfBirth || null;
    const goals = String(b?.goals ?? "").trim().slice(0, 500);
    const emergencyName = String(b?.emergencyName ?? "").trim();
    const emergencyPhone = String(b?.emergencyPhone ?? "").trim();
    const notes = String(b?.notes ?? "").trim().slice(0, 1000);
    const password = String(b?.password ?? "").trim();

    if (fullName.split(" ").filter(Boolean).length < 2) {
      return badRequest("Enter the member's full name (first and last).");
    }
    if (!EMAIL.test(email)) return badRequest("A valid email address is required.");
    if (phone.replace(/\D/g, "").length < 10) return badRequest("Enter a valid phone number.");

    const exists = await one(`SELECT id FROM users WHERE lower(email) = lower($1)`, [email]);
    if (exists) {
      return badRequest("An account with that email already exists — try signing them in.");
    }

    const pw =
      password ||
      `Ezzy${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 90 + 10)}`;

    const { hashPassword } = await import("@/lib/auth");

    const result = await withTransaction(async (tx) => {
      const userRes = await tx.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role, status)
         VALUES ($1, $2, $3, $4, 'member', 'active')
         RETURNING id`,
        [fullName, email, phone, hashPassword(pw)]
      );
      const userId = Number(userRes.rows[0].id);

      const plan = planId
        ? await tx.query(`SELECT duration_days FROM plans WHERE id = $1 AND is_active`, [planId])
        : null;
      const days = plan?.rows[0]?.duration_days ?? null;

      const memberRes = await tx.query(
        `INSERT INTO members (user_id, membership_no, plan_id, gender, date_of_birth, goals,
                              emergency_name, emergency_phone, notes, status, expires_at)
         VALUES ($1, $2, $3, $4, NULLIF($5, '')::date, $6, $7, $8, $9, 'active',
                 CASE WHEN $10::int IS NULL THEN NULL ELSE CURRENT_DATE + $10::int END)
         RETURNING membership_no, expires_at::text AS expires_at`,
        [
          userId,
          `EZ${userId}`,
          planId,
          gender,
          dob ?? "",
          goals || null,
          emergencyName || null,
          emergencyPhone || null,
          notes || null,
          days,
        ]
      );

      return {
        id: userId,
        membershipNo: memberRes.rows[0].membership_no,
        expiresAt: memberRes.rows[0].expires_at,
        temporaryPassword: password ? null : pw,
      };
    });

    await logActivity(g.user.id, "Registered new member", "member", {
      email,
      membershipNo: result.membershipNo,
    });

    return { ok: true, ...result };
  });
}
