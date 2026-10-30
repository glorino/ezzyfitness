"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Clock, MapPin, Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { SocialRow } from "@/components/brand/SocialIcons";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/format";

const NAV = [
  { label: "Home", href: "/#top" },
  { label: "Programs", href: "/#programs" },
  { label: "Schedule", href: "/#schedule" },
  { label: "Trainers", href: "/trainers" },
  { label: "Membership", href: "/membership" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setUser(null);
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isMemberOrTrainer = user && (user.role === "member" || user.role === "trainer");

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[80] transition-all duration-500",
          scrolled
            ? "glass border-b border-white/10 py-2"
            : "border-b border-transparent bg-transparent py-3"
        )}
      >
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 px-5 sm:px-8">
          {/* Brand */}
          <Link href="/#top" className="group flex items-center gap-3" aria-label="Ezzy Fitness home">
            <Logo priority className="h-10 w-auto transition-transform duration-300 group-hover:scale-[1.03] sm:h-11" />
            <span className="hidden border-l border-white/15 pl-3 text-[9px] font-semibold uppercase leading-[1.35] tracking-wider2 text-smoke-500 xl:block">
              Ezra Mall
              <br />
              Benin City
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group relative px-3 py-2 text-[13px] font-medium text-smoke-300 transition-colors hover:text-smoke-100"
              >
                {item.label}
                <span className="absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-volt-300 transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <a
              href={SITE.phoneHref}
              className="hidden items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-xs font-semibold text-smoke-300 transition hover:border-volt-300/50 hover:text-volt-300 xl:flex"
            >
              <Phone className="h-3.5 w-3.5" />
              {SITE.phone}
            </a>

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                {isMemberOrTrainer ? (
                  <Link href="/dashboard/member" className="btn-volt btn-sm">
                    Dashboard
                  </Link>
                ) : null}
                {user.role === "admin" && (
                  <Link href="/dashboard/admin" className="btn-volt btn-sm">
                    Admin
                  </Link>
                )}
                {user.role === "trainer" && (
                  <Link href="/dashboard/trainer" className="btn-volt btn-sm">
                    Trainer
                  </Link>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">
                  Staff login
                </Link>
                <Link href="/membership" className="btn-volt btn-sm hidden sm:inline-flex">
                  Join now
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile / tablet overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[95] flex flex-col bg-ink-950/97 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between px-5 py-4 sm:px-8">
              <Logo className="h-10 w-auto" />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/12 text-smoke-200 hover:border-volt-300/50 hover:text-volt-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center gap-1 px-6 sm:px-10">
              {NAV.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between border-b border-white/8 py-4 text-[clamp(2rem,9vw,3rem)] leading-none text-smoke-100 transition-colors hover:text-volt-300"
                    style={{ fontFamily: "'Anton', Impact, sans-serif", textTransform: "uppercase" }}
                  >
                    {item.label}
                    <ArrowUpRight className="h-6 w-6 -translate-x-3 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="space-y-3 border-t border-white/8 px-6 py-6 sm:px-10">
              <p className="flex items-start gap-2 text-sm text-smoke-400">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-volt-300" />
                {SITE.address.full}
              </p>
              <p className="flex items-center gap-2 text-sm text-smoke-400">
                <Clock className="h-4 w-4 shrink-0 text-volt-300" />
                {SITE.hours[0].label}: {SITE.hours[0].value}
              </p>
              <div className="flex items-center justify-between pt-1">
                <SocialRow />
                <a href={SITE.phoneHref} className="text-sm font-semibold text-volt-300">
                  {SITE.phone}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}