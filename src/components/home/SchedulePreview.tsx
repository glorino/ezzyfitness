"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, MapPin, Timer, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/Field";
import { cn, dayName, formatTime, statusTone } from "@/lib/format";
import { DAY_SHORT } from "@/lib/site";

export interface ClassRow {
  id: number;
  name: string;
  category: string;
  day: number;
  start: string;
  end: string;
  location: string;
  intensity: "Low" | "Medium" | "High";
  capacity: number;
  trainer: string | null;
}

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun

export function SchedulePreview({
  classes,
  today,
}: {
  classes: ClassRow[];
  today: number;
}) {
  const [active, setActive] = useState<number>(ORDER.includes(today) ? today : 1);

  const list = useMemo(
    () => classes.filter((c) => c.day === active).sort((a, b) => a.start.localeCompare(b.start)),
    [classes, active]
  );

  return (
    <Section id="schedule" className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Weekly timetable"
            title="Classes running"
            accent="every week"
            description="Thirteen coached sessions across the week. Members book in-app or at the front desk — walk-ins welcome when there's space."
            className="mb-0 lg:max-w-2xl"
          />
          <div className="flex items-center gap-2 text-sm text-smoke-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-volt-300 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-volt-300" />
            </span>
            Today is {dayName(today)}
          </div>
        </div>

        {/* Day selector */}
        <div className="mt-10 -mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-2">
            {ORDER.map((d) => (
              <button
                key={d}
                onClick={() => setActive(d)}
                className={cn(
                  "relative rounded-full border px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-300",
                  active === d
                    ? "border-volt-300 bg-volt-300 text-ink-950"
                    : "border-white/12 bg-white/5 text-smoke-400 hover:border-volt-300/50 hover:text-smoke-200"
                )}
              >
                {DAY_SHORT[d]}
                {d === today && active !== d && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-volt-300" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Class list */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-ink-900/60">
          <AnimatePresence mode="wait">
            <motion.ul
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="divide-y divide-white/8"
            >
              {list.length === 0 && (
                <li className="p-5">
                  <EmptyState
                    icon={CalendarDays}
                    title="Rest day"
                    description={`No classes scheduled for ${dayName(active)}. The floor is still open for open gym training.`}
                  />
                </li>
              )}

              {list.map((c) => (
                <li
                  key={c.id}
                  className="group relative flex flex-col gap-4 px-5 py-5 transition-colors duration-300 hover:bg-white/[0.035] sm:px-7 md:flex-row md:items-center md:justify-between"
                >
                  <span className="absolute inset-y-0 left-0 w-1 scale-y-0 bg-volt-300 transition-transform duration-300 group-hover:scale-y-100" />

                  <div className="flex items-start gap-4">
                    <div className="w-24 shrink-0">
                      <p className="font-display text-xl leading-none text-volt-300">
                        {formatTime(c.start)}
                      </p>
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-smoke-500">
                        <Timer className="h-3 w-3" />
                        to {formatTime(c.end)}
                      </p>
                    </div>

                    <div>
                      <p className="text-base font-semibold text-smoke-100 transition-colors group-hover:text-volt-200">
                        {c.name}
                      </p>
                      <p className="mt-1 text-xs text-smoke-500">
                        {c.category}
                        {c.trainer && <> · with {c.trainer}</>}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 md:gap-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                        statusTone(
                          c.intensity === "High"
                            ? "failed"
                            : c.intensity === "Medium"
                              ? "pending"
                              : "present"
                        )
                      )}
                    >
                      {c.intensity} intensity
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-smoke-400">
                      <MapPin className="h-3.5 w-3.5 text-smoke-500" />
                      {c.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-smoke-400">
                      <Users className="h-3.5 w-3.5 text-smoke-500" />
                      max {c.capacity}
                    </span>
                  </div>
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>

        <p className="mt-5 text-xs text-smoke-500">
          Schedule may shift on public holidays — check WhatsApp or the front desk
          for live changes.
        </p>
      </Container>
    </Section>
  );
}
