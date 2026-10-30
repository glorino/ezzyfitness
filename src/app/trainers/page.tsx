import { ArrowUpRight, BadgeCheck, CalendarPlus, Users } from "lucide-react";
import { InstagramIcon } from "@/components/brand/SocialIcons";
import Link from "next/link";
import { Container, Section } from "@/components/ui/Section";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/Field";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { query } from "@/lib/db";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Our Trainers",
  description:
    "Meet the certified coaches at Ezzy Fitness — strength, conditioning, boxing, yoga and Pilates specialists training members at Ezra Mall, Benin City.",
};

interface Trainer {
  id: number;
  name: string;
  bio: string | null;
  specialties: string[];
  certifications: string[];
  years: number;
  instagram: string | null;
  avatarMediaId: number | null;
  classes: number;
}

async function getTrainers(): Promise<Trainer[]> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT u.id, u.full_name AS name, u.avatar_media_id,
              t.bio, t.specialties, t.certifications, t.experience_years AS years,
              t.instagram,
              (SELECT count(*)::int FROM classes c
                WHERE c.trainer_id = u.id AND c.is_active) AS classes
         FROM trainers t
         JOIN users u ON u.id = t.user_id
        WHERE t.is_visible AND u.status = 'active'
        ORDER BY t.sort_order, u.full_name`
    );
    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name as string,
      bio: (r.bio as string | null) ?? null,
      specialties: (r.specialties as string[]) ?? [],
      certifications: (r.certifications as string[]) ?? [],
      years: Number(r.years ?? 0),
      instagram: (r.instagram as string | null) ?? null,
      avatarMediaId: (r.avatar_media_id as number | null) ?? null,
      classes: Number(r.classes ?? 0),
    }));
  } catch (err) {
    console.error("[trainers]", err);
    return [];
  }
}

export default async function TrainersPage() {
  const trainers = await getTrainers();

  return (
    <div className="relative">
      <Navbar />

      <main>
        {/* Page header */}
        <Section className="overflow-hidden border-b border-white/8 pb-14 pt-[calc(var(--nav-h)+4rem)] sm:pb-16">
          <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />
          <Container className="relative">
            <Reveal>
              <span className="eyebrow mb-5">
                <span className="h-px w-8 bg-volt-300/70" />
                The coaching team
              </span>
              <h1 className="max-w-4xl text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.9] text-smoke-100">
                Coaches who watch{" "}
                <span className="text-volt-gradient">every rep</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-smoke-400 sm:text-lg">
                Every session on our floor is programmed by a certified coach.
                Meet the team building plans for beginners, athletes and
                everyone in between.
              </p>
            </Reveal>

            <Stagger className="mt-10 flex flex-wrap gap-3" gap={0.07}>
              {["NASM · ACE certified", "Female-friendly coaching", "Beginner onboarding", "Sport-specific prep"].map(
                (chip) => (
                  <StaggerItem key={chip} y={14}>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-medium text-smoke-300">
                      <BadgeCheck className="h-3.5 w-3.5 text-volt-300" />
                      {chip}
                    </span>
                  </StaggerItem>
                )
              )}
            </Stagger>
          </Container>
        </Section>

        {/* Trainer grid */}
        <Section className="py-16 sm:py-24">
          <Container>
            {trainers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Coach profiles are being published"
                description="Our trainer profiles will appear here shortly. Call the front desk on the number below and we'll introduce you personally."
                action={
                  <a href={SITE.phoneHref} className="btn-volt btn-sm mt-2">
                    {SITE.phone}
                  </a>
                }
              />
            ) : (
              <Stagger className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {trainers.map((t) => (
                  <StaggerItem key={t.id}>
                    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-ink-850 to-ink-900 p-7 card-lift">
                      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-volt-300/0 blur-3xl transition-all duration-500 group-hover:bg-volt-300/15" />
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-volt-300/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                      <div className="relative flex items-start justify-between gap-4">
                        <Avatar name={t.name} mediaId={t.avatarMediaId} size="xl" className="border-volt-300/25" />
                        <div className="flex flex-col items-end gap-2 text-right">
                          <span className="rounded-full border border-volt-300/30 bg-volt-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-volt-300">
                            {t.years}+ yrs
                          </span>
                          {t.classes > 0 && (
                            <span className="text-[11px] uppercase tracking-wider text-smoke-500">
                              {t.classes} weekly class{t.classes === 1 ? "" : "es"}
                            </span>
                          )}
                        </div>
                      </div>

                      <h2 className="relative mt-6 text-2xl text-smoke-100">{t.name}</h2>

                      <div className="relative mt-3 flex flex-wrap gap-1.5">
                        {t.specialties.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-smoke-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      {t.bio && (
                        <p className="relative mt-4 flex-1 text-sm leading-relaxed text-smoke-400">
                          {t.bio}
                        </p>
                      )}

                      {t.certifications.length > 0 && (
                        <ul className="relative mt-5 space-y-1.5 border-t border-white/8 pt-4">
                          {t.certifications.map((c) => (
                            <li
                              key={c}
                              className="flex items-center gap-2 text-xs text-smoke-400"
                            >
                              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-volt-300" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="relative mt-5 flex items-center justify-between gap-3">
                        {t.instagram ? (
                          <span className="inline-flex items-center gap-2 text-xs text-smoke-500">
                            <InstagramIcon className="h-3.5 w-3.5" />
                            {t.instagram.replace(/^@/, "")}
                          </span>
                        ) : (
                          <span />
                        )}
                        <Link href="/membership" className="btn-ghost btn-sm">
                          <CalendarPlus className="h-3.5 w-3.5" />
                          Book a session
                        </Link>
                      </div>
                    </article>
                  </StaggerItem>
                ))}
              </Stagger>
            )}

            {/* closing CTA */}
            <Reveal delay={0.1}>
              <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-3xl border border-volt-300/25 bg-volt-300/8 p-8 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-xl text-smoke-100 sm:text-2xl">
                    Not sure which coach fits your goal?
                  </h3>
                  <p className="mt-2 max-w-xl text-sm text-smoke-400">
                    Book a free assessment and we&apos;ll match you with the right
                    trainer — strength, fat loss, mobility or sport prep.
                  </p>
                </div>
                <Link href="/contact" className="btn-volt shrink-0">
                  Book your free assessment
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
