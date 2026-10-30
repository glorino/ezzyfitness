import {
  Dumbbell,
  Flame,
  HeartPulse,
  Music,
  Swords,
  Target,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Container, SectionHeading, Section } from "@/components/ui/Section";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";

const PROGRAMS = [
  {
    icon: Dumbbell,
    title: "Strength Floor",
    desc: "Barbell compounds, plate-loaded machines and dumbbells — with coaching on form and progressive overload.",
    tag: "Free weights",
  },
  {
    icon: Flame,
    title: "HIIT & Fat Loss",
    desc: "45-minute interval sessions that spike the heart rate, torch calories and build conditioning fast.",
    tag: "45 min",
  },
  {
    icon: Swords,
    title: "Boxing Conditioning",
    desc: "Pad work, footwork drills and fight-camp cardio. No sparring required — just effort.",
    tag: "Ring zone",
  },
  {
    icon: HeartPulse,
    title: "Yoga & Mobility",
    desc: "Breath-led flows and joint work that undo desk posture and keep you training injury-free.",
    tag: "Studio A",
  },
  {
    icon: Music,
    title: "Dance Cardio",
    desc: "Afrobeats-fuelled Zumba sessions. Zero judgement, maximum sweat, unmissable playlists.",
    tag: "Group class",
  },
  {
    icon: Target,
    title: "Personal Training",
    desc: "1-on-1 programming built around your body, schedule and goal — with weekly accountability.",
    tag: "By appointment",
  },
];

export function Programs() {
  return (
    <Section id="programs" className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="What we train"
            title="Programs built for"
            accent="real change"
            description="Six training paths, one standard: coached properly, progressed intelligently, delivered in a space you actually want to train in."
            className="mb-0 lg:max-w-2xl"
          />
          <Reveal delay={0.1}>
            <Link href="/#schedule" className="btn-ghost">
              Weekly timetable
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((p, i) => (
            <StaggerItem key={p.title}>
              <article className="group surface-raised relative h-full overflow-hidden p-7 card-lift">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-volt-300/0 blur-2xl transition-all duration-500 group-hover:bg-volt-300/20" />
                <div className="relative flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-volt-300/25 bg-volt-300/10 p-3 text-volt-300 transition-all duration-300 group-hover:border-volt-300/60 group-hover:bg-volt-300/20">
                    <p.icon className="h-6 w-6" />
                  </span>
                  <span className="font-display text-5xl leading-none text-white/8 transition-colors duration-300 group-hover:text-volt-300/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="relative mt-6 text-xl text-smoke-100">{p.title}</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-smoke-400">
                  {p.desc}
                </p>

                <div className="relative mt-6 flex items-center justify-between border-t border-white/8 pt-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-smoke-500">
                    {p.tag}
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-white/12 text-smoke-400 transition-all duration-300 group-hover:border-volt-300 group-hover:bg-volt-300 group-hover:text-ink-950">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
