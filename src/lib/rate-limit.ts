import { NextRequest } from "next/server";

// Simple in-memory rate limiter (use Redis in production)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyGenerator?: (req: NextRequest) => string;
}

export function rateLimitMiddleware(
  options: RateLimitOptions = {}
): (req: NextRequest) => Promise<Response | null> {
  const { windowMs = 60 * 1000, max = 100, keyGenerator } = options;

  return async (req: NextRequest) => {
    const key = keyGenerator ? keyGenerator(req) : getClientIp(req);
    const now = Date.now();
    const limit = rateLimit.get(key);

    if (limit && limit.resetTime > now) {
      if (limit.count >= max) {
        return new Response(
          JSON.stringify({ error: "Too many requests, please try again later." }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      limit.count++;
    } else {
      rateLimit.set(key, { count: 1, resetTime: now + windowMs });
    }

    // Cleanup old entries
    if (rateLimit.size > 10000) {
      for (const [k, v] of rateLimit.entries()) {
        if (v.resetTime <= now) rateLimit.delete(k);
      }
    }

    return null;
  };
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown";
  return ip;
}

// Pre-configured limiters
export const apiLimiter = rateLimitMiddleware({ windowMs: 60 * 1000, max: 100 });
export const authLimiter = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const body = req.headers.get("x-forwarded-for") || "unknown";
    return `auth:${body}`;
  },
});
export const paymentLimiter = rateLimitMiddleware({ windowMs: 60 * 1000, max: 5 });
