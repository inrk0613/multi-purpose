// Date helpers without external libs (timezone-safe for date-only strings)

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateOnly(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseDueToMs(due: string): number {
  // "YYYY-MM-DD" => local end-of-day 23:59
  // "YYYY-MM-DDTHH:mm" => local time
  if (due.includes("T")) {
    const ms = new Date(due).getTime();
    return Number.isFinite(ms) ? ms : NaN;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(due);
  if (!m) return NaN;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  return new Date(y, mo, da, 23, 59, 0, 0).getTime();
}

export function startOfWeekMonday(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday=0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export function addDays(d: Date, days: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

export function formatShortDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function msToHuman(ms: number): string {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function etaToHuman(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
