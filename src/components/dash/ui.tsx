import type { ComponentType, ReactNode } from "react";
import { cn, naira, statusTone } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  subtitle,
  action,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumb?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider2 text-volt-300">
            {breadcrumb}
          </p>
        )}
        <h1 className="text-[clamp(1.6rem,3vw,2.3rem)] leading-tight text-smoke-100">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-smoke-400">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2.5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panels                                                              */
/* ------------------------------------------------------------------ */

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  pad = true,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  pad?: boolean;
}) {
  return (
    <section className={cn("surface-raised overflow-hidden", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold uppercase tracking-wider text-smoke-200">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-smoke-500">{subtitle}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn(pad && "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stat cards                                                          */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "volt",
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "volt" | "cyan" | "ember" | "neutral";
  trend?: { label: string; up: boolean };
}) {
  const tones = {
    volt: "border-volt-300/25 bg-volt-300/10 text-volt-300",
    cyan: "border-cyanx/25 bg-cyanx/10 text-cyanx",
    ember: "border-ember/25 bg-ember/10 text-ember",
    neutral: "border-white/12 bg-white/5 text-smoke-300",
  };
  return (
    <div className="group surface-raised relative overflow-hidden p-5 transition-colors duration-300 hover:border-white/20">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-volt-300/0 blur-2xl transition-all duration-500 group-hover:bg-volt-300/15" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-smoke-500">
            {label}
          </p>
          <p className="mt-2 font-display text-[clamp(1.8rem,3vw,2.5rem)] leading-none text-smoke-100">
            {value}
          </p>
          {hint && <p className="mt-2 text-xs text-smoke-500">{hint}</p>}
          {trend && (
            <p
              className={cn(
                "mt-1.5 text-[11px] font-semibold",
                trend.up ? "text-volt-300" : "text-ember"
              )}
            >
              {trend.up ? "▲" : "▼"} {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <span
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition group-hover:scale-105",
              tones[tone]
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
  );
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

export function Table({
  head,
  children,
  className,
}: {
  head: ReactNode[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            {head.map((h, i) => (
              <th
                key={i}
                className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-smoke-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={cn("px-5 py-3.5 align-middle text-smoke-300", className)} colSpan={colSpan}>
      {children}
    </td>
  );
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={cn(
        "transition-colors duration-200 hover:bg-white/[0.035]",
        className
      )}
    >
      {children}
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Badges / bits                                                       */
/* ------------------------------------------------------------------ */

export function StatusPill({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        statusTone(value)
      )}
    >
      {value}
    </span>
  );
}

export function Money({ value, className }: { value: number; className?: string }) {
  return <span className={cn("font-semibold text-smoke-100", className)}>{naira(value)}</span>;
}

export function ProgressBar({
  value,
  max = 100,
  tone = "volt",
  className,
}: {
  value: number;
  max?: number;
  tone?: "volt" | "cyan" | "ember";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(max, 1)) * 100)));
  const bar = { volt: "bg-volt-300", cyan: "bg-cyanx", ember: "bg-ember" }[tone];
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-700", bar)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function MetaRow({
  items,
}: {
  items: { icon?: ReactNode; label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-3"
        >
          {it.icon && <span className="mt-0.5 text-volt-300">{it.icon}</span>}
          <div className="min-w-0">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-smoke-500">
              {it.label}
            </dt>
            <dd className="mt-0.5 truncate text-sm text-smoke-200">{it.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

export function EmptyRow({
  title,
  hint,
  icon: Icon,
  colSpan = 5,
}: {
  title: string;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center">
        {Icon && (
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-smoke-500">
            <Icon className="h-5 w-5" />
          </span>
        )}
        <p className="text-sm font-semibold text-smoke-300">{title}</p>
        {hint && <p className="mt-1 text-xs text-smoke-500">{hint}</p>}
      </td>
    </tr>
  );
}
