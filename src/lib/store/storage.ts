"use client";

import type { QuoteInputs, QuoteResult } from "@/lib/calc";

export interface SavedQuote {
  id: string;
  createdAt: string;
  inputs: QuoteInputs;
  result: QuoteResult;
}

export interface DispatchOrder {
  id: string;
  quoteId: string;
  driver: string;
  truck: string;
  startTime: string;
  customerContact: string;
  specialInstructions: string;
  createdAt: string;
}

const QUOTES_KEY = "dm-logistics.quotes";
const DISPATCHES_KEY = "dm-logistics.dispatches";

// Quotes/dispatches live in localStorage. useSyncExternalStore requires
// getSnapshot to return a referentially stable value when nothing has
// changed, so reads are cached until a write invalidates + notifies.
let quotesCache: SavedQuote[] | null = null;
let dispatchesCache: DispatchOrder[] | null = null;
const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function invalidate(): void {
  quotesCache = null;
  dispatchesCache = null;
  listeners.forEach((listener) => listener());
}

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

function quotesSnapshot(): SavedQuote[] {
  if (quotesCache === null) {
    quotesCache = readList<SavedQuote>(QUOTES_KEY).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }
  return quotesCache;
}

function dispatchesSnapshot(): DispatchOrder[] {
  if (dispatchesCache === null) {
    dispatchesCache = readList<DispatchOrder>(DISPATCHES_KEY);
  }
  return dispatchesCache;
}

export function listQuotes(): SavedQuote[] {
  return quotesSnapshot();
}

export function getQuote(id: string): SavedQuote | undefined {
  return quotesSnapshot().find((q) => q.id === id);
}

export function saveQuote(inputs: QuoteInputs, result: QuoteResult): SavedQuote {
  const quote: SavedQuote = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    inputs,
    result,
  };
  const quotes = readList<SavedQuote>(QUOTES_KEY);
  quotes.push(quote);
  writeList(QUOTES_KEY, quotes);
  invalidate();
  return quote;
}

export function listDispatches(): DispatchOrder[] {
  return dispatchesSnapshot();
}

export function getDispatchByQuoteId(quoteId: string): DispatchOrder | undefined {
  return dispatchesSnapshot().find((d) => d.quoteId === quoteId);
}

export function saveDispatch(
  dispatch: Omit<DispatchOrder, "id" | "createdAt">
): DispatchOrder {
  const record: DispatchOrder = {
    ...dispatch,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const dispatches = readList<DispatchOrder>(DISPATCHES_KEY).filter(
    (d) => d.quoteId !== dispatch.quoteId
  );
  dispatches.push(record);
  writeList(DISPATCHES_KEY, dispatches);
  invalidate();
  return record;
}
