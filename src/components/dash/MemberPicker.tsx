"use client";

import { ChevronDown, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { cn, formatDate } from "@/lib/format";

export interface MemberOption {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_media_id: number | null;
  membership_no: string;
  status: string;
  expires_at: string | null;
  checked_in_today: boolean;
}

/**
 * Searchable member combobox backed by GET /api/members?q=.
 * Used at the check-in desk, payment form and attendance sheets.
 */
export function MemberPicker({
  value,
  onChange,
  placeholder = "Search name, phone, email or member no…",
  autoFocus,
  disabled,
  className,
}: {
  value: MemberOption | null;
  onChange: (m: MemberOption | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/members?q=${encodeURIComponent(q)}&limit=8`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (alive) setRows(data?.rows ?? []);
      } catch {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, open]);

  return (
    <div ref={wrap} className={cn("relative", className)}>
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-volt-300/35 bg-volt-300/8 px-3.5 py-2.5">
          <Avatar name={value.full_name} mediaId={value.avatar_media_id} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-smoke-100">{value.full_name}</p>
            <p className="truncate text-xs text-smoke-500">
              {value.membership_no} · {value.status}
              {value.expires_at && ` · expires ${formatDate(value.expires_at)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQ("");
              setOpen(true);
            }}
            className="text-xs font-semibold text-smoke-400 transition hover:text-volt-300"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-smoke-500" />
          <input
            value={q}
            autoFocus={autoFocus}
            disabled={disabled}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            aria-label="Search members"
            className="field h-11 w-full pl-10 pr-10"
          />
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-smoke-500" />
        </div>
      )}

      {open && !value && (
        <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-2xl border border-white/12 bg-ink-900 shadow-card">
          {loading && rows.length === 0 ? (
            <div className="flex items-center gap-2.5 px-4 py-3.5 text-sm text-smoke-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching members…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-3.5 text-sm text-smoke-500">
              No members match “{q}”. Try a phone number or member number.
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1.5">
              {rows.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(m);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-white/5"
                  >
                    <Avatar name={m.full_name} mediaId={m.avatar_media_id} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-smoke-100">{m.full_name}</p>
                      <p className="truncate text-xs text-smoke-500">
                        {m.membership_no} · {m.phone || m.email}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        m.status === "active"
                          ? "border-volt-300/30 bg-volt-300/10 text-volt-300"
                          : "border-ember/30 bg-ember/10 text-ember"
                      )}
                    >
                      {m.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
