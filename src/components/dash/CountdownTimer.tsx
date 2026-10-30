"use client";

import { useState, useEffect, useRef } from "react";

interface CountdownProps {
  expiresAt: string;
}

export function CountdownTimer({ expiresAt }: CountdownProps) {
  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const updateTime = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const minutes = Math.floor ((diff % 3_600_000) / 60_000);
      const seconds = Math.floor ((diff % 60_000) / 1_000);

      setTime({ days, hours, minutes, seconds });
    };

    updateTime();
    const interval = setInterval(updateTime, 1_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-14 h-14 rounded-2xl bg-ink-950/80 border border-white/10 flex items-center justify-center">
          <span className="text-2xl font-bold text-volt-300">{time.days}</span>
        </div>
        <span className="text-sm text-smoke-400">Days</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-14 h-14 rounded-2xl bg-ink-950/80 border border-white/10 flex items-center justify-center">
          <span className="text-2xl font-bold text-volt-300">{time.hours}</span>
        </div>
        <span className="text-sm text-smoke-400">Hrs</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-14 h-14 rounded-2xl bg-ink-950/80 border border-white/10 flex items-center justify-center">
          <span className="text-2xl font-bold text-volt-300">{time.minutes}</span>
        </div>
        <span className="text-sm text-smoke-400">Min</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-14 h-14 rounded-2xl bg-ink-950/80 border border-white/10 flex items-center justify-center">
          <span className="text-2xl font-bold text-volt-300">{time.seconds}</span>
        </div>
        <span className="text-sm text-smoke-400">Sec</span>
      </div>
    </div>
  );
}