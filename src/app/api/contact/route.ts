import { NextRequest } from "next/server";
import { logActivity } from "@/lib/auth";
import { api, badRequest, guard, paging } from "@/lib/api";
import { one, query } from "@/lib/db";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const recent = new Map<string, number>();

/** POST — public enquiry form (contact page + membership join form). */
export async function POST(req: NextRequest) {
  return api(async () => {
    const b = await req.json().catch(() => null);
    const name = String(b?.name ?? "").trim();
    const email = String(b?.email ?? "").trim().toLowerCase();
    const phone = String(b?.phone ?? "").trim();
    const subject = String(b?.subject ?? "General enquiry").trim().slice(0, 160);
    const message = String(b?.message ?? "").trim();

    if (!name || !name.includes(" ")) return badRequest("Please enter your full name.");
    if (!EMAIL.test(email)) return badRequest("Please enter a valid email address.");
    if (message.length < 10) return badRequest("Tell us a little more (at least 10 characters).");

    const now = Date.now();
    const last = recent.get(email) ?? 0;
    if (now - last < 30_000) {
      return badRequest("You just sent a message — please give it a moment.");
    }
    recent.set(email, now);

    await query(
      `INSERT INTO contact_messages (name, email, phone, subject, message)
       VALUES ($1, $2, NULLIF($3, ''), $4, $5)`,
      [name, email, phone, subject, message.slice(0, 3000)]
    );
    await logActivity(null, "New enquiry received", "contact", { email, subject });

    return {
      ok: true,
      message: "Message received — our team replies within one business day.",
    };
  });
}

/** GET — staff inbox (admin / front desk). */
export async function GET(req: NextRequest) {
  const g = await guard("admin", "frontdesk");
  if (g.error) return g.error;

  return api(async () => {
    const url = new URL(req.url);
    const { limit, offset } = paging(url, 40);
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q")?.trim();

    const where: string[] = [];
    const params: unknown[] = [];
    if (status && status !== "all") {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR subject ILIKE $${params.length})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows, total] = await Promise.all([
      query(
        `SELECT id, name, email, phone, subject, message, status, created_at::text AS created_at
           FROM contact_messages ${whereSql}
          ORDER BY (status = 'new') DESC, created_at DESC
          LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
      one<{ n: number }>(`SELECT count(*)::int AS n FROM contact_messages ${whereSql}`, params),
    ]);

    return { rows, total: total?.n ?? 0, limit, offset };
  });
}
