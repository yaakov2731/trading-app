/**
 * lib/utils/dates.ts
 * Date formatting utilities for Argentine locale.
 */

const AR_LOCALE = 'es-AR'
const AR_TZ = 'America/Argentina/Buenos_Aires'

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatDate(
  value: string | Date | null | undefined,
  opts: { includeTime?: boolean; relative?: boolean } = {}
): string {
  if (!value) return '—'

  const d = typeof value === 'string' ? new Date(value) : value
  if (isNaN(d.getTime())) return '—'

  if (opts.relative) {
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `Hace ${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Hace ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Hace ${days}d`
  }

  const dateOpts: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: AR_TZ,
  }

  if (opts.includeTime) {
    dateOpts.hour = '2-digit'
    dateOpts.minute = '2-digit'
  }

  return new Intl.DateTimeFormat(AR_LOCALE, dateOpts).format(d)
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(AR_LOCALE, {
    hour: '2-digit', minute: '2-digit', timeZone: AR_TZ
  }).format(d)
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, { includeTime: true })
}

// ── ISO helpers ───────────────────────────────────────────────────────────────

export function toISODate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toISOString().slice(0, 10)
}

export function todayISO(): string {
  return toISODate(new Date())
}

// ── Range helpers ─────────────────────────────────────────────────────────────

export function startOfDayISO(date?: Date): string {
  const d = date ?? new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function endOfDayISO(date?: Date): string {
  const d = date ?? new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export function last30DaysRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { from: toISODate(from), to: toISODate(to) }
}
