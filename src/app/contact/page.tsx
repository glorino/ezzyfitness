import {
  ArrowUpRight,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Container, Section } from "@/components/ui/Section";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import { SocialRow } from "@/components/brand/SocialIcons";
import { ContactForm } from "@/components/forms/ContactForm";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Contact & Visit",
  description:
    "Visit Ezzy Fitness at Ezra Mall, Ugbor Village Area, Benin City — call, WhatsApp or send a message. Open daily.",
};

const CARDS = [
  {
    icon: MapPin,
    title: "Find us",
    lines: [SITE.address.line1, SITE.address.line2, SITE.address.line3],
    action: { label: "Get directions", href: SITE.mapUrl },
  },
  {
    icon: Phone,
    title: "Call the desk",
    lines: [SITE.phone, "Calls & WhatsApp, daily"],
    action: { label: "Call now", href: SITE.phoneHref },
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    lines: ["Fastest for class bookings", "and renewal reminders"],
    action: { label: "Chat with us", href: SITE.whatsapp },
  },
  {
    icon: Mail,
    title: "Email",
    lines: [SITE.email, "Corporate & group plans"],
    action: { label: "Compose email", href: `mailto:${SITE.email}` },
  },
];

export default function ContactPage() {
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
                Contact & visit
              </span>
              <h1 className="max-w-4xl text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.9] text-smoke-100">
                Come see <span className="text-volt-gradient">the floor</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-smoke-400 sm:text-lg">
                Walk into Ezra Mall, ask for Ezzy Fitness — or send a message and
                we&apos;ll set up your free assessment.
              </p>
            </Reveal>
          </Container>
        </Section>

        <Section className="py-14 sm:py-20">
          <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Contact cards */}
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1" gap={0.08}>
              {CARDS.map((c) => (
                <StaggerItem key={c.title} y={18}>
                  <a
                    href={c.action.href}
                    target={c.action.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="group surface flex items-start gap-4 p-5 transition-colors duration-300 hover:border-volt-300/40 hover:bg-ink-850"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-volt-300 transition group-hover:border-volt-300/50 group-hover:bg-volt-300/12">
                      <c.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold uppercase tracking-wider text-smoke-200">
                        {c.title}
                      </p>
                      {c.lines.map((l) => (
                        <p key={l} className="mt-1 truncate text-sm text-smoke-400">
                          {l}
                        </p>
                      ))}
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-volt-300 opacity-80 transition group-hover:opacity-100">
                        {c.action.label}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </a>
                </StaggerItem>
              ))}

              <StaggerItem y={18}>
                <div className="surface p-5">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-smoke-200">
                    <Clock className="h-4 w-4 text-volt-300" />
                    Opening hours
                  </p>
                  <ul className="space-y-2">
                    {SITE.hours.map((h) => (
                      <li
                        key={h.label}
                        className="flex items-center justify-between border-b border-white/8 pb-2 text-sm last:border-0 last:pb-0"
                      >
                        <span className="text-smoke-400">{h.label}</span>
                        <span className="font-medium text-smoke-100">{h.value}</span>
                      </li>
                    ))}
                  </ul>
                  <SocialRow className="mt-4" />
                </div>
              </StaggerItem>
            </Stagger>

            {/* Form */}
            <Reveal delay={0.1}>
              <div className="mb-6">
                <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] leading-tight text-smoke-100">
                  Send us a message
                </h2>
                <p className="mt-2 text-sm text-smoke-400">
                  Questions about plans, personal training, corporate memberships
                  or female-only sessions — ask away.
                </p>
              </div>
              <ContactForm subject="Website enquiry" />
            </Reveal>
          </Container>
        </Section>

        {/* Visit band */}
        <Section tone="raised" className="border-t border-white/8 py-14">
          <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-2xl text-smoke-100">Inside Ezra Mall, Ugbor</h3>
              <p className="mt-2 max-w-xl text-sm text-smoke-400">
                {SITE.address.full} — secure parking, open daily. First session
                and fitness assessment are on the house.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={SITE.mapUrl} target="_blank" rel="noopener noreferrer" className="btn-volt">
                Open in Google Maps
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
