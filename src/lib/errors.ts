import { PostgrestError } from "@supabase/supabase-js";
import { toast } from "sonner";

/** Postgres / PostgREST codes mapped to copy a shopper can act on. */
const CODE_MESSAGES: Record<string, string> = {
  "23505": "That already exists.",
  "23503": "That item is no longer available.",
  "23514": "Some of those values aren't allowed.",
  "42501": "You don't have permission to do that.",
  PGRST301: "Your session expired. Please sign in again.",
  PGRST116: "We couldn't find what you were looking for.",
};

const NETWORK_HINTS = ["failed to fetch", "networkerror", "load failed", "timeout"];

export type AppError = { message: string; code?: string; retryable: boolean };

function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === "object" && error !== null && "message" in error && "code" in error;
}

/**
 * Normalises anything thrown by Supabase, fetch or app code into a
 * user-friendly, non-leaky message. Database RAISE EXCEPTION messages are
 * written for shoppers, so they pass through verbatim.
 */
export function toAppError(error: unknown): AppError {
  if (typeof error === "string") return { message: error, retryable: false };

  if (isPostgrestError(error)) {
    const mapped = error.code ? CODE_MESSAGES[error.code] : undefined;
    // `P0001` is RAISE EXCEPTION from our own RPCs — those messages are curated.
    if (error.code === "P0001" || !mapped) {
      return { message: cleanup(error.message), code: error.code, retryable: false };
    }
    return { message: mapped, code: error.code, retryable: false };
  }

  if (error instanceof Error) {
    const lower = error.message.toLowerCase();
    if (NETWORK_HINTS.some((hint) => lower.includes(hint))) {
      return { message: "Network hiccup — check your connection and try again.", retryable: true };
    }
    return { message: cleanup(error.message), retryable: false };
  }

  return { message: "Something went wrong. Please try again.", retryable: true };
}

function cleanup(message: string): string {
  const trimmed = message.replace(/^(error:|postgrest error:)\s*/i, "").trim();
  if (!trimmed) return "Something went wrong. Please try again.";
  // Never surface internals such as SQL, table names or stack noise.
  if (/select |insert into|relation "|violates |syntax error/i.test(trimmed)) {
    return "We couldn't complete that. Please try again.";
  }
  return trimmed.length > 220 ? `${trimmed.slice(0, 217)}…` : trimmed;
}

/** Standard mutation `onError` handler: one toast, friendly copy. */
export function notifyError(error: unknown, fallback?: string): void {
  const { message, retryable } = toAppError(error);
  toast.error(fallback && message === "Something went wrong. Please try again." ? fallback : message, {
    description: retryable ? "You can retry in a moment." : undefined,
  });
}

/** Shared TanStack Query retry policy — never retry auth/permission failures. */
export function retryPolicy(failureCount: number, error: unknown): boolean {
  const { retryable, code } = toAppError(error);
  if (code === "42501" || code === "PGRST301" || code === "P0001") return false;
  return retryable && failureCount < 2;
}
