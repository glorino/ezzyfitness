import { ArrowUpRight, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { SocialRow } from "@/components/brand/SocialIcons";
import { SITE } from "@/lib/site";

/** Full-bleed volt closer before the footer. */
export function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-volt-300 text-ink-950">
      <div className="absolute inset-0 diag-stripes opacity-60" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[30px] border-ink-950/10" />
      <div className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full border-[24px] border-ink-950/10" />

      <Container className="relative grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-950/20 bg-ink-950/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider2">
            First session on us
          </span>
          <h2 className="mt-5 text-[clamp(2.3rem,5.5vw,4.2rem)] leading-[0.92] text-ink-950">
            Your strongest
            <br />
            chapter starts
            <br />
            at Ezra Mall.
          </h2>
          <p className="mt-5 max-w-md text-sm font-medium leading-relaxed text-ink-950/70 sm:text-base">
            Walk in, meet a coach, train. No pressure sales — just a proper
            assessment and a plan you can keep.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="lg:justify-self-end">
          <div className="flex flex-col gap-4 sm:items-end">
            <div className="flex flex-wrap gap-3">
              <a href={SITE.phoneHref} className="btn group bg-ink-950 px-7 py-3.5 text-volt-300 hover:bg-ink-800">
                <Phone className="h-4 w-4" />
                {SITE.phone}
              </a>
              <a
                href={SITE.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn group border border-ink-950/30 px-7 py-3.5 text-ink-950 hover:bg-ink-950/10"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp us
              </a>
            </div>

            <a
              href={SITE.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-950/80 transition hover:text-ink-950"
            >
              <MapPin className="h-4 w-4" />
              {SITE.address.line1} · {SITE.address.line3}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <SocialRow className="mt-2 [&_a]:border-ink-950/25 [&_a]:text-ink-950/70 [&_a:hover]:border-ink-950/60 [&_a:hover]:bg-ink-950/10 [&_a:hover]:text-ink-950" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
