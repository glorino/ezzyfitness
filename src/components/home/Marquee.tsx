import { Container } from "@/components/ui/Section";
import { CountUp, Reveal } from "@/components/ui/Reveal";

const WORDS = [
  "STRENGTH",
  "HIIT",
  "BOXING",
  "YOGA",
  "PILATES",
  "ZUMBA",
  "CARDIO",
  "MOBILITY",
  "PERSONAL TRAINING",
];

/** Infinite scrolling word band — the pulse between sections. */
export function Marquee() {
  const group = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {WORDS.map((w, i) => (
        <span key={`${w}-${i}`} className="flex items-center gap-8">
          <span
            className={`whitespace-nowrap font-display text-[clamp(1.5rem,3vw,2.4rem)] leading-none tracking-tight ${
              i % 2 === 0
                ? "text-smoke-100"
                : "text-transparent [-webkit-text-stroke:1px_rgba(214,255,63,0.55)]"
            }`}
          >
            {w}
          </span>
          <span className="h-2 w-2 rotate-45 bg-volt-300" aria-hidden />
        </span>
      ))}
    </div>
  );

  return (
    <div
      aria-hidden
      className="relative overflow-hidden border-y border-white/10 bg-ink-900/70 py-5"
    >
      <div className="marquee-track">
        {group}
        {group}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ink-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ink-950 to-transparent" />
    </div>
  );
}

/** Headline numbers, straight from the database. */
export function Stats({
  stats,
}: {
  stats: { value: number; suffix?: string; label: string; note: string }[];
}) {
  return (
    <Container className="py-16 sm:py-20">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/8 lg:grid-cols-4">
        {stats.map((s, i) => (
          <StatCell key={s.label} stat={s} index={i} />
        ))}
      </div>
    </Container>
  );
}

function StatCell({
  stat,
  index,
}: {
  stat: { value: number; suffix?: string; label: string; note: string };
  index: number;
}) {
  return (
    <Reveal delay={index * 0.08}>
      <div className="group h-full bg-ink-950 px-5 py-8 text-center transition-colors duration-300 hover:bg-ink-900 sm:px-6">
        <p className="font-display text-[clamp(2.4rem,5vw,3.6rem)] leading-none text-volt-300">
          <CountUp to={stat.value} suffix={stat.suffix ?? ""} />
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-smoke-200 sm:text-sm">
          {stat.label}
        </p>
        <p className="mt-1.5 text-[11px] text-smoke-500">{stat.note}</p>
      </div>
    </Reveal>
  );
}
