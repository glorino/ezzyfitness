"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/format";

/**
 * Modal / side-drawer built on AnimatePresence.
 * Locks body scroll, closes on Escape and backdrop click.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  side = "center",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  side?: "center" | "right";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const sizes = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden border border-white/10 bg-ink-900 shadow-card",
              sizes[size],
              side === "right"
                ? "ml-auto mr-0 h-full max-h-none rounded-none sm:max-w-md"
                : "rounded-t-3xl sm:rounded-3xl"
            )}
            initial={
              side === "right"
                ? { x: "100%", opacity: 1 }
                : { y: 40, opacity: 0, scale: 0.97 }
            }
            animate={
              side === "right"
                ? { x: 0, opacity: 1 }
                : { y: 0, opacity: 1, scale: 1 }
            }
            exit={
              side === "right"
                ? { x: "100%", opacity: 1 }
                : { y: 30, opacity: 0, scale: 0.98 }
            }
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between gap-4 border-b border-white/8 px-6 py-5">
                <div>
                  {title && (
                    <h3 className="text-xl text-smoke-100">{title}</h3>
                  )}
                  {subtitle && (
                    <p className="mt-1 text-sm text-smoke-500">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-smoke-400 transition hover:border-volt-300/50 hover:text-volt-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-white/8 bg-ink-950/60 px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
