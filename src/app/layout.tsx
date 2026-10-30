import type { Metadata, Viewport } from "next";
import "@fontsource/anton/400.css";
import "@fontsource-variable/inter";
import "./globals.css";
import { SITE } from "@/lib/site";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  metadataBase: new URL("https://ezzyfitness.ng"),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "Ezzy Fitness is Benin City's premium training destination at Ezra Mall — strength, conditioning, group classes, boxing and personal coaching for every level.",
  keywords: [
    "gym in Benin City",
    "fitness centre Edo State",
    "Ezzy Fitness",
    "personal trainer Benin City",
    "group classes Benin City",
    "Ezra Mall gym",
  ],
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description:
      "Strength. Conditioning. Community. Train at Ezra Mall, Ugbor Village Area, Benin City.",
    images: [{ url: "/logo.jpeg", alt: SITE.name }],
    type: "website",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: "Benin City's premium training destination.",
    images: ["/logo.jpeg"],
  },
  icons: { icon: "/favicon.jpeg", apple: "/favicon.jpeg" },
};

export const viewport: Viewport = {
  themeColor: "#070807",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-ink-950">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
