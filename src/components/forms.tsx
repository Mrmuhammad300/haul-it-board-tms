"use client";

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
