import { Container, Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Faq } from "@/components/membership/Faq";
import {
  MembershipSection,
  type MembershipPlan,
} from "@/components/membership/MembershipSection";
import { EmptyState } from "@/components/ui/Field";
import { HelpCircle } from "lucide-react";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Membership & Pricing",
  description:
    "Simple gym membership plans at Ezzy Fitness, Ezra Mall Benin City — monthly, quarterly, annual, day pass and VIP coaching. Pay by cash, transfer or POS.",
};

async function getPlans(): Promise<MembershipPlan[]> {
  try {
    const rows = await query<Record<string, unknown>>(
      `SELECT id, name, tagline, price_ngn, duration_days, features, is_popular
         FROM plans WHERE is_active ORDER BY sort_order, price_ngn`
    );
    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name as string,
      tagline: (r.tagline as string) ?? null,
      price: Number(r.price_ngn),
      days: Number(r.duration_days),
      features: (r.features as string[]) ?? [],
      popular: Boolean(r.is_popular),
    }));
  } catch (err) {
    console.error("[membership]", err);
    return [];
  }
}

export default async function MembershipPage() {
  const plans = await getPlans();

  return (
    <div className="relative">
      <Navbar />

      <main>
        <Section className="overflow-hidden border-b border-white/8 pb-14 pt-[calc(var(--nav-h)+4rem)]">
          <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />
          <Container className="relative">
            <Reveal>
              <span className="eyebrow mb-5">
                <span className="h-px w-8 bg-volt-300/70" />
                Membership
              </span>
              <h1 className="max-w-4xl text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.9] text-smoke-100">
                Plans that fit <span className="text-volt-gradient">your life</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-smoke-400 sm:text-lg">
                Pick a plan, book your free assessment, start training. Every
                membership includes the full class timetable and a coach on the
                floor.
              </p>
            </Reveal>
          </Container>
        </Section>

        <Section className="py-14 sm:py-20">
          <Container>
            {plans.length === 0 ? (
              <EmptyState
                icon={HelpCircle}
                title="Plans are being updated"
                description="Pricing is being refreshed — call the front desk on +2348000000000 for today's rates."
              />
            ) : (
              <MembershipSection plans={plans} />
            )}
          </Container>
        </Section>

        {/* FAQ */}
        <Section tone="raised" className="border-t border-white/8 py-16 sm:py-20">
          <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="eyebrow mb-4">
                <span className="h-px w-8 bg-volt-300/70" />
                Good to know
              </span>
              <h2 className="text-[clamp(1.9rem,4vw,3rem)] leading-[0.95] text-smoke-100">
                Questions,
                <br />
                <span className="text-volt-gradient">answered</span>
              </h2>
              <p className="mt-4 text-sm text-smoke-400">
                Still unsure? Send a message on the{" "}
                <a href="/contact" className="text-volt-300 underline-offset-4 hover:underline">
                  contact page
                </a>{" "}
                or walk into Ezra Mall during opening hours.
              </p>
            </div>

            <Reveal delay={0.1}>
              <Faq />
            </Reveal>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
