"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/format";
import { Unsplash } from "@/components/ui/MediaImage";

const HERO_IMAGES = [
  "photo-1534438327276-14e5300c3a48",
  "photo-1531568054145-a8981587ffff",
  "photo-1517666872524-223386b8fb18",
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const total = HERO_IMAGES.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [total, setIndex]);

  return (
    <div className="relative h-80 md:h-96 lg:h-[600px] overflow-hidden rounded-2xl bg-ink-950/80">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950/80 via-ink-900/90 to-ink-950/80" />
      {/* Slide content cards */}
      {HERO_IMAGES.map((img, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 opacity-",
            index === i ? "100" : "0",
            "transition-opacity duration-1000 ease-out flex items-center justify-center"
          )}
        >
          <div className="max-w-2xl mx-auto text-center px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              {["Strength", "Cardio", "Wellness"][i]}
            </h2>
            <p className="mt-4 text-lg text-white/80">
              {["Transform your body", "Boost your energy", "Find your balance"][i]}
            </p>
            <Unsplash
              id={img}
              alt={["Strength training", "Cardio workout", "Wellness session"][i]}
              className="h-[280px] w-full rounded-[1.6rem] sm:h-[360px] lg:h-[440px]"
            />
          </div>
        </div>
      ))}
      {/* Pagination dots */}
      <div
        className="absolute bottom-6 left-6 right-6 flex justify-center gap-2"
      >
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            className={cn(
              "rounded-full border-white/20 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
              index === i
                ? "bg-white text-ink-950"
                : "text-white hover:bg-white/20"
            )}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}