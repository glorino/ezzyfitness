"use client";

import { cn } from "@/lib/format";
import type { ComponentType, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/* ------------------------------- Labels ------------------------------- */

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-ember">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-smoke-500">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------- Inputs ------------------------------- */

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      className={cn("field", invalid && "border-ember/60", className)}
      {...props}
    />
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn("field min-h-[110px] resize-y", invalid && "border-ember/60", className)}
      {...props}
    />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select className={cn("field appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  );
}

/** Wrap a Select with a chevron. */
export function SelectField(props: SelectProps & { label?: string }) {
  const { label, className, ...rest } = props;
  return (
    <Field label={label}>
      <div className="relative">
        <Select className={className} {...rest} />
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-smoke-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </Field>
  );
}

/* ------------------------------ Buttons ------------------------------- */

export function Button({
  children,
  variant = "volt",
  size = "md",
  loading,
  className,
  icon: Icon,
  ...props
}: {
  children: ReactNode;
  variant?: "volt" | "ghost" | "dark" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
  icon?: ComponentType<{ className?: string }>;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    volt: "btn-volt",
    ghost: "btn-ghost",
    dark: "btn-dark",
    danger:
      "btn border border-ember/40 bg-ember/12 text-ember hover:bg-ember/20",
  };
  return (
    <button
      className={cn(
        variants[variant],
        size === "sm" && "btn-sm",
        loading && "pointer-events-none",
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {!loading && Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

/* ------------------------------ Spinner ------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------------------------- Empty state ----------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {Icon && (
        <div className="mb-1 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-volt-300">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h4 className="text-lg text-smoke-200">{title}</h4>
      {description && (
        <p className="max-w-md text-sm text-smoke-500">{description}</p>
      )}
      {action}
    </div>
  );
}
