import { DAY_SHORT, DAYS } from "./site";

/** ₦ currency, e.g. ₦20,000 */
export function naira(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function formatDate(value: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-NG", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h)) return value;
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, "0")}${suffix}`;
}

export function dayName(index: number): string {
  return DAYS[index] ?? "Monday";
}
export function dayShort(index: number): string {
  return DAY_SHORT[index] ?? "Mon";
}

export function relativeTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function membershipStatus(expiresAt: string | null, fallback = "inactive"): "active" | "expired" | "frozen" {
  if (!expiresAt) return fallback === "active" ? "active" : "expired";
  const exp = new Date(expiresAt).getTime();
  return exp >= Date.now() ? "active" : "expired";
}

export function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt).getTime();
  if (Number.isNaN(exp)) return null;
  return Math.ceil((exp - Date.now()) / 86_400_000);
}

/** Deterministic tailwind class for role badges. */
export function roleTone(role: string): string {
  switch (role) {
    case "admin":
      return "bg-volt-300/15 text-volt-300 border-volt-300/30";
    case "trainer":
      return "bg-cyanx/15 text-cyanx border-cyanx/30";
    case "frontdesk":
      return "bg-ember/15 text-ember border-ember/30";
    default:
      return "bg-white/10 text-smoke-200 border-white/15";
  }
}

export function statusTone(status: string): string {
  switch (status) {
    case "active":
    case "paid":
    case "present":
    case "replied":
      return "bg-volt-300/12 text-volt-300 border-volt-300/30";
    case "pending":
    case "new":
    case "late":
    case "frozen":
      return "bg-amber-400/12 text-amber-300 border-amber-300/30";
    case "expired":
    case "failed":
    case "absent":
    case "suspended":
      return "bg-ember/12 text-ember border-ember/30";
    default:
      return "bg-white/8 text-smoke-300 border-white/12";
  }
}

export const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

/**
 * Editorial imagery. Served `unoptimized` so the browser fetches directly and
 * a dead URL degrades to the designed gradient behind it (see <MediaImage />).
 */
export const img = (id: string, w = 1200, q = 72) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;
