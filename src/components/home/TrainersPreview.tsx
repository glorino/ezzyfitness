import { ArrowUpRight, BadgeCheck, Dumbbell } from "lucide-react";
import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Avatar } from "@/components/ui/Avatar";

export interface TrainerCardData {
  id: number;
  name: string;
  specialties: string[];
  years: number;
  avatarMediaId: number | null;
  bio?: string | null;
}

export function TrainersPreview({ trainers }: { trainers: TrainerCardData[] }) {
  return (
    <Section className="py-20 sm:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="The team"
            title="Coaches who"
            accent="watch every rep"
            description="Certified, experienced and genuinely invested — meet the people programming your sessions."
            className="mb-0 lg:max-w-2xl"
          />
          <Reveal delay={0.1}>
            <Link href="/trainers" className="btn-ghost">
              Meet the full team
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trainers.map((t) => (
            <StaggerItem key={t.id}>
              <Link
                href="/trainers"
                className="group relative block h-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-ink-850 to-ink-900 p-6 card-lift"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-volt-300/0 blur-2xl transition-all duration-500 group-hover:bg-volt-300/20" />

                <div className="relative flex items-start justify-between">
                  <Avatar name={t.name} mediaId={t.avatarMediaId} size="lg" className="border-volt-300/25" />
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-white/12 text-smoke-500 transition-all duration-300 group-hover:border-volt-300 group-hover:bg-volt-300 group-hover:text-ink-950">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                <h3 className="relative mt-5 text-lg text-smoke-100">{t.name}</h3>
                <p className="relative mt-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-volt-300">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t.years}+ years coaching
                </p>

                <div className="relative mt-4 flex flex-wrap gap-1.5">
                  {t.specialties.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-smoke-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {t.bio && (
                  <p className="relative mt-4 line-clamp-3 text-xs leading-relaxed text-smoke-500">
                    {t.bio}
                  </p>
                )}

                <span className="relative mt-5 flex items-center gap-1.5 border-t border-white/8 pt-4 text-[11px] uppercase tracking-wider text-smoke-500 transition-colors group-hover:text-volt-300">
                  <Dumbbell className="h-3.5 w-3.5" />
                  View profile
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
