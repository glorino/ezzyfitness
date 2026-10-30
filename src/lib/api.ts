import { NextResponse } from "next/server";
import { getCurrentUser, type Role, type SessionUser } from "./auth";

/** Wrap a route handler with consistent error handling. */
export async function api<T>(
  fn: () => Promise<T>,
  init?: { status?: number }
): Promise<NextResponse> {
  try {
    const data = await fn();
    if (data instanceof NextResponse) return data;
    return NextResponse.json(data as Record<string, unknown>, { status: init?.status ?? 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    // Never leak SQL detail to the browser in production.
    const safe =
      process.env.NODE_ENV === "production" && /duplicate key|violates/i.test(message)
        ? "That record already exists or conflicts with existing data."
        : message;
    console.error("[api]", message);
    return NextResponse.json({ error: safe }, { status: 500 });
  }
}

export const badRequest = (error: string) =>
  NextResponse.json({ error }, { status: 400 });

export const unauthorized = (error = "Please sign in to continue.") =>
  NextResponse.json({ error }, { status: 401 });

export const forbidden = (error = "You don't have permission for that.") =>
  NextResponse.json({ error }, { status: 403 });

export const notFound = (error = "Record not found.") =>
  NextResponse.json({ error }, { status: 404 });

/**
 * Resolve the signed session and assert the role server-side.
 * Returns either the user or a ready-to-send error response.
 */
export async function guard(
  ...roles: Role[]
): Promise<{ user: SessionUser; error?: undefined } | { user?: undefined; error: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) return { error: unauthorized() };
  if (roles.length && !roles.includes(user.role)) {
    return { error: forbidden(`This area is for ${roles.join(" / ")} accounts.`) };
  }
  return { user };
}

/** Coerce the `?page=&limit=` query into safe integers. */
export function paging(url: URL, defaultLimit = 50, maxLimit = 200) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number(url.searchParams.get("limit") ?? defaultLimit) || defaultLimit)
  );
  return { page, limit, offset: (page - 1) * limit };
}

/** Coerce a query flag: `?active=1` → true, `?active=0` → false, missing → undefined. */
export function flag(url: URL, key: string): boolean | undefined {
  const raw = url.searchParams.get(key);
  if (raw === null || raw === "") return undefined;
  return raw === "1" || raw === "true" || raw === "yes";
}
