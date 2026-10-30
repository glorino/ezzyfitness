import { cn } from "@/lib/format";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Section wrapper                                                     */
/* ------------------------------------------------------------------ */

export function Section({
  id,
  children,
  className,
  tone = "base",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "base" | "raised" | "deep";
}) {
  const bg =
    tone === "raised"
      ? "bg-ink-900/60"
      : tone === "deep"
        ? "bg-ink-950"
        : "";
  return (
    <section id={id} className={cn("relative scroll-mt-24", bg, className)}>
      {children}
    </section>
  );
}

export function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow";
}) {
  const widths = {
    wide: "max-w-[1400px]",
    default: "max-w-7xl",
    narrow: "max-w-3xl",
  };
  return (
    <div className={cn("mx-auto w-full px-5 sm:px-8", widths[size], className)}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Headings                                                            */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-12 max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <span className="eyebrow mb-4">
          <span className="h-px w-8 bg-volt-300/70" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-[clamp(2.2rem,5.4vw,4rem)] leading-[0.94] text-smoke-100">
        {title}{" "}
        {accent && <span className="text-volt-gradient">{accent}</span>}
      </h2>
      {description && (
        <p className="mt-5 text-base leading-relaxed text-smoke-400 sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "volt" | "ember" | "cyan" | "amber";
  className?: string;
}) {
  const tones = {
    neutral: "border-white/12 bg-white/8 text-smoke-300",
    volt: "border-volt-300/30 bg-volt-300/12 text-volt-300",
    ember: "border-ember/30 bg-ember/12 text-ember",
    cyan: "border-cyanx/30 bg-cyanx/12 text-cyanx",
    amber: "border-amber-300/30 bg-amber-300/12 text-amber-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-white/8", className)} />;
}
