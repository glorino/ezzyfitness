"use client";

import { ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/** Shared async submit for our public forms. */
async function send(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export function ContactForm({ subject }: { subject?: string }) {
  const { push } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.name.trim().includes(" "))
      return setError("Please enter your full name.");
    if (!EMAIL.test(form.email)) return setError("Please enter a valid email address.");
    if (form.message.trim().length < 10)
      return setError("Please write at least 10 characters so we can help.");

    setLoading(true);
    try {
      const data = await send("/api/contact", { ...form, subject });
      setSent(true);
      push("success", data.message ?? "Message sent!");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send";
      setError(msg);
      push("error", msg);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="surface-raised flex flex-col items-center gap-4 px-6 py-14 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-volt-300/15 text-volt-300">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="text-2xl text-smoke-100">Message received</h3>
        <p className="max-w-md text-sm text-smoke-400">
          Thanks for reaching out. A member of the Ezzy Fitness team will reply
          within one business day — usually much sooner.
        </p>
        <button onClick={() => setSent(false)} className="btn-ghost btn-sm mt-1">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="surface-raised p-6 sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" error={null}>
          <Input
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Osemudiamen Idahosa"
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
        <Field label="Phone (optional)">
          <Input
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            placeholder="+234 ..."
            autoComplete="tel"
          />
        </Field>
        <Field label="Best time to reach you">
          <Select defaultValue="any">
            <option value="any">Any time</option>
            <option value="morning">Mornings (6–11am)</option>
            <option value="afternoon">Afternoons (12–4pm)</option>
            <option value="evening">Evenings (5–9pm)</option>
          </Select>
        </Field>
        <Field label="Your message" className="sm:col-span-2">
          <Textarea
            value={form.message}
            onChange={set("message")}
            placeholder="Tell us your goal, schedule, or anything you'd like to know about the gym..."
          />
        </Field>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-smoke-500">
          We reply within one business day. No spam, ever.
        </p>
        <button type="submit" className="btn-volt group" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send message
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
