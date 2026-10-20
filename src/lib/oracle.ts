import { solarToLunar, mod, branches } from './lunar';
export const trigrams = [
  { name: 'Càn', bits: 7, element: 'Kim' },
  { name: 'Đoài', bits: 3, element: 'Kim' },
  { name: 'Ly', bits: 5, element: 'Hỏa' },
  { name: 'Chấn', bits: 1, element: 'Mộc' },
  { name: 'Tốn', bits: 6, element: 'Mộc' },
  { name: 'Khảm', bits: 2, element: 'Thủy' },
  { name: 'Cấn', bits: 4, element: 'Thổ' },
  { name: 'Khôn', bits: 0, element: 'Thổ' },
];
const matrix = [
  [1, 10, 13, 25, 44, 6, 33, 12],
  [43, 58, 49, 17, 28, 47, 31, 45],
  [14, 38, 30, 21, 50, 64, 56, 35],
  [34, 54, 55, 51, 32, 40, 62, 16],
  [9, 61, 37, 42, 57, 59, 53, 20],
  [5, 60, 63, 3, 48, 29, 39, 8],
  [26, 41, 22, 27, 18, 4, 52, 23],
  [11, 19, 36, 24, 46, 7, 15, 2],
];
export function describe(bits: number) {
  const lower = trigrams.findIndex((t) => t.bits === (bits & 7)),
    upper = trigrams.findIndex((t) => t.bits === ((bits >> 3) & 7));
  return { number: matrix[upper][lower], upper: trigrams[upper], lower: trigrams[lower], bits };
}
export function cast(bits: number, moving: number) {
  if (!Number.isInteger(moving) || moving < 0 || moving > 6) throw Error('Hào động không hợp lệ.');
  return castMany(bits, moving ? [moving] : []);
}
export function castMany(bits: number, movingLines: number[]) {
  if (
    !Number.isInteger(bits) ||
    bits < 0 ||
    bits > 63 ||
    movingLines.some((n) => !Number.isInteger(n) || n < 1 || n > 6)
  )
    throw Error('Quẻ không hợp lệ.');
  const lines = [...new Set(movingLines)].sort((a, b) => a - b);
  const mask = lines.reduce((value, line) => value | (1 << (line - 1)), 0);
  return {
    main: describe(bits),
    mutual: describe(((bits >> 1) & 7) | (((bits >> 2) & 7) << 3)),
    changed: mask ? describe(bits ^ mask) : null,
    moving: lines.length === 1 ? lines[0] : 0,
    movingLines: lines,
  };
}
export function byNumbers(a: string, b: string) {
  if (!/^\d{1,100}$/.test(a) || !/^\d{1,100}$/.test(b))
    throw Error('Mỗi số cần từ 1 đến 100 chữ số.');
  const x = BigInt(a),
    y = BigInt(b),
    up = Number((x + 7n) % 8n),
    down = Number((y + 7n) % 8n),
    moving = Number((x + y + 5n) % 6n) + 1;
  return cast((trigrams[up].bits << 3) | trigrams[down].bits, moving);
}
export function byCoins(values: number[]) {
  if (
    values.length !== 6 ||
    values.some((value) => !Number.isInteger(value) || value < 6 || value > 9)
  )
    throw Error('Cần đúng sáu lần gieo, mỗi lần có tổng 6, 7, 8 hoặc 9.');
  const bits = values.reduce((value, coin, i) => value | ((coin % 2) << i), 0);
  return castMany(
    bits,
    values.flatMap((coin, i) => (coin === 6 || coin === 9 ? [i + 1] : [])),
  );
}
export function bySerial(serial: string) {
  const digits = serial.replace(/[^0-9]/g, '');
  if (digits.length < 2 || digits.length > 100) throw Error('Sê-ri cần có từ 2 đến 100 chữ số.');
  const mid = Math.ceil(digits.length / 2);
  return byNumbers(digits.slice(0, mid), digits.slice(mid));
}
export function byTime(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number),
    [hour] = time.split(':').map(Number);
  if (!y || !m || !d || hour < 0 || hour > 23) throw Error('Ngày giờ không hợp lệ.');
  const l = solarToLunar(d, m, y),
    yearBranch = mod(l.year + 8, 12) + 1,
    hourBranch = mod(Math.floor((hour + 1) / 2), 12) + 1,
    sum = yearBranch + l.month + l.day;
  return {
    result: cast(
      (trigrams[mod(sum - 1, 8)].bits << 3) | trigrams[mod(sum + hourBranch - 1, 8)].bits,
      mod(sum + hourBranch - 1, 6) + 1,
    ),
    note: `Âm lịch ${l.day}/${l.month}${l.leap ? ' nhuận' : ''}/${l.year}; chi năm ${branches[yearBranch - 1]}=${yearBranch}; chi giờ ${branches[hourBranch - 1]}=${hourBranch}.`,
  };
}
