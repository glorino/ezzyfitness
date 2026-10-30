import { NextRequest, NextResponse } from "next/server";
import { logActivity, startSession, verifyPassword } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { api, badRequest, unauthorized } from "@/lib/api";

/* Minimal in-memory throttle: 8 attempts per email per 10 minutes. */
const attempts = new Map<string, { n: number; reset: number }>();
function throttle(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || rec.reset < now) {
    attempts.set(key, { n: 1, reset: now + 600_000 });
    return true;
  }
  rec.n += 1;
  return rec.n <= 8;
}

const HOME: Record<string, string> = {
  admin: "/dashboard/admin",
  trainer: "/dashboard/trainer",
  frontdesk: "/dashboard/frontdesk",
  member: "/dashboard/member",
};

export async function POST(req: NextRequest) {
  return api(async () => {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) return badRequest("Enter your email and password.");
    if (!throttle(email)) {
      return NextResponse.json(
        { error: "Too many attempts. Wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const user = await one<{
      id: number;
      full_name: string;
      email: string;
      role: string;
      status: string;
      password_hash: string;
    }>(
      `SELECT id, full_name, email, role, status, password_hash
         FROM users WHERE lower(email) = lower($1)`,
      [email]
    );

    if (!user || !verifyPassword(password, user.password_hash)) {
      return unauthorized("That email and password don't match our records.");
    }
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "This account is inactive. Please contact the front desk." },
        { status: 403 }
      );
    }

    await startSession({ id: user.id, role: user.role as never });
    await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);
    await logActivity(user.id, "Signed in", "auth", { email: user.email });

    return {
      ok: true,
      redirectTo: HOME[user.role] ?? "/dashboard",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    };
  });
}
