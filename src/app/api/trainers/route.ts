import { NextRequest } from "next/server";
import { hashPassword, logActivity } from "@/lib/auth";
import { api, badRequest, guard } from "@/lib/api";
import { one, withTransaction } from "@/lib/db";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/** POST — create a trainer (account + profile) — admin only. */
export async function POST(req: NextRequest) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const b = (await req.json().catch(() => null)) ?? {};
    const fullName = String(b.fullName ?? "").trim();
    const email = String(b.email ?? "").trim().toLowerCase();
    const phone = String(b.phone ?? "").trim();
    const bio = String(b.bio ?? "").trim().slice(0, 900);
    const specialties = Array.isArray(b.specialties)
      ? b.specialties.map(String).map((s: string) => s.trim()).filter(Boolean).slice(0, 8)
      : [];
    const certifications = Array.isArray(b.certifications)
      ? b.certifications.map(String).map((s: string) => s.trim()).filter(Boolean).slice(0, 8)
      : [];
    const years = Math.max(0, Math.min(60, Number(b.experienceYears) || 0));
    const instagram = String(b.instagram ?? "").trim().slice(0, 60);
    const password = String(b.password ?? "").trim();

    if (fullName.split(" ").filter(Boolean).length < 2) return badRequest("Enter the trainer's full name.");
    if (!EMAIL.test(email)) return badRequest("A valid email address is required.");
    if (password && password.length < 6) return badRequest("Password must be at least 6 characters.");

    const exists = await one(`SELECT id FROM users WHERE lower(email) = lower($1)`, [email]);
    if (exists) return badRequest("That email already has an account.");

    const pw = password || `Trainer${Math.random().toString(36).slice(2, 8)}!`;

    const row = await withTransaction(async (tx) => {
      const u = await tx.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role, status)
         VALUES ($1, $2, $3, $4, 'trainer', 'active') RETURNING id`,
        [fullName, email, phone, hashPassword(pw)]
      );
      const userId = Number(u.rows[0].id);
      await tx.query(
        `INSERT INTO trainers (user_id, bio, specialties, certifications, experience_years, instagram, sort_order)
         VALUES ($1, $2, $3::text[], $4::text[], $5, $6,
                 COALESCE((SELECT max(sort_order) + 1 FROM trainers), 1))`,
        [userId, bio || null, specialties, certifications, years, instagram || null]
      );
      return { id: userId, temporaryPassword: password ? null : pw };
    });

    await logActivity(g.user.id, "Added trainer", "trainer", { email, name: fullName });
    return { ok: true, ...row };
  });
}
