import { lunarToSolar, jd, fromJD, todayParts } from './lunar';
export interface Memorial {
  id: string;
  kind?: 'memorial' | 'birthday' | 'anniversary' | 'other';
  calendar?: 'lunar' | 'solar';
  repeat?: 'yearly' | 'monthly' | 'once';
  family?: 'wife' | 'husband' | 'shared' | 'unspecified';
  branch?: 'noi' | 'ngoai' | 'chung';
  eventYear?: number;
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

export const eventKinds = {
  memorial: 'Ngày giỗ',
  birthday: 'Sinh nhật',
  anniversary: 'Kỷ niệm',
  other: 'Ngày đáng nhớ',
};
export const familyNames = {
  wife: 'Bên vợ',
  husband: 'Bên chồng',
  shared: 'Gia đình chung',
  unspecified: 'Chưa phân bên vợ/chồng',
};
export function familyLabel(m: Memorial) {
  const family = m.family || 'unspecified',
    branch = m.branch || m.side;
  return family === 'shared'
    ? familyNames.shared
    : familyNames[family] + (branch === 'chung' ? '' : branch === 'noi' ? ' · Nội' : ' · Ngoại');
}
export function eventTitle(m: Memorial) {
  return eventKinds[m.kind || 'memorial'] + ' · ' + m.name;
}
export function eventDateLabel(m: Memorial) {
  return (
    (m.repeat === 'monthly'
      ? 'Ngày ' + m.lunarDay + ' mỗi tháng'
      : m.lunarDay + '/' + m.lunarMonth + (m.repeat === 'once' ? '/' + m.eventYear : '')) +
    (m.isLeapMonth && m.calendar !== 'solar' && m.repeat !== 'monthly' ? ' nhuận' : '') +
    (m.calendar === 'solar' ? ' dương lịch' : ' âm lịch')
  );
}
export function validateEvent(m: Omit<Memorial, 'id'>) {
  if (
    !Object.hasOwn(eventKinds, m.kind || 'memorial') ||
    !Object.hasOwn(familyNames, m.family || 'unspecified') ||
    !['solar', 'lunar'].includes(m.calendar || 'lunar') ||
    !['yearly', 'monthly', 'once'].includes(m.repeat || 'yearly') ||
    !['noi', 'ngoai', 'chung'].includes(m.branch || m.side)
  )
    throw Error('Phân loại ngày không hợp lệ.');
  if (
    !m.name.trim() ||
    m.name.length > 100 ||
    m.relation.length > 100 ||
    (m.note?.length || 0) > 2000
  )
    throw Error('Kiểm tra tên, quan hệ và ghi chú.');
  if (
    !Number.isInteger(m.lunarDay) ||
    !Number.isInteger(m.lunarMonth) ||
    m.lunarMonth < 1 ||
    m.lunarMonth > 12 ||
    m.lunarDay < 1 ||
    m.lunarDay > (m.calendar === 'solar' ? 31 : 30)
  )
    throw Error('Ngày hoặc tháng không hợp lệ.');
  if (
    m.repeat === 'once' &&
    (!Number.isInteger(m.eventYear) || m.eventYear! < 1900 || m.eventYear! > 2100)
  )
    throw Error('Chọn năm từ 1900 đến 2100.');
  if (
    m.calendar === 'solar' &&
    m.repeat !== 'monthly' &&
    m.lunarDay > new Date(m.repeat === 'once' ? m.eventYear! : 2000, m.lunarMonth, 0).getDate()
  )
    throw Error('Tháng này không có ngày đã chọn.');
  if (
    m.calendar !== 'solar' &&
    m.repeat === 'once' &&
    !lunarToSolar(m.lunarDay, m.lunarMonth, m.eventYear!, m.isLeapMonth)
  )
    throw Error('Ngày âm/tháng nhuận này không tồn tại trong năm đã chọn.');
}
type DateParts = [number, number, number];
export function eventOccurrences(m: Memorial, from: DateParts, to: DateParts) {
  const start = jd(...from),
    end = jd(...to);
  const results: { date: DateParts; adjusted: boolean; fallback: boolean; year: number }[] = [];
  const monthly = m.repeat === 'monthly',
    once = m.repeat === 'once';
  for (let year = Math.max(1900, from[2] - 1); year <= Math.min(2100, to[2]); year++) {
    if (once && year !== m.eventYear) continue;
    for (const month of monthly ? Array.from({ length: 12 }, (_, i) => i + 1) : [m.lunarMonth]) {
      if (m.calendar === 'solar') {
        const last = new Date(year, month, 0).getDate(),
          day = Math.min(m.lunarDay, last);
        results.push({
          date: [day, month, year],
          adjusted: day !== m.lunarDay,
          fallback: false,
          year,
        });
      } else if (once) {
        const date = lunarToSolar(m.lunarDay, month, year, m.isLeapMonth);
        if (date) results.push({ date, adjusted: false, fallback: false, year });
      } else if (monthly) {
        for (const leap of [false, true]) {
          if (!lunarToSolar(1, month, year, leap)) continue;
          const date =
            lunarToSolar(m.lunarDay, month, year, leap) || lunarToSolar(29, month, year, leap);
          if (date)
            results.push({
              date,
              adjusted: !lunarToSolar(m.lunarDay, month, year, leap),
              fallback: false,
              year,
            });
        }
      } else {
        const r = memorialDate(m, year);
        if (r.date) results.push({ ...r, date: r.date, year });
      }
    }
  }
  return results
    .filter((r) => jd(...r.date) >= start && jd(...r.date) <= end)
    .sort((a, b) => jd(...a.date) - jd(...b.date));
}
export function nextMemorial(m: Memorial, today = todayParts()) {
  const current = jd(...today),
    end =
      m.repeat === 'once' && m.eventYear
        ? jd(31, 12, Math.min(2100, m.eventYear + 1))
        : current + 800,
    result = eventOccurrences(m, today, fromJD(Math.min(jd(31, 12, 2100), end)))[0];
  return result ? { ...result, remaining: jd(...result.date) - current } : null;
}
