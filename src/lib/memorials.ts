import { lunarToSolar, jd, todayParts } from './lunar';
export interface Memorial {
  id: string;
  name: string;
  relation: string;
  side: 'noi' | 'ngoai';
  lunarDay: number;
  lunarMonth: number;
  isLeapMonth: boolean;
  leapPolicy?: 'regular' | 'preferLeap';
  deathYear?: number;
  note?: string;
}
export function memorialDate(
  m: Pick<Memorial, 'lunarDay' | 'lunarMonth' | 'isLeapMonth' | 'leapPolicy'>,
  year: number,
) {
  let leap = m.isLeapMonth && m.leapPolicy === 'preferLeap',
    fallback = false;
  if (leap && !lunarToSolar(1, m.lunarMonth, year, true)) {
    leap = false;
    fallback = true;
  }
  let date = lunarToSolar(m.lunarDay, m.lunarMonth, year, leap),
    adjusted = false;
  if (!date && m.lunarDay === 30) {
    date = lunarToSolar(29, m.lunarMonth, year, leap);
    adjusted = true;
  }
  return { date, adjusted, fallback };
}
export function nextMemorial(m: Memorial, today = todayParts()) {
  const current = jd(...today);
  for (let year = today[2] - 1; year <= today[2] + 2; year++) {
    const result = memorialDate(m, year);
    if (result.date && jd(...result.date) >= current)
      return { ...result, remaining: jd(...result.date) - current, year };
  }
  return null;
}
