"use client";

import { Loader2, RefreshCw, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import { callApi } from "@/lib/client";
import { cn } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* URL-backed search & filters (server renders the results)            */
/* ------------------------------------------------------------------ */

function useUrlParam() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return { params, setParam };
}

export function SearchField({
  placeholder = "Search...",
  param = "q",
  defaultValue = "",
  className,
}: {
  placeholder?: string;
  param?: string;
  defaultValue?: string;
  className?: string;
}) {
  const { params, setParam } = useUrlParam();
  const [value, setValue] = useState(params.get(param) ?? defaultValue);

  useEffect(() => {
    setValue(params.get(param) ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    const current = params.get(param) ?? "";
    if (value === current) return;
    const t = setTimeout(() => setParam(param, value.trim() || null), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-smoke-500" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="field h-10 w-full min-w-[180px] pl-10 pr-9 sm:w-72"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-smoke-500 hover:text-smoke-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function FilterSelect({
  param,
  options,
  defaultValue = "all",
  ariaLabel,
}: {
  param: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  ariaLabel: string;
}) {
  const { params, setParam } = useUrlParam();
  const current = params.get(param) ?? defaultValue;

  return (
    <select
      value={current}
      onChange={(e) => setParam(param, e.target.value === defaultValue ? null : e.target.value)}
      aria-label={ariaLabel}
      className="field h-10 w-full appearance-none pr-8 text-sm sm:w-48"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export function MutationButton({
  endpoint,
  method = "POST",
  body,
  confirmText,
  successMessage = "Saved.",
  children,
  icon: Icon,
  variant = "ghost",
  size = "md",
  className,
  onDone,
}: {
  endpoint: string;
  method?: "POST" | "PATCH" | "DELETE";
  body?: unknown;
  confirmText?: string;
  successMessage?: string;
  children?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "volt" | "ghost" | "danger" | "quiet";
  size?: "sm" | "md";
  className?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  const variants = {
    volt: "btn-volt",
    ghost: "btn-ghost",
    danger:
      "inline-flex items-center gap-1.5 rounded-lg border border-ember/40 bg-ember/10 px-3 py-1.5 text-xs font-semibold text-ember transition hover:bg-ember/20",
    quiet:
      "inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-smoke-300 transition hover:border-volt-300/50 hover:text-volt-300",
  };

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    try {
      await callApi(endpoint, method, body);
      if (successMessage) push("success", successMessage);
      onDone?.();
      router.refresh();
    } catch (err) {
      push("error", err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      className={cn(
        variants[variant],
        size === "sm" && variant !== "danger" && variant !== "quiet" && "btn-sm",
        busy && "pointer-events-none opacity-70",
        className
      )}
      type="button"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
      {children}
    </button>
  );
}

/** Re-run the current route's server component (fresh data, no navigation). */
export function RefreshButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        setBusy(true);
        router.refresh();
        setTimeout(() => setBusy(false), 700);
      }}
      className={cn("btn-ghost btn-sm", className)}
      aria-label="Refresh data"
    >
      <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
      Refresh
    </button>
  );
}
