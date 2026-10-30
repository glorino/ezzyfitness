import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette — deep "iron" blacks with an electric volt accent
        ink: {
          950: "#070807",
          900: "#0B0D0B",
          850: "#101310",
          800: "#151915",
          700: "#1D231D",
          600: "#2A322A",
        },
        volt: {
          DEFAULT: "#D6FF3F",
          50: "#F7FFE0",
          100: "#EEFFBE",
          200: "#E1FF8A",
          300: "#D6FF3F",
          400: "#C2F000",
          500: "#A6D100",
          600: "#83A600",
        },
        smoke: {
          100: "#F4F6F2",
          200: "#E4E8E1",
          300: "#C7CDC3",
          400: "#9AA297",
          500: "#6E766B",
          600: "#4B524A",
        },
        ember: "#FF5A3C",
        cyanx: "#4FE3FF",
      },
      fontFamily: {
        display: ["'Anton'", "Impact", "sans-serif"],
        sans: ["'Inter Variable'", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.045em",
        wider2: "0.18em",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(214,255,63,0.25), 0 18px 60px -18px rgba(214,255,63,0.45)",
        card: "0 24px 60px -30px rgba(0,0,0,0.9)",
        volt: "0 10px 40px -12px rgba(214,255,63,0.55)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 50% 0%, rgba(214,255,63,0.10), transparent 55%)",
        "hero-glow":
          "radial-gradient(60% 55% at 78% 18%, rgba(214,255,63,0.18), transparent 60%), radial-gradient(45% 45% at 10% 90%, rgba(79,227,255,0.10), transparent 65%)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "80%,100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        floaty: "floaty 6s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        pulseRing: "pulseRing 2.4s cubic-bezier(0.2,0.6,0.4,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
