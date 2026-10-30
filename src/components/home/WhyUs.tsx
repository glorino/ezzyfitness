import { Clock, Dumbbell, TrendingUp, Users } from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Section";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Unsplash } from "@/components/ui/MediaImage";

const REASONS = [
  {
    icon: Users,
    title: "Coached, never crowded",
    body: "A coach is on the floor during every opening hour — and class caps stay honest so you're never queuing for a rack.",
  },
  {
    icon: Dumbbell,
    title: "Equipment that keeps up",
    body: "Power racks, competition plates, sleds, a boxing ring zone and two studios. Enough kit to train properly at 6am or 8pm.",
  },
  {
    icon: Clock,
    title: "Open when you are",
    body: "Weekdays from 5:30am, weekends covered. Early shifts, late shifts, after-work — there's a slot with your name on it.",
  },
  {
    icon: TrendingUp,
    title: "Progress you can measure",
    body: "Body composition scans, logged attendance and coach check-ins, so improvement is data — not guesswork.",
  },
];

export function WhyUs() {
  return (
    <Section tone="raised" className="border-y border-white/8 py-20 sm:py-28">
      <div className="noise absolute inset-0" />
      <Container className="relative grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* ---------------- visual collage */}
        <Reveal className="relative order-2 lg:order-1">
          <div className="relative">
            <Unsplash
              id="photo-1540497077202-7c8a3999166f"
              alt="Inside the Ezzy Fitness training floor"
              className="h-[340px] w-full rounded-3xl border border-white/10 sm:h-[440px]"
              width={1000}
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-tr from-ink-950/60 to-transparent" />

            <Unsplash
              id="photo-1571019613454-1cb2f99b2d8b"
              alt="Member mid-workout"
              className="absolute -bottom-10 -right-2 hidden h-44 w-44 rounded-3xl border-4 border-ink-900 sm:block lg:-right-8 lg:h-56 lg:w-56"
              width={600}
              sizes="240px"
            />

            <div className="absolute -left-2 top-6 rounded-2xl border border-volt-300/30 bg-ink-950/90 px-5 py-4 shadow-glow backdrop-blur sm:-left-6">
              <p className="font-display text-4xl leading-none text-volt-300">06</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-smoke-400">
                Years in Benin City
              </p>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap gap-2.5 lg:mt-16">
            <Badge tone="volt">Certified coaches</Badge>
            <Badge tone="cyan">Female-friendly spaces</Badge>
            <Badge>Secure parking at Ezra Mall</Badge>
          </div>
        </Reveal>

        {/* ---------------- copy */}
        <div className="order-1 lg:order-2">
          <SectionHeading
            eyebrow="Why Ezzy"
            title="More than a gym —"
            accent="a room that expects you back"
            description="We built the floor we always wanted to train on: serious equipment, honest coaching and a community that notices when you don't show up."
          />

          <Stagger className="space-y-5" gap={0.1}>
            {REASONS.map((r) => (
              <StaggerItem key={r.title}>
                <div className="group flex gap-4 rounded-2xl border border-white/8 bg-ink-950/50 p-5 transition-colors duration-300 hover:border-volt-300/35 hover:bg-ink-900">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-volt-300 transition group-hover:border-volt-300/50">
                    <r.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base text-smoke-100">{r.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-smoke-400">
                      {r.body}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </Container>
    </Section>
  );
}
