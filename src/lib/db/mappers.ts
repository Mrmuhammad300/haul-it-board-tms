import type { Quote as QuoteRow, Dispatch as DispatchRow } from "@/generated/prisma";
import type { QuoteInputs, QuoteResult } from "@/lib/calc";

/** Prisma stores `inputs`/`result` as JSON columns (see roadmap: kept
 * unnormalized deliberately). This casts them back to their known shape at
 * the read boundary rather than sprinkling `as unknown as` across pages. */
export interface TypedQuote extends Omit<QuoteRow, "inputs" | "result"> {
  inputs: QuoteInputs;
  result: QuoteResult;
}

export function toTypedQuote(row: QuoteRow): TypedQuote {
  return {
    ...row,
    inputs: row.inputs as unknown as QuoteInputs,
    result: row.result as unknown as QuoteResult,
  };
}

export type { DispatchRow };
