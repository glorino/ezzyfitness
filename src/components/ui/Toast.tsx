"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<{
  push: (kind: ToastKind, message: string) => void;
}>({ push: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  const icons = {
    success: CheckCircle2,
    error: AlertTriangle,
    info: Info,
  };
  const tones = {
    success: "border-volt-300/40 text-volt-300",
    error: "border-ember/50 text-ember",
    info: "border-cyanx/40 text-cyanx",
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const Icon = icons[t.kind];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={cnToast(t.kind)}
              >
                <Icon className={`h-5 w-5 shrink-0 ${tones[t.kind]}`} />
                <p className="flex-1 text-sm text-smoke-100">{t.message}</p>
                <button
                  onClick={() =>
                    setItems((prev) => prev.filter((x) => x.id !== t.id))
                  }
                  aria-label="Dismiss"
                  className="text-smoke-500 transition hover:text-smoke-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function cnToast(kind: ToastKind) {
  const base =
    "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-ink-850/95 px-4 py-3.5 shadow-card backdrop-blur";
  const map = {
    success: "border-volt-300/30",
    error: "border-ember/40",
    info: "border-cyanx/30",
  };
  return `${base} ${map[kind]}`;
}
