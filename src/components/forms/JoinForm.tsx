"use client";

import { ArrowUpRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { naira } from "@/lib/format";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

export function JoinForm({
  plans,
  plan: planProp,
  onPlanChange,
}: {
  plans: { id: number; name: string; price: number; days: number }[];
  plan?: string;
  onPlanChange?: (plan: string) => void;
}) {
  const { push } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    goal: "",
  });
  const planName =
    planProp ?? plans.find((p) => p.days >= 30)?.name ?? plans[0]?.name ?? "";
  const plan = planName;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.name.trim().includes(" "))
      return setError("Please enter your full name.");
    if (!EMAIL.test(form.email)) return setError("Please enter a valid email address.");
    if (form.phone.trim().length < 7) return setError("Enter a phone number we can reach you on.");

    setLoading(true);
    try {
      const chosen = plans.find((p) => p.name === plan);
      const message =
        `Membership request: ${plan}` +
        (chosen ? ` (${naira(chosen.price)} / ${chosen.days} days)` : "") +
        (form.goal ? `\n\nGoal: ${form.goal}` : "\n\nGoal: not specified yet.") +
        (form.date_of_birth ? `\n\nDate of birth: ${form.date_of_birth}` : "");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          date_of_birth: form.date_of_birth,
          subject: `Membership request — ${plan}`,
          message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send your request.");
      setDone(true);
      push("success", "Request received — we'll confirm your start date shortly.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send";
      setError(msg);
      push("error", msg);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="surface-raised flex flex-col items-center gap-4 px-6 py-14 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-volt-300/15 text-volt-300">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="text-2xl text-smoke-100">You&apos;re on the list</h3>
        <p className="max-w-md text-sm text-smoke-400">
          We&apos;ve reserved your <strong className="text-volt-300">{plan}</strong>{" "}
          enquiry. The front desk will call to confirm your free assessment and
          start date.
        </p>
        <button onClick={() => setDone(false)} className="btn-ghost btn-sm mt-1">
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="surface-raised p-6 sm:p-8" noValidate>
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-volt-300/30 bg-volt-300/12 text-volt-300">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-xl text-smoke-100">Reserve your spot</h3>
          <p className="text-xs text-smoke-500">Free assessment included with every plan</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name">
          <Input
            value={form.name}
            onChange={set("name")}
            placeholder="Your full name"
            autoComplete="name"
          />
        </Field>
        <Field label="Email address">
          <Input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Phone number">
          <Input
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            placeholder="+234 ..."
            autoComplete="tel"
          />
        </Field>
        <Field label="Date of birth">
          <Input
            type="date"
            value={form.date_of_birth}
            onChange={set("date_of_birth")}
            placeholder="YYYY-MM-DD"
          />
        </Field>
        <Field label="Preferred plan">
          <Select
            value={plan}
            onChange={(e) => onPlanChange?.(e.target.value)}
            disabled={!onPlanChange}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} — {naira(p.price)}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Your goal (optional)"
          className="sm:col-span-2"
          hint="Fat loss, strength, sport prep, general fitness — anything goes."
        >
          <Textarea
            value={form.goal}
            onChange={set("goal")}
            placeholder="I want to lose 10kg before December and finally stick with training..."
          />
        </Field>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-smoke-500">Pay at the desk — cash, transfer or POS.</p>
        <button type="submit" className="btn-volt group" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Request membership
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
