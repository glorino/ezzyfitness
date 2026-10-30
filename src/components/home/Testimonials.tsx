"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { initials } from "@/lib/format";

const TESTIMONIALS = [
  {
    quote:
      "I've trained in a few gyms in Benin City and this is the first one where a coach actually corrects your form on day one. Down 11kg since March.",
    name: "Osemudiamen Idahosa",
    role: "Member since 2024",
    tag: "Weight loss",
  },
  {
    quote:
      "Precious rebuilt my shoulders after a bike accident. Six months later I'm pressing overhead again — with a plan I actually understood.",
    name: "Amaka Obasogie",
    role: "Quarterly Pro",
    tag: "Comeback",
  },
  {
    quote:
      "The 6am Power Hour is the reason my workdays start calm. Small groups, real coaching, and the music is never too loud to think.",
    name: "Ighodalo Eweka",
    role: "Annual Elite",
    tag: "Strength",
  },
  {
    quote:
      "Front desk renewal took 40 seconds and I got my plan dates on WhatsApp. For a gym this serious about training, the admin is just as sharp.",
    name: "Blessing Agho",
    role: "Monthly Starter",
    tag: "Experience",
  },
  {
    quote:
      "Zumba on Thursdays is the highlight of my week. I come for the class, I stay because the whole place feels like people I know.",
    name: "Ngozi Ehinmokhai",
    role: "Member since 2023",
    tag: "Community",
  },
  {
    quote:
      "Kelvin runs conditioning like a fight camp. Twelve weeks in, my 5K dropped by four minutes and I sleep like a stone.",
    name: "Endurance Ogiemwonyi",
    role: "VIP Unlimited",
    tag: "Conditioning",
  },
];

export function Testimonials() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (next: number) => {
    setDir(next > 0 || (i === TESTIMONIALS.length - 1 && next < 0) ? 1 : -1);
    setI((prev) => (prev + next + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  useEffect(() => {
    const t = setInterval(() => {
      setDir(1);
      setI((p) => (p + 1) % TESTIMONIALS.length);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const item = TESTIMONIALS[i];

  return (
    <Section tone="raised" className="border-y border-white/8 py-20 sm:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Member stories"
            title="Results that"
            accent="speak for themselves"
            className="mb-0"
          />

          <div className="flex items-center gap-3">
            <span className="font-display text-lg text-smoke-300">
              {String(i + 1).padStart(2, "0")}
              <span className="text-smoke-600"> / {String(TESTIMONIALS.length).padStart(2, "0")}</span>
            </span>
            <button
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-smoke-300 transition hover:border-volt-300 hover:bg-volt-300 hover:text-ink-950"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next testimonial"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-smoke-300 transition hover:border-volt-300 hover:bg-volt-300 hover:text-ink-950"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative mt-10 min-h-[340px] overflow-hidden rounded-3xl border border-white/10 bg-ink-950/70 p-7 sm:min-h-[300px] sm:p-12">
          <div className="pointer-events-none absolute -right-10 -top-16 select-none font-display text-[16rem] leading-none text-white/[0.035]">
            &ldquo;
          </div>
          <div className="pointer-events-none absolute inset-x-0 -bottom-24 h-48 bg-volt-300/10 blur-[100px]" />

          <AnimatePresence mode="wait" custom={dir}>
            <motion.figure
              key={i}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-4xl"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex gap-1 text-volt-300">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="rounded-full border border-white/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-smoke-400">
                  {item.tag}
                </span>
              </div>

              <blockquote className="text-balance font-sans text-[clamp(1.25rem,2.6vw,2rem)] font-medium leading-snug text-smoke-100">
                <span className="text-volt-300">&ldquo;</span>
                {item.quote}
                <span className="text-volt-300">&rdquo;</span>
              </blockquote>

              <figcaption className="mt-8 flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-volt-300/30 bg-gradient-to-br from-volt-300/25 to-ink-800 text-sm font-bold text-volt-100">
                  {initials(item.name)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-smoke-100">
                    {item.name}
                  </span>
                  <span className="block text-xs text-smoke-500">{item.role}</span>
                </span>
                <Quote className="ml-auto h-8 w-8 text-volt-300/40" />
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {/* progress dots */}
        <div className="mt-6 flex gap-2">
          {TESTIMONIALS.map((t, idx) => (
            <button
              key={t.name}
              onClick={() => {
                setDir(idx > i ? 1 : -1);
                setI(idx);
              }}
              aria-label={`Testimonial ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-400 ${
                idx === i ? "w-10 bg-volt-300" : "w-4 bg-white/15 hover:bg-white/30"
              }`}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
