"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/brand/Logo";
import { Unsplash } from "@/components/ui/MediaImage";
import { SITE } from "@/lib/site";

const DEMO = [
  { role: "Admin", email: "admin@ezzyfitness.ng", password: "Admin@123" },
  { role: "Trainer", email: "tunde@ezzyfitness.ng", password: "Trainer@123" },
  { role: "Front desk", email: "frontdesk@ezzyfitness.ng", password: "Frontdesk@123" },
  { role: "Member", email: "osemudiamen.idahosa@mail.com", password: "Member@123" },
];

export function LoginScreen({ showDemo }: { showDemo: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Sign in failed.");
      router.push(data.redirectTo ?? "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      {/* ------------------------------------------------ brand panel */}
      <aside className="relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0">
          <Unsplash
            id="photo-1517836357463-d25dfeac3438"
            alt="Training at Ezzy Fitness"
            className="h-full w-full"
            width={1400}
            sizes="55vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-ink-950/95 via-ink-950/88 to-ink-950/95" />
          <div className="absolute inset-0 grid-lines opacity-70" />
        </div>

        <Link href="/" className="relative w-fit">
          <Logo className="h-14 w-auto" priority />
        </Link>

        <div className="relative max-w-lg">
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(2.4rem,4.6vw,4rem)] leading-[0.92] text-smoke-100"
          >
            The floor runs
            <br />
            <span className="text-volt-gradient">on your work.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="mt-5 text-sm leading-relaxed text-smoke-400"
          >
            Admins run the business, coaches run the sessions, the front desk
            keeps members moving — all from one dashboard.
          </motion.p>

          <motion.ul
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
            className="mt-8 space-y-3"
          >
            {[
              "Members, plans, payments and renewals in one place",
              "Class scheduling, attendance and check-in logging",
              "Trainer profiles with personal schedules",
            ].map((item, i) => (
              <motion.li
                key={item}
                variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
                className="flex items-start gap-3 text-sm text-smoke-300"
              >
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-volt-300/15 text-[10px] font-bold text-volt-300">
                  {i + 1}
                </span>
                {item}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-smoke-500">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-volt-300" />
            {SITE.address.line1}, {SITE.address.line3}
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-volt-300" />
            {SITE.phone}
          </span>
        </div>
      </aside>

      {/* ------------------------------------------------ form panel */}
      <main className="relative flex flex-col justify-center px-5 py-12 sm:px-10 lg:px-14">
        <div className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-volt-300/10 blur-[110px]" />

        <div className="relative mx-auto w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo className="h-11 w-auto" />
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="eyebrow mb-4">
              <span className="h-px w-8 bg-volt-300/70" />
              Secure sign in
            </span>
            <h2 className="text-[clamp(2rem,4vw,2.8rem)] leading-none text-smoke-100">
              Welcome back
            </h2>
            <p className="mt-3 text-sm text-smoke-400">
              Sign in to your Ezzy Fitness dashboard.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              <div>
                <label className="label" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-smoke-500" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@ezzyfitness.ng"
                    className="field pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-smoke-500" />
                  <input
                    id="password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="field pl-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-smoke-500 transition hover:text-volt-300"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember"
                >
                  {error}
                </motion.p>
              )}

              <button type="submit" className="btn-volt w-full py-3.5" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Sign in to dashboard
                    <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-smoke-500">
                <KeyRound className="h-3.5 w-3.5" />
                Sessions expire automatically after 7 days
              </p>
            </form>

            {showDemo && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-ink-900/70 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-smoke-500">
                  Demo accounts — tap to fill
                </p>
                <div className="grid gap-2">
                  {DEMO.map((d) => (
                    <button
                      key={d.email}
                      type="button"
                      onClick={() => {
                        setEmail(d.email);
                        setPassword(d.password);
                        setError(null);
                      }}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-left transition hover:border-volt-300/50 hover:bg-volt-300/8"
                    >
                      <span>
                        <span className="block text-xs font-semibold text-smoke-200 group-hover:text-volt-300">
                          {d.role}
                        </span>
                        <span className="block text-[11px] text-smoke-500">{d.email}</span>
                      </span>
                      <span className="text-[10px] font-medium text-smoke-600 group-hover:text-volt-300">
                        fill →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
