"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Dumbbell,
  MapPin,
  Play,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { KineticHeadline } from "@/components/ui/Reveal";
import { Unsplash } from "@/components/ui/MediaImage";
import { SITE } from "@/lib/site";

const STATS = [
  { value: "1,200+", label: "Active members" },
  { value: "13", label: "Classes weekly" },
  { value: "4.9", label: "Average rating" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative overflow-hidden pb-6 pt-[calc(var(--nav-h)+1.5rem)] sm:pb-12 lg:min-h-[90svh] lg:pt-[calc(var(--nav-h)+2.5rem)]"
    >
      {/* backdrop layers */}
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-70" />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-volt-300/10 blur-[130px]" />
      <div className="noise absolute inset-0" />
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-40 diag-stripes opacity-40 sm:h-80 sm:w-56" />

      <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">
        {/* ------------------------------ copy */}
        <motion.div style={{ y: textY, opacity: fade }}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-volt-300/25 bg-volt-300/8 px-4 py-1.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-volt-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-volt-300" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider2 text-volt-200">
              Now open · Ezra Mall, Benin City
            </span>
          </motion.div>

          <h1 className="text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.86] text-smoke-100">
            <KineticHeadline
              text="UNLEASH YOUR"
              delay={0.15}
            />
            <br />
            <KineticHeadline
              text="STRONGEST SELF"
              accentWords={["STRONGEST"]}
              delay={0.42}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-smoke-400 sm:text-lg"
          >
            Coaching that meets you where you are and pushes you further. Strength
            floors, boxing, HIIT, yoga and personal training — all under one roof
            at {SITE.address.line1}.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.7 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link href="/membership" className="btn-volt group px-7 py-3.5 text-[15px]">
              Claim a free session
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link href="/#schedule" className="btn-ghost group px-6 py-3.5 text-[15px]">
              <Play className="h-4 w-4 text-volt-300" />
              See today&apos;s classes
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {["EI", "BA", "OO", "NE"].map((n, i) => (
                  <span
                    key={n}
                    className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink-950 bg-gradient-to-br from-volt-300/40 to-ink-700 text-[11px] font-bold text-volt-100"
                    style={{ zIndex: 4 - i }}
                  >
                    {n}
                  </span>
                ))}
              </div>
              <div className="text-xs text-smoke-400">
                <div className="flex gap-0.5 text-volt-300">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="mt-0.5 block">4.9 from 300+ reviews</span>
              </div>
            </div>

            <div className="hidden h-9 w-px bg-white/12 sm:block" />

            <div className="flex gap-7">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-2xl leading-none text-smoke-100">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-smoke-500">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ------------------------------ visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, rotate: -1.5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.35, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-xl lg:max-w-none"
        >
          <motion.div
            style={{ y: imageY }}
            className="relative rounded-[2rem] border border-white/12 bg-ink-900 p-2 shadow-card"
          >
            <Unsplash
              id="photo-1534438327276-14e5300c3a48"
              alt="Member training with weights at Ezzy Fitness"
              className="h-[380px] w-full rounded-[1.6rem] sm:h-[460px] lg:h-[540px]"
              sizes="(max-width: 1024px) 100vw, 46vw"
              width={1000}
            />
            <div className="pointer-events-none absolute inset-2 rounded-[1.6rem] bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />

            {/* live class chip */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.7 }}
              className="absolute -left-3 top-6 flex items-center gap-3 rounded-2xl border border-white/12 bg-ink-950/90 px-4 py-3 shadow-card backdrop-blur sm:-left-6"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-ember/15 text-ember">
                <Dumbbell className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-smoke-500">
                  Live on the floor
                </p>
                <p className="text-sm font-semibold text-smoke-100">
                  HIIT Blast · 06:00
                </p>
              </div>
              <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-ember" />
            </motion.div>

            {/* membership chip */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.7 }}
              className="absolute -bottom-6 right-3 rounded-2xl border border-volt-300/30 bg-ink-950/92 px-5 py-4 shadow-glow backdrop-blur sm:-right-4"
            >
              <p className="text-[10px] uppercase tracking-wider text-volt-300">
                Weekly check-ins
              </p>
              <p className="font-display text-3xl leading-none text-smoke-100">
                486
              </p>
              <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-volt-300"
                  initial={{ width: 0 }}
                  animate={{ width: "78%" }}
                  transition={{ delay: 1.6, duration: 1.4, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* rotating badge */}
          <motion.div
            className="absolute -bottom-10 left-4 hidden h-28 w-28 items-center justify-center lg:flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <svg viewBox="0 0 100 100" className="absolute h-full w-full animate-spin [animation-duration:18s] [animation-timing-function:linear]">
              <defs>
                <path
                  id="circlePath"
                  d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0"
                  fill="none"
                />
              </defs>
              <text fill="rgba(214,255,63,0.75)" fontSize="8.5" letterSpacing="3.4" fontFamily="Inter, sans-serif">
                <textPath href="#circlePath">
                  TRAIN · TRANSFORM · TRIUMPH ·
                </textPath>
              </text>
            </svg>
            <span className="grid h-12 w-12 place-items-center rounded-full border border-volt-300/40 bg-volt-300/10 text-volt-300">
              <ArrowDown className="h-5 w-5 animate-bounce" />
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* address ticker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7, duration: 0.7 }}
        className="relative mx-auto mt-14 flex w-full max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-5 text-xs text-smoke-500 sm:px-8"
      >
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-volt-300" />
          {SITE.address.full}
        </span>
        <span className="hidden sm:block">·</span>
        <span>{SITE.hours[0].label}: {SITE.hours[0].value}</span>
      </motion.div>
    </section>
  );
}
