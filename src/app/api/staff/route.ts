import { NextRequest } from "next/server";
import { hashPassword, logActivity } from "@/lib/auth";
import { api, badRequest, guard, paging } from "@/lib/api";
import { one, query } from "@/lib/db";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const STAFF_ROLES = ["admin", "trainer", "frontdesk"];

/** POST — create a staff account (admin only): front desk officers,
 * secretaries, trainers and other admins.
 */
export async function POST(req: NextRequest) {
  const g = await guard("admin");
  if (g.error) return g.error;

  return api(async () => {
    const b = await req.json().catch(() => null);
    const fullName = String(b?.fullName ?? "").trim();
    const email = String(b?.email ?? "").trim().toLowerCase();
    const phone = String(b?.phone ?? "").trim();
    const role = STAFF_ROLES.includes(b?.role) ? b.role : "frontdesk";
    const password = String(b?.password ?? "").trim();

    if (fullName.split(" ").filter(Boolean).length < 2) {
      return badRequest("Enter the staff member's full name.");
    }
    if (!EMAIL.test(email)) return badRequest("A valid email address is required.");
    if (password && password.length < 6) {
      return badRequest("Password must be at least 6 characters.");
    }

    const exists = await one(`SELECT id FROM users WHERE lower(email) = lower($1)`, [email]);
    if (exists) return badRequest("An account with that email already exists.");

    const pw =
      password ||
      `Ezzy${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 90 + 10)}`;

    const rows = await query<{ id: number }>(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id`,
      [fullName, email, phone || null, hashPassword(pw), role]
    );
    const userId = Number(rows[0].id);

    // Trainers get a public profile row straight away.
    if (role === "trainer") {
      await query(`INSERT INTO trainers (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [
        userId,
      ]);
    }

    await logActivity(g.user.id, "Created staff account", "user", { email, role });
    return { ok: true, id: userId, temporaryPassword: password ? null : pw };
  });
}

/** GET — staff-facing member list with pagination and role filtering. */
export async function GET(req: NextRequest) {
  const g = await guard("admin", "frontdesk", "trainer");
  if (g.error) return g.error;

  return api(async () => {
    const url = new URL(req.url);
    const { limit, offset } = paging(url, 10, 100);
    const q = url.searchParams.get("q")?.trim();
    const role = url.searchParams.get("role");

    const where: string[] = [];
    const params: unknown[] = [];
    if (q) {
      params.push(`%${q}%`);
      where.push(`(full_name ILIKE $${params.length} OR membership_no ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    if (role && role !== "all") {
      params.push(role);
      where.push(`role = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows, total] = await Promise.all([
      query(
        `SELECT id, full_name, email, phone, role, membership_no, status, avatar_media_id, created_at::text AS created_at
           FROM users ${whereSql}
         ORDER BY role != 'admin', full_name
         LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
      one<{ n: number }>(`SELECT count(*)::int AS n FROM users ${whereSql}`, params),
    ]);

    return { rows, total: total?.n ?? 0, limit, offset };
  });
}
