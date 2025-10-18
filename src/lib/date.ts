import { format, isValid, parse, parseISO } from "date-fns";

type FormatOptions = Parameters<typeof format>[2];

/**
 * Parses application date strings while preserving the intended calendar day.
 * Supports both raw "yyyy-MM-dd" values (from date inputs) and ISO strings.
 */
export function parseAppDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const date = trimmed.includes("T")
    ? parseISO(trimmed)
    : parse(trimmed, "yyyy-MM-dd", new Date());

  return isValid(date) ? date : null;
}

/**
 * Formats an application date string using date-fns while gracefully handling invalid input.
 */
export function formatAppDate(
  value: string | null | undefined,
  formatStr: string,
  options?: FormatOptions,
  fallback = "—",
): string {
  try {
    const parsed = parseAppDate(value);
    if (!parsed) return fallback;
    return format(parsed, formatStr, options);
  } catch {
    return fallback;
  }
}

/**
 * Returns the weekday index (0-6) for an application date string.
 */
export function getAppWeekday(value: string | null | undefined): number | null {
  const parsed = parseAppDate(value);
  return parsed ? parsed.getDay() : null;
}

/**
 * Converts a Date instance into the canonical storage format ("yyyy-MM-dd").
 */
export function toAppDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
