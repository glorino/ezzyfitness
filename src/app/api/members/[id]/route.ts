import { NextRequest, NextResponse } from "next/server";
import { hashPassword, logActivity } from "@/lib/auth";
import { api, badRequest, guard, notFound } from "@/lib/api";
import { one, query, withTransaction } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/** GET — single member with membership details (staff). */
export async function GET(_req: NextRequest, { params }: Params) {
  const g = await guard("admin", "frontdesk", "trainer");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const row = await one(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.avatar_media_id,
              u.created_at::text AS created_at, u.last_login_at::text AS last_login_at,
              m.membership_no, m.plan_id, m.gender, m.date_of_birth::text AS date_of_birth,
              m.goals, m.emergency_name, m.emergency_phone, m.weight_kg, m.height_cm,
              m.status AS membership_status, m.joined_at::text AS joined_at,
              m.expires_at::text AS expires_at, m.notes, p.name AS plan_name, p.price_ngn,
              p.duration_days
         FROM users u
         LEFT JOIN members m ON m.user_id = u.id
         LEFT JOIN plans p ON p.id = m.plan_id
        WHERE u.id = $1`,
      [Number(id)]
    );
    if (!row) return notFound("Member not found.");
    return { row };
  });
}

/** PATCH — update member + login details (admin / front desk). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard("admin", "frontdesk");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const userId = Number(id);
    const b = await req.json().catch(() => null);

    const existing = await one(`SELECT id FROM users WHERE id = $1 AND role = 'member'`, [userId]);
    if (!existing) return notFound("Member not found.");

    // --- login fields
    if (b?.fullName !== undefined || b?.email !== undefined || b?.phone !== undefined) {
      const fullName = String(b.fullName ?? "").trim();
      const email = String(b.email ?? "").trim().toLowerCase();
      const phone = String(b.phone ?? "").trim();

      if (fullName && fullName.split(" ").filter(Boolean).length < 2) {
        return badRequest("Full name must include first and last name.");
      }
      if (email && !EMAIL.test(email)) return badRequest("Enter a valid email address.");
      if (email) {
        const clash = await one(
          `SELECT id FROM users WHERE lower(email) = lower($1) AND id <> $2`,
          [email, userId]
        );
        if (clash) return badRequest("Another account already uses that email.");
      }

      await query(
        `UPDATE users SET full_name = COALESCE(NULLIF($1, ''), full_name),
                          email = COALESCE(NULLIF($2, ''), email),
                          phone = COALESCE(NULLIF($3, ''), phone),
                          updated_at = now()
          WHERE id = $4`,
        [fullName, email, phone, userId]
      );
    }

    if (b?.status) {
      const allowed = ["active", "inactive", "suspended"];
      if (!allowed.includes(b.status)) return badRequest("Invalid account status.");
      await query(`UPDATE users SET status = $1, updated_at = now() WHERE id = $2`, [
        b.status,
        userId,
      ]);
    }

    // --- membership fields
    const memberPatch = await one(`SELECT user_id FROM members WHERE user_id = $1`, [userId]);
    if (memberPatch) {
      const planId = b?.planId !== undefined ? Number(b.planId) || null : undefined;
      let expires = undefined;
      if (b?.expiresAt !== undefined) {
        expires = b.expiresAt ? String(b.expiresAt).slice(0, 10) : null;
      }

      await query(
        `UPDATE members SET
            plan_id = COALESCE($1, plan_id),
            gender = COALESCE(NULLIF($2, ''), gender),
            date_of_birth = COALESCE(NULLIF($3, '')::date, date_of_birth),
            goals = COALESCE(NULLIF($4, ''), goals),
            emergency_name = COALESCE(NULLIF($5, ''), emergency_name),
            emergency_phone = COALESCE(NULLIF($6, ''), emergency_phone),
            weight_kg = COALESCE(NULLIF($7, '')::numeric, weight_kg),
            height_cm = COALESCE(NULLIF($8, '')::numeric, height_cm),
            status = COALESCE(NULLIF($9, ''), status),
            expires_at = COALESCE($10::date, expires_at),
            notes = COALESCE(NULLIF($11, ''), notes),
            updated_at = now()
          WHERE user_id = $12`,
        [
          planId ?? null,
          String(b?.gender ?? ""),
          String(b?.dateOfBirth ?? ""),
          String(b?.goals ?? ""),
          String(b?.emergencyName ?? ""),
          String(b?.emergencyPhone ?? ""),
          String(b?.weightKg ?? ""),
          String(b?.heightCm ?? ""),
          String(b?.membershipStatus ?? ""),
          expires,
          String(b?.notes ?? ""),
          userId,
        ]
      );

      if (planId && b?.resetExpiryWithPlan) {
        const plan = await one<{ duration_days: number }>(
          `SELECT duration_days FROM plans WHERE id = $1`,
          [planId]
        );
        if (plan) {
          await query(
            `UPDATE members SET expires_at = CURRENT_DATE + $1::int,
                                status = CASE WHEN status = 'frozen' THEN status ELSE 'active' END
              WHERE user_id = $2`,
            [plan.duration_days, userId]
          );
        }
      }
    }

    // --- optional password reset (admin only)
    if (b?.newPassword && g.user.role === "admin") {
      const pw = String(b.newPassword);
      if (pw.length < 6) return badRequest("Password must be at least 6 characters.");
      await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
        hashPassword(pw),
        userId,
      ]);
    }

    if (b?.avatarMediaId !== undefined) {
      await query(`UPDATE users SET avatar_media_id = $1 WHERE id = $2`, [
        Number(b.avatarMediaId) || null,
        userId,
      ]);
    }

    await logActivity(g.user.id, "Updated member profile", "member", { userId });
    return { ok: true };
  });
}

/** DELETE — remove a member account entirely (admin only). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const userId = Number(id);

    if (userId === g.user.id) return badRequest("You can't delete your own account.");

    const deleted = await withTransaction(async (tx) => {
      const member = await tx.query(`SELECT 1 FROM members WHERE user_id = $1`, [userId]);
      if (!member.rowCount) return false;
      await tx.query(`DELETE FROM users WHERE id = $1`, [userId]);
      return true;
    });

    if (!deleted) return notFound("Member not found.");

    await logActivity(g.user.id, "Deleted member account", "member", { userId });
    return NextResponse.json({ ok: true });
  });
}
