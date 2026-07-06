"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {description && (
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function labelClasses() {
  return "flex flex-col gap-1 text-sm";
}

function inputClasses() {
  return "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50";
}

export function TextField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <label className={labelClasses()}>
      <span className="text-zinc-600 dark:text-zinc-400">
        {label}
        {suffix ? <span className="text-zinc-400"> ({suffix})</span> : null}
      </span>
      <input
        type="text"
        className={inputClasses()}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  step,
  min,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
}) {
  return (
    <label className={labelClasses()}>
      <span className="text-zinc-600 dark:text-zinc-400">
        {label}
        {suffix ? <span className="text-zinc-400"> ({suffix})</span> : null}
      </span>
      <input
        type="number"
        className={inputClasses()}
        value={Number.isFinite(value) ? value : ""}
        step={step ?? "any"}
        min={min}
        onChange={(e) => onChange(e.target.valueAsNumber)}
      />
    </label>
  );
}

/** A small "pull live data" action for a field group - e.g. "Refresh from
 * EIA". Calls onFetch, which should throw with a user-facing message on
 * failure; success/failure is reported inline rather than blocking the form. */
export function RefreshButton({
  label,
  onFetch,
}: {
  label: string;
  onFetch: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await onFetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="col-span-full flex flex-wrap items-center gap-2 text-xs">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-md border border-zinc-300 px-2.5 py-1 font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {loading ? "Fetching..." : label}
      </button>
      {error && <span className="text-amber-600 dark:text-amber-400">{error}</span>}
    </div>
  );
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={labelClasses()}>
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
      <input
        type="date"
        className={inputClasses()}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
