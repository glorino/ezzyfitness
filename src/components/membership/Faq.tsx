"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

const ITEMS = [
  {
    q: "Do I need experience to start?",
    a: "Not at all. Every new member gets a free fitness assessment and a first-week plan. Our coaches introduce movement patterns before adding load — beginners are our specialty.",
  },
  {
    q: "How do I pay?",
    a: "Pay at the front desk by cash, bank transfer or POS. You'll get your receipt, plan start and expiry dates immediately, plus reminders before renewal.",
  },
  {
    q: "Can I freeze my membership?",
    a: "Yes. Travelling, ill or exams? Freeze once per billing cycle for up to 14 days at no cost — just tell the front desk before you travel.",
  },
  {
    q: "Are there female-only sessions?",
    a: "Yes. We run ladies-only slots with female coaches, plus a dedicated studio area. Ask the desk for the current timetable.",
  },
  {
    q: "Can I try before I join?",
    a: "Absolutely — your first session and assessment are free. Come in during opening hours, meet a coach and train once on us.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-white/8 rounded-3xl border border-white/10 bg-ink-900/60">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] sm:px-6"
            >
              <span
                className={`text-sm font-semibold transition-colors sm:text-base ${
                  isOpen ? "text-volt-300" : "text-smoke-100"
                }`}
              >
                {item.q}
              </span>
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                  isOpen
                    ? "rotate-180 border-volt-300 bg-volt-300 text-ink-950"
                    : "border-white/15 text-smoke-400"
                }`}
              >
                {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-smoke-400 sm:px-6">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
