import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { SocialRow } from "@/components/brand/SocialIcons";
import { SITE } from "@/lib/site";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/#top" },
      { label: "Programs", href: "/#programs" },
      { label: "Weekly schedule", href: "/#schedule" },
      { label: "Our trainers", href: "/trainers" },
      { label: "Membership", href: "/membership" },
    ],
  },
  {
    title: "Training",
    links: [
      { label: "Strength & conditioning", href: "/#programs" },
      { label: "HIIT & cardio", href: "/#programs" },
      { label: "Boxing conditioning", href: "/#programs" },
      { label: "Yoga · Pilates · mobility", href: "/#programs" },
      { label: "Personal training", href: "/membership" },
    ],
  },
  {
    title: "Members",
    links: [
      { label: "Member login", href: "/login" },
      { label: "Trainer dashboard", href: "/login" },
      { label: "Front desk", href: "/login" },
      { label: "Contact support", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-ink-950">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-60" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[46rem] -translate-x-1/2 rounded-full bg-volt-300/10 blur-[110px]" />

      <div className="relative mx-auto w-full max-w-[1400px] px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Brand */}
          <div>
            <Logo className="h-14 w-auto" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-smoke-400">
              {SITE.name} is Benin City&apos;s training floor for people who want
              real coaching, real community and real results — right inside Ezra
              Mall.
            </p>
            <SocialRow className="mt-6" />
            <Link href="/membership" className="btn-volt btn-sm mt-6">
              Start your transformation
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h4 className="text-sm text-volt-300">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-1.5 text-sm text-smoke-400 transition hover:text-smoke-100"
                    >
                      <span className="h-px w-0 bg-volt-300 transition-all duration-300 group-hover:w-3" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Contact strip */}
        <div className="mt-14 grid gap-4 border-y border-white/10 py-7 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href={SITE.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-xl p-2 transition hover:bg-white/5"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-volt-300" />
            <span className="text-sm text-smoke-400 group-hover:text-smoke-200">
              {SITE.address.line1}
              <br />
              {SITE.address.line2}
              <br />
              {SITE.address.line3}
            </span>
          </a>
          <a href={SITE.phoneHref} className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/5">
            <Phone className="h-4 w-4 shrink-0 text-volt-300" />
            <span className="text-sm text-smoke-400 group-hover:text-smoke-200">
              {SITE.phone}
              <br />
              <span className="text-smoke-500">Calls & WhatsApp</span>
            </span>
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/5"
          >
            <Mail className="h-4 w-4 shrink-0 text-volt-300" />
            <span className="text-sm text-smoke-400 group-hover:text-smoke-200">{SITE.email}</span>
          </a>
          <div className="flex items-start gap-3 rounded-xl p-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-volt-300" />
            <ul className="space-y-1 text-sm text-smoke-400">
              {SITE.hours.map((h) => (
                <li key={h.label} className="flex justify-between gap-4">
                  <span>{h.label}</span>
                  <span className="text-smoke-300">{h.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-7 flex flex-col items-start justify-between gap-3 text-xs text-smoke-500 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved. · Ezra
            Mall, Ugbor Village Area, Benin City.
          </p>
          <p className="flex items-center gap-4">
            <Link href="/contact" className="transition hover:text-volt-300">
              Enquiries
            </Link>
            <Link href="/login" className="transition hover:text-volt-300">
              Staff portal
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
