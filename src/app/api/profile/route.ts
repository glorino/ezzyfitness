import { NextRequest } from "next/server";
import { hashPassword, logActivity, verifyPassword } from "@/lib/auth";
import { api, badRequest, guard } from "@/lib/api";
import { one, query } from "@/lib/db";

/**
 * PATCH — the signed-in user updates their own account:
 * full name, phone, password (requires current) and avatar photo.
 */
export async function PATCH(req: NextRequest) {
  const g = await guard();
  if (g.error) return g.error;

  return api(async () => {
    const b = await req.json().catch(() => null);
    const userId = g.user.id;

    const sets: string[] = [];
    const values: unknown[] = [];
    const add = (col: string, val: unknown) => {
      values.push(val);
      sets.push(`${col} = $${values.length}`);
    };

    if (b?.fullName !== undefined) {
      const fullName = String(b.fullName).trim();
      if (fullName.split(" ").filter(Boolean).length < 2) {
        return badRequest("Enter your first and last name.");
      }
      add("full_name", fullName);
    }
    if (b?.phone !== undefined) add("phone", String(b.phone).trim() || null);
    if (b?.avatarMediaId !== undefined) add("avatar_media_id", Number(b.avatarMediaId) || null);

    if (b?.newPassword) {
      const current = String(b.currentPassword ?? "");
      const next = String(b.newPassword);
      if (next.length < 6) return badRequest("New password must be at least 6 characters.");
      const row = await one<{ password_hash: string }>(
        `SELECT password_hash FROM users WHERE id = $1`,
        [userId]
      );
      if (!row || !verifyPassword(current, row.password_hash)) {
        return badRequest("Your current password is incorrect.");
      }
      add("password_hash", hashPassword(next));
    }

    if (!sets.length) return badRequest("Nothing to update.");

    add("updated_at", new Date().toISOString());
    values.push(userId);
    await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${values.length}`, values);

    await logActivity(userId, "Updated own profile", "user", {
      fields: Object.keys(b ?? {}),
    });
    return { ok: true };
  });
}
