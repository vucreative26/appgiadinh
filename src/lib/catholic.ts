import { jd, fromJD } from './lunar';
export function easter(y: number): [number, number, number] {
  const a = y % 19,
    b = Math.floor(y / 100),
    c = y % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451),
    n = h + l - 7 * m + 114;
  return [(n % 31) + 1, Math.floor(n / 31), y];
}
export function advent(y: number) {
  const christmas = jd(25, 12, y),
    weekday = (christmas + 1) % 7;
  return christmas - (weekday || 7) - 21;
}
export function catholicInfo(d: number, m: number, y: number) {
  const j = jd(d, m, y),
    e = jd(...easter(y)),
    a = advent(y),
    weekday = (j + 1) % 7;
  const events: Record<number, string> = {
    [e - 46]: 'Thứ Tư Lễ Tro',
    [e - 7]: 'Chúa nhật Lễ Lá',
    [e - 3]: 'Thứ Năm Tuần Thánh',
    [e - 2]: 'Thứ Sáu Tuần Thánh',
    [e - 1]: 'Thứ Bảy Tuần Thánh',
    [e]: 'Chúa nhật Phục Sinh',
    [e + 39]: 'Lễ Thăng Thiên · mốc truyền thống',
    [e + 49]: 'Chúa nhật Hiện Xuống',
    [e + 56]: 'Chúa nhật Chúa Ba Ngôi',
    [a]: 'Chúa nhật I Mùa Vọng',
  };
  let season = 'Mùa Thường Niên';
  // Lễ Chúa chịu phép rửa: Chúa nhật sau Hiển Linh cố định 6/1.
  const ep = jd(6, 1, y),
    baptism = ep + (7 - ((ep + 1) % 7));
  if (j >= a && j < jd(25, 12, y)) season = 'Mùa Vọng';
  else if (j >= jd(25, 12, y) || j <= baptism) season = 'Mùa Giáng Sinh';
  else if (j >= e - 46 && j < e - 3) season = 'Mùa Chay';
  else if (j >= e - 3 && j < e) season = 'Tam Nhật Vượt Qua';
  else if (j >= e && j <= e + 49) season = 'Mùa Phục Sinh';
  const liturgicalYear = j >= a ? y + 1 : y;
  return {
    season,
    event: events[j] || '',
    sundayCycle: ['C', 'A', 'B'][liturgicalYear % 3],
    weekdayCycle: y % 2 ? 'I' : 'II',
    sunday: weekday === 0,
    date: fromJD(j),
  };
}
