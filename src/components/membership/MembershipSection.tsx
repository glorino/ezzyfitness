"use client";

import { ArrowUpRight, BadgeCheck, Banknote, Check, CreditCard, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { JoinForm } from "@/components/forms/JoinForm";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { naira } from "@/lib/format";

export interface MembershipPlan {
  id: number;
  name: string;
  tagline: string | null;
  price: number;
  days: number;
  features: string[];
  popular: boolean;
}

const INCLUDED = [
  "Free fitness assessment on day one",
  "Coach on the floor during all opening hours",
  "Lockers, showers and clean changing rooms",
  "Access to every group class in the timetable",
  "Freeze your plan for up to 14 days per cycle",
  "WhatsApp renewal reminders — no surprises",
];

export function MembershipSection({ plans }: { plans: MembershipPlan[] }) {
  const defaultPlan =
    plans.find((p) => p.popular)?.name ?? plans.find((p) => p.days >= 30)?.name ?? plans[0]?.name ?? "";
  const [selected, setSelected] = useState(defaultPlan);

  const choose = (name: string) => {
    setSelected(name);
    const el = document.getElementById("join");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* ---------------- plan cards */}
      <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((p) => {
          const active = selected === p.name;
          return (
            <StaggerItem key={p.id}>
              <button
                type="button"
                onClick={() => choose(p.name)}
                aria-pressed={active}
                className={`relative flex h-full w-full flex-col rounded-3xl border p-6 text-left transition-all duration-400 sm:p-7 ${
                  active
                    ? "border-volt-300/70 bg-gradient-to-b from-volt-300/10 to-ink-900 shadow-glow"
                    : "border-white/10 bg-ink-900/70 hover:-translate-y-1 hover:border-white/25"
                } ${p.popular && !active ? "md:-translate-y-2" : ""}`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-volt-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-950">
                    Most popular
                  </span>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl text-smoke-100">{p.name}</h3>
                    {p.tagline && (
                      <p className="mt-1 text-[11px] uppercase tracking-wider text-smoke-500">
                        {p.tagline}
                      </p>
                    )}
                  </div>
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${
                      active
                        ? "border-volt-300 bg-volt-300 text-ink-950"
                        : "border-white/20 text-transparent"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                </div>

                <div className="mt-5 flex items-end gap-2">
                  <span className="font-display text-[clamp(2.2rem,4.5vw,3rem)] leading-none text-smoke-100">
                    {naira(p.price)}
                  </span>
                  <span className="pb-1.5 text-xs text-smoke-500">/ {p.days} days</span>
                </div>

                <ul className="mt-5 flex-1 space-y-2.5 border-t border-white/8 pt-5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-smoke-300">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-volt-300/15 p-1 text-volt-300">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <span className={`mt-6 w-full ${active ? "btn-volt" : "btn-ghost"}`}>
                  {active ? "Selected — continue below" : `Choose ${p.name}`}
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </button>
            </StaggerItem>
          );
        })}
      </Stagger>

      {/* ---------------- join */}
      <div id="join" className="mt-16 grid scroll-mt-28 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <span className="eyebrow mb-4">
            <span className="h-px w-8 bg-volt-300/70" />
            Included with every plan
          </span>
          <h2 className="text-[clamp(1.9rem,4vw,3rem)] leading-[0.95] text-smoke-100">
            No joining fee.
            <br />
            <span className="text-volt-gradient">No hidden charges.</span>
          </h2>

          <ul className="mt-7 space-y-3.5">
            {INCLUDED.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-smoke-300">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-volt-300/40 bg-volt-300/12 text-volt-300">
                  <BadgeCheck className="h-3 w-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-medium text-smoke-300">
              <Banknote className="h-4 w-4 text-volt-300" /> Cash
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-medium text-smoke-300">
              <CreditCard className="h-4 w-4 text-volt-300" /> POS
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-medium text-smoke-300">
              <ShieldCheck className="h-4 w-4 text-volt-300" /> Bank transfer
            </span>
          </div>

          <p className="mt-6 max-w-md rounded-2xl border border-volt-300/25 bg-volt-300/8 p-4 text-xs leading-relaxed text-smoke-300">
            <strong className="text-volt-300">Free assessment first.</strong> We
            measure, discuss your goal, then recommend the plan that actually
            fits — even if it&apos;s the cheaper one.
          </p>
        </div>

        <JoinForm plans={plans} plan={selected} onPlanChange={setSelected} />
      </div>
    </>
  );
}
