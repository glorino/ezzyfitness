import { NextRequest, NextResponse } from "next/server";
import { hashPassword, logActivity } from "@/lib/auth";
import { api, badRequest, guard, notFound } from "@/lib/api";
import { one, query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const STAFF_ROLES = ["admin", "trainer", "frontdesk"];

/** PATCH — update a staff account (admin only). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const userId = Number(id);
    const b = await req.json().catch(() => null);

    const target = await one<{ id: number; role: string }>(
      `SELECT id, role FROM users WHERE id = $1 AND role <> 'member'`,
      [userId]
    );
    if (!target) return notFound("Staff account not found.");

    const sets: string[] = [];
    const values: unknown[] = [];
    const add = (col: string, val: unknown) => {
      values.push(val);
      sets.push(`${col} = $${values.length}`);
    };

    if (b?.fullName !== undefined) {
      const fullName = String(b.fullName).trim();
      if (fullName.split(" ").filter(Boolean).length < 2) {
        return badRequest("Enter the staff member's full name.");
      }
      add("full_name", fullName);
    }
    if (b?.email !== undefined) {
      const email = String(b.email).trim().toLowerCase();
      if (!EMAIL.test(email)) return badRequest("A valid email address is required.");
      const clash = await one(`SELECT id FROM users WHERE lower(email) = lower($1) AND id <> $2`, [
        email,
        userId,
      ]);
      if (clash) return badRequest("Another account already uses that email.");
      add("email", email);
    }
    if (b?.phone !== undefined) add("phone", String(b.phone).trim() || null);
    if (b?.role !== undefined) {
      if (!STAFF_ROLES.includes(String(b.role))) return badRequest("Invalid role.");
      add("role", b.role);
      if (b.role === "trainer") {
        await query(`INSERT INTO trainers (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [
          userId,
        ]);
      }
    }
    if (b?.status !== undefined) {
      if (!["active", "inactive", "suspended"].includes(String(b.status)))
        return badRequest("Invalid status.");
      add("status", b.status);
    }
    if (b?.avatarMediaId !== undefined) add("avatar_media_id", Number(b.avatarMediaId) || null);
    if (b?.newPassword) {
      const pw = String(b.newPassword);
      if (pw.length < 6) return badRequest("Password must be at least 6 characters.");
      add("password_hash", hashPassword(pw));
    }

    if (sets.length) {
      add("updated_at", new Date().toISOString());
      values.push(userId);
      await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${values.length}`, values);
    }

    await logActivity(g.user.id, "Updated staff account", "user", { userId });
    return { ok: true };
  });
}

/** DELETE — remove a staff account (admin only). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const userId = Number(id);
    if (userId === g.user.id) return badRequest("You can't delete your own account.");

    const rows = await query(
      `DELETE FROM users WHERE id = $1 AND role <> 'member' RETURNING id`,
      [userId]
    );
    if (!rows.length) return notFound("Staff account not found.");

    await logActivity(g.user.id, "Removed staff account", "user", { userId });
    return NextResponse.json({ ok: true });
  });
}
