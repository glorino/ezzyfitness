import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/ui/Section";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { naira } from "@/lib/format";

export interface PlanCardData {
  id: number;
  name: string;
  tagline: string | null;
  price: number;
  days: number;
  features: string[];
  popular: boolean;
}

export function PricingPreview({ plans }: { plans: PlanCardData[] }) {
  return (
    <Section id="pricing" className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Membership"
          title="Simple pricing,"
          accent="no hidden fees"
          description="Pay at the desk by cash, transfer or POS. Freeze your plan when life gets in the way — we'd rather keep you than lose you."
          align="center"
          className="mx-auto"
        />

        <Stagger className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <StaggerItem key={p.id}>
              <div
                className={`relative flex h-full flex-col rounded-3xl border p-7 transition-all duration-400 ${
                  p.popular
                    ? "border-volt-300/50 bg-gradient-to-b from-volt-300/10 to-ink-900 shadow-glow md:-translate-y-3"
                    : "border-white/10 bg-ink-900/70 hover:border-white/25"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-volt-300 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-950">
                    <Sparkles className="h-3 w-3" />
                    Most popular
                  </span>
                )}

                <h3 className="text-lg text-smoke-100">{p.name}</h3>
                {p.tagline && (
                  <p className="mt-1 text-xs uppercase tracking-wider text-smoke-500">
                    {p.tagline}
                  </p>
                )}

                <div className="mt-6 flex items-end gap-2">
                  <span className="font-display text-[clamp(2.4rem,5vw,3.2rem)] leading-none text-smoke-100">
                    {naira(p.price)}
                  </span>
                  <span className="pb-1.5 text-xs text-smoke-500">
                    / {p.days} days
                  </span>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-smoke-300">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-volt-300/15 p-1 text-volt-300">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/membership"
                  className={`mt-7 w-full ${p.popular ? "btn-volt" : "btn-ghost"}`}
                >
                  Choose {p.name}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.2}>
          <p className="mt-8 text-center text-xs text-smoke-500">
            Also available: Day Pass {naira(3000)} · VIP Unlimited with 1-on-1
            coaching.{" "}
            <Link href="/membership" className="text-volt-300 underline-offset-4 hover:underline">
              See every plan →
            </Link>
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}
