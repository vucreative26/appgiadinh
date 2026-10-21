import { branches, stems, jd, mod, solarToLunar, lunarToSolar, VN } from './lunar';
const hourMasks = [
  '110100101100',
  '001101001011',
  '110011010010',
  '101100110100',
  '001011001101',
  '010010110011',
];
const animals = [
  'Chuột',
  'Trâu',
  'Hổ',
  'Mèo',
  'Rồng',
  'Rắn',
  'Ngựa',
  'Dê',
  'Khỉ',
  'Gà',
  'Chó',
  'Lợn',
];
const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
export function vnTime(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: VN,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')!.value),
    minute = Number(parts.find((p) => p.type === 'minute')!.value);
  return {
    hour,
    minute,
    text: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  };
}
export function hourRange(index: number) {
  return index === 0
    ? '23:00–00:59'
    : `${String(index * 2 - 1).padStart(2, '0')}:00–${String(index * 2).padStart(2, '0')}:59`;
}
// Traditional six-hour table grouped by day branch (Tý/Ngọ, Sửu/Mùi, ...).
// Calendar convention follows the civil date at 00:00; no date rollover at 23:00.
export function dayAlmanac(date: [number, number, number], hour: number) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw Error('Giờ phải từ 0 đến 23.');
  const number = jd(...date),
    dayBranch = mod(number + 1, 12),
    dayStem = mod(number + 9, 10),
    hourBranch = mod(Math.floor((hour + 1) / 2), 12),
    lunar = solarToLunar(...date);
  const festivals: Record<string, string> = {
    '1/1': 'Tết Nguyên đán',
    '15/1': 'Rằm tháng Giêng',
    '10/3': 'Giỗ Tổ Hùng Vương',
    '5/5': 'Tết Đoan Ngọ',
    '15/7': 'Rằm tháng Bảy · Vu Lan',
    '15/8': 'Tết Trung thu',
    '23/12': 'Ngày ông Công, ông Táo',
  };
  return {
    weekday: weekdays[mod(number + 1, 7)],
    animal: animals[dayBranch],
    hour: `${stems[mod(dayStem * 2 + hourBranch, 10)]} ${branches[hourBranch]}`,
    hourRange: hourRange(hourBranch),
    monthLength: lunarToSolar(30, lunar.month, lunar.year, lunar.leap) ? 30 : 29,
    moon:
      lunar.day <= 2 || lunar.day >= 29
        ? 'Gần sóc · trăng mới'
        : lunar.day <= 6
          ? 'Trăng lưỡi liềm đầu tháng'
          : lunar.day <= 9
            ? 'Gần thượng huyền'
            : lunar.day <= 13
              ? 'Trăng khuyết lớn dần'
              : lunar.day <= 17
                ? 'Gần trăng tròn'
                : lunar.day <= 21
                  ? 'Trăng khuyết nhỏ dần'
                  : lunar.day <= 24
                    ? 'Gần hạ huyền'
                    : 'Trăng lưỡi liềm cuối tháng',
    goodHours: branches.flatMap((branch, i) =>
      hourMasks[dayBranch % 6][i] === '1' ? [{ branch, range: hourRange(i) }] : [],
    ),
    observance: !lunar.leap ? festivals[`${lunar.day}/${lunar.month}`] : undefined,
  };
}
