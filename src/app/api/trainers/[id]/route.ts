import { NextRequest, NextResponse } from "next/server";
import { hashPassword, logActivity } from "@/lib/auth";
import { api, badRequest, forbidden, guard, notFound } from "@/lib/api";
import { one, query } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH — update a trainer profile.
 * Admins may edit anyone (and contact details); a trainer may edit their own
 * profile (bio, specialties, certifications, experience, socials, avatar).
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard("admin", "trainer");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const userId = Number(id);
    const isAdmin = g.user.role === "admin";
    if (!isAdmin && g.user.id !== userId) {
      return forbidden("You can only edit your own profile.");
    }

    const exists = await one(`SELECT user_id FROM trainers WHERE user_id = $1`, [userId]);
    const isSelf = g.user.id === userId;
    if (!exists && !(isAdmin && isSelf === false)) {
      // admin may attach a profile to a trainer-role user without one yet
    }
    if (!exists && !isAdmin) return notFound("Trainer profile not found.");

    const b = (await req.json().catch(() => null)) ?? {};

    // ---- profile fields
    const sets: string[] = [];
    const values: unknown[] = [];
    const add = (col: string, val: unknown) => {
      values.push(val);
      sets.push(`${col} = $${values.length}`);
    };

    if (b.bio !== undefined) add("bio", String(b.bio).trim().slice(0, 900) || null);
    if (b.specialties !== undefined)
      add(
        "specialties",
        (Array.isArray(b.specialties) ? b.specialties : String(b.specialties).split(","))
          .map((s: unknown) => String(s).trim())
          .filter(Boolean)
          .slice(0, 8)
      );
    if (b.certifications !== undefined)
      add(
        "certifications",
        (Array.isArray(b.certifications) ? b.certifications : String(b.certifications).split(","))
          .map((s: unknown) => String(s).trim())
          .filter(Boolean)
          .slice(0, 8)
      );
    if (b.experienceYears !== undefined)
      add("experience_years", Math.max(0, Math.min(60, Number(b.experienceYears) || 0)));
    if (b.instagram !== undefined) add("instagram", String(b.instagram).trim().slice(0, 60) || null);
    if (b.isVisible !== undefined && isAdmin) add("is_visible", Boolean(b.isVisible));
    if (b.sortOrder !== undefined && isAdmin) add("sort_order", Number(b.sortOrder) || 1);

    if (sets.length) {
      add("updated_at", new Date().toISOString());
      values.push(userId);
      const res = await query(
        `UPDATE trainers SET ${sets.join(", ")} WHERE user_id = $${values.length}`,
        values
      );
      if (!res.length && !exists) {
        // create the profile row if an admin is promoting someone
        await query(
          `INSERT INTO trainers (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
          [userId]
        );
      }
    } else if (!exists) {
      await query(`INSERT INTO trainers (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [
        userId,
      ]);
    }

    // ---- contact fields (admin only)
    if (isAdmin) {
      const userSets: string[] = [];
      const userVals: unknown[] = [];
      const addU = (col: string, val: unknown) => {
        userVals.push(val);
        userSets.push(`${col} = $${userVals.length}`);
      };
      if (b.fullName !== undefined) addU("full_name", String(b.fullName).trim());
      if (b.email !== undefined) {
        const email = String(b.email).trim().toLowerCase();
        const clash = await one(`SELECT id FROM users WHERE lower(email) = lower($1) AND id <> $2`, [
          email,
          userId,
        ]);
        if (clash) return badRequest("Another account already uses that email.");
        addU("email", email);
      }
      if (b.phone !== undefined) addU("phone", String(b.phone).trim() || null);
      if (b.status !== undefined) {
        if (!["active", "inactive", "suspended"].includes(String(b.status)))
          return badRequest("Invalid status.");
        addU("status", b.status);
      }
      if (b.avatarMediaId !== undefined) addU("avatar_media_id", Number(b.avatarMediaId) || null);
      if (b.newPassword) {
        const pw = String(b.newPassword);
        if (pw.length < 6) return badRequest("Password must be at least 6 characters.");
        addU("password_hash", hashPassword(pw));
      }
      if (userSets.length) {
        addU("updated_at", new Date().toISOString());
        userVals.push(userId);
        await query(
          `UPDATE users SET ${userSets.join(", ")} WHERE id = $${userVals.length}`,
          userVals
        );
      }
    } else if (b.avatarMediaId !== undefined) {
      await query(`UPDATE users SET avatar_media_id = $1 WHERE id = $2`, [
        Number(b.avatarMediaId) || null,
        userId,
      ]);
    }

    await logActivity(g.user.id, "Updated trainer profile", "trainer", { userId });
    return { ok: true };
  });
}

/** DELETE — remove a trainer account (admin only). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const { id } = await params;
    const userId = Number(id);
    if (userId === g.user.id) return badRequest("You can't delete your own account.");

    const rows = await query(`DELETE FROM users WHERE id = $1 AND role = 'trainer' RETURNING id`, [
      userId,
    ]);
    if (!rows.length) return notFound("Trainer not found.");

    await logActivity(g.user.id, "Removed trainer", "trainer", { userId });
    return NextResponse.json({ ok: true });
  });
}
