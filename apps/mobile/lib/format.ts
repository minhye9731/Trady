export function formatNumber(value: number | null | undefined, maxDigits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('en-US', { maximumFractionDigits: maxDigits });
}

export function formatCompact(value: number) {
  if (Math.abs(value) >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)}M`;
  if (Math.abs(value) >= 10_000) return `${formatNumber(value / 1_000, 1)}K`;
  return formatNumber(value);
}

export function formatDate(iso: string, withYear = false) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Parses a numeric text field; empty input becomes null. */
export function parseOptionalNumber(text: string): number | null {
  const trimmed = text.replace(/,/g, '').trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
