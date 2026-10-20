// Thuật toán thiên văn lịch Việt Nam của Hồ Ngọc Đức, múi giờ UTC+7.
// Tham khảo: https://www.informatik.uni-leipzig.de/~duc/amlich/calrules.html
const PI = Math.PI,
  floor = Math.floor,
  TZ = 7;
export const stems = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const branches = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
];
export const mod = (n: number, m: number) => ((n % m) + m) % m;
export function jd(d: number, m: number, y: number) {
  const a = floor((14 - m) / 12),
    yy = y + 4800 - a,
    mm = m + 12 * a - 3;
  let j =
    d +
    floor((153 * mm + 2) / 5) +
    365 * yy +
    floor(yy / 4) -
    floor(yy / 100) +
    floor(yy / 400) -
    32045;
  if (j < 2299161) j = d + floor((153 * mm + 2) / 5) + 365 * yy + floor(yy / 4) - 32083;
  return j;
}
export function fromJD(j: number): [number, number, number] {
  let b: number, c: number;
  if (j > 2299160) {
    const a = j + 32044;
    b = floor((4 * a + 3) / 146097);
    c = a - floor((b * 146097) / 4);
  } else {
    b = 0;
    c = j + 32082;
  }
  const d = floor((4 * c + 3) / 1461),
    e = c - floor((1461 * d) / 4),
    m = floor((5 * e + 2) / 153);
  return [
    e - floor((153 * m + 2) / 5) + 1,
    m + 3 - 12 * floor(m / 10),
    b * 100 + d - 4800 + floor(m / 10),
  ];
}
function newMoon(k: number) {
  const t = k / 1236.85,
    t2 = t * t,
    t3 = t2 * t,
    dr = PI / 180;
  let j = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
  j += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * dr);
  const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
  const mp = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
  const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;
  let c =
    (0.1734 - 0.000393 * t) * Math.sin(m * dr) +
    0.0021 * Math.sin(2 * dr * m) -
    0.4068 * Math.sin(mp * dr) +
    0.0161 * Math.sin(2 * dr * mp) -
    0.0004 * Math.sin(3 * dr * mp);
  c +=
    0.0104 * Math.sin(2 * dr * f) -
    0.0051 * Math.sin(dr * (m + mp)) -
    0.0074 * Math.sin(dr * (m - mp)) +
    0.0004 * Math.sin(dr * (2 * f + m));
  c -= 0.0004 * Math.sin(dr * (2 * f - m)) + 0.0006 * Math.sin(dr * (2 * f + mp));
  c += 0.001 * Math.sin(dr * (2 * f - mp)) + 0.0005 * Math.sin(dr * (2 * mp + m));
  const dt =
    t < -11
      ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
      : -0.000278 + 0.000265 * t + 0.000262 * t2;
  return floor(j + c - dt + 0.5 + TZ / 24);
}
function sun(j: number) {
  const t = (j - 2451545.5 - TZ / 24) / 36525,
    dr = PI / 180;
  const m = 357.5291 + 35999.0503 * t - 0.0001559 * t * t - 0.00000048 * t * t * t;
  const l =
    280.46645 +
    36000.76983 * t +
    0.0003032 * t * t +
    (1.9146 - 0.004817 * t - 0.000014 * t * t) * Math.sin(dr * m) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * dr * m) +
    0.00029 * Math.sin(3 * dr * m);
  return mod(l * dr, 2 * PI);
}
function month11(y: number) {
  const k = floor((jd(31, 12, y) - 2415021) / 29.530588853);
  let n = newMoon(k);
  if (floor((sun(n) / PI) * 6) >= 9) n = newMoon(k - 1);
  return n;
}
function leapOffset(a: number) {
  const k = floor((a - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0,
    i = 1,
    arc = floor((sun(newMoon(k + i)) / PI) * 6);
  do {
    last = arc;
    i++;
    arc = floor((sun(newMoon(k + i)) / PI) * 6);
  } while (arc !== last && i < 14);
  return i - 1;
}
export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
}
export function solarToLunar(d: number, m: number, y: number): LunarDate {
  const dayNumber = jd(d, m, y);
  let k = floor((dayNumber - 2415021.076998695) / 29.530588853);
  while (newMoon(k) > dayNumber) k--;
  while (newMoon(k + 1) <= dayNumber) k++;
  const start = newMoon(k);
  let a = month11(y),
    b = a,
    year: number;
  if (a >= start) {
    year = y;
    a = month11(y - 1);
  } else {
    year = y + 1;
    b = month11(y + 1);
  }
  const day = dayNumber - start + 1,
    diff = floor((start - a) / 29);
  let month = diff + 11,
    leap = false;
  if (b - a > 365) {
    const off = leapOffset(a);
    if (diff >= off) {
      month = diff + 10;
      if (diff === off) leap = true;
    }
  }
  if (month > 12) month -= 12;
  if (month >= 11 && diff < 4) year--;
  return { day, month, year, leap };
}
export function lunarToSolar(
  day: number,
  month: number,
  year: number,
  leap = false,
): [number, number, number] | null {
  if (day < 1 || day > 30 || month < 1 || month > 12) return null;
  const a = month11(month < 11 ? year - 1 : year),
    b = month11(month < 11 ? year : year + 1),
    k = floor(0.5 + (a - 2415021.076998695) / 29.530588853);
  let off = mod(month - 11, 12);
  if (b - a > 365) {
    const lo = leapOffset(a),
      lm = mod(lo - 2, 12) || 12;
    if (leap && month !== lm) return null;
    if (leap || off >= lo) off++;
  } else if (leap) return null;
  const result = fromJD(newMoon(k + off) + day - 1),
    check = solarToLunar(...result);
  return check.day === day && check.month === month && check.year === year && check.leap === leap
    ? result
    : null;
}
export function canChiYear(y: number) {
  return `${stems[mod(y + 6, 10)]} ${branches[mod(y + 8, 12)]}`;
}
export function canChiDay(d: number, m: number, y: number) {
  const j = jd(d, m, y);
  return `${stems[mod(j + 9, 10)]} ${branches[mod(j + 1, 12)]}`;
}
export function canChiMonth(m: number, y: number) {
  return `${stems[mod(y * 12 + m + 3, 10)]} ${branches[mod(m + 1, 12)]}`;
}
export const VN = 'Asia/Ho_Chi_Minh';
export function todayParts(date = new Date()): [number, number, number] {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: VN,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(date);
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return [get('day'), get('month'), get('year')];
}
export function isoDate([d, m, y]: [number, number, number]) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
export function parseDate(s: string): [number, number, number] {
  const [y, m, d] = s.split('-').map(Number);
  return [d, m, y];
}
export function solarTerm(d: number, m: number, y: number) {
  const names = [
    'Xuân phân',
    'Thanh minh',
    'Cốc vũ',
    'Lập hạ',
    'Tiểu mãn',
    'Mang chủng',
    'Hạ chí',
    'Tiểu thử',
    'Đại thử',
    'Lập thu',
    'Xử thử',
    'Bạch lộ',
    'Thu phân',
    'Hàn lộ',
    'Sương giáng',
    'Lập đông',
    'Tiểu tuyết',
    'Đại tuyết',
    'Đông chí',
    'Tiểu hàn',
    'Đại hàn',
    'Lập xuân',
    'Vũ thủy',
    'Kinh trập',
  ];
  return names[floor((sun(jd(d, m, y)) / PI) * 12)];
}
