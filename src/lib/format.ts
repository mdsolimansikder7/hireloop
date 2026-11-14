/**
 * Formatting helpers for the /jobs browse experience.
 */

/** 1248 -> "1.2k", 432 -> "432" */
export function formatCompactCount(value: number): string {
  if (value >= 1000) {
    const scaled = value / 1000;
    const rounded =
      scaled >= 10 ? Math.round(scaled) : Math.round(scaled * 10) / 10;
    return `${rounded}k`;
  }
  return String(value);
}

/**
 * Salary range for a job card chip:
 * - both min & max  -> "$140k - $180k"
 * - single value    -> "$140k+"
 * - none            -> null (chip omitted)
 */
export function formatSalaryValue(
  min?: number | null,
  max?: number | null,
): string | null {
  const formatK = (v: number) => `${Math.round(v / 1000)}k`;
  const hasMin = min != null && !Number.isNaN(min);
  const hasMax = max != null && !Number.isNaN(max);

  if (hasMin && hasMax) return `$${formatK(min)} - $${formatK(max)}`;
  if (hasMin) return `$${formatK(min)}+`;
  if (hasMax) return `$${formatK(max)}+`;
  return null;
}

/** 1248 -> "1,248" (used for the "Found N" total). */
export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}
