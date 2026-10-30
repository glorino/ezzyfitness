import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { one, query } from "./db";

export type Role = "admin" | "trainer" | "frontdesk" | "member";

export const SESSION_COOKIE = "ezzy_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: string;
  avatar_media_id: number | null;
  last_login_at: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Password hashing (scrypt — built into Node, no native dependencies) */
/* ------------------------------------------------------------------ */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return expected.length === derived.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/* ---------------------------- Sessions ---------------------------- */

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  // Deterministic dev-only fallback so the app still boots without .env.local.
  return "ezzy-fitness-insecure-dev-secret-please-set-AUTH_SECRET";
}

const b64url = (buf: Buffer) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function sign(payload: string): string {
  return b64url(createHmac("sha256", secret()).update(payload).digest());
}

/** Create a signed, tamper-proof session token. */
export function createToken(userId: number, role: Role): string {
  const body = b64url(
    Buffer.from(
      JSON.stringify({ uid: userId, role, iat: Date.now(), exp: Date.now() + SESSION_TTL_SECONDS * 1000 })
    )
  );
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string | undefined | null): { uid: number; role: Role } | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.uid !== "number") return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return { uid: payload.uid, role: payload.role as Role };
  } catch {
    return null;
  }
}

export async function startSession(user: Pick<SessionUser, "id" | "role">) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createToken(user.id, user.role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Resolve the signed cookie to a full user row (or null). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const payload = verifyToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const user = await one<SessionUser>(
    `SELECT id, full_name, email, phone, role, status, avatar_media_id, last_login_at::text AS last_login_at,
            created_at::text AS created_at
       FROM users WHERE id = $1`,
    [payload.uid]
  );
  if (!user || user.status !== "active") return null;
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return roles.includes(user.role) ? user : null;
}

/* ------------------------- Audit helper --------------------------- */

export async function logActivity(
  userId: number | null,
  action: string,
  entity?: string,
  detail: Record<string, unknown> = {}
) {
  try {
    await query(
      `INSERT INTO activity_log (user_id, action, entity, detail) VALUES ($1, $2, $3, $4)`,
      [userId, action, entity ?? null, JSON.stringify(detail)]
    );
  } catch {
    /* auditing must never break the main flow */
  }
}

export const ROLES: Role[] = ["admin", "trainer", "frontdesk", "member"];
