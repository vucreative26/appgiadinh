import { astro } from 'iztro';
import { solarToLunar, lunarToSolar, parseDate, type LunarDate } from './lunar';
export function createChart(
  date: string,
  type: 'solar' | 'lunar',
  leap: boolean,
  timeIndex: number,
  gender: '男' | '女',
  fixLeap = true,
) {
  const [d, m, y] = parseDate(date);
  if (y < 1900 || y > 2100) throw Error('Chọn năm sinh từ 1900 đến 2100.');
  let lunar: LunarDate;
  if (type === 'solar') {
    const actual = new Date(y, m - 1, d);
    if (actual.getFullYear() !== y || actual.getMonth() + 1 !== m || actual.getDate() !== d)
      throw Error('Ngày dương không hợp lệ.');
    lunar = solarToLunar(d, m, y);
  } else {
    if (!lunarToSolar(d, m, y, leap))
      throw Error('Ngày âm hoặc tháng nhuận không tồn tại trong lịch Việt Nam.');
    lunar = { day: d, month: m, year: y, leap };
  }
  // Truyền ngày âm UTC+7, không để thư viện tự chuyển ngày sinh theo lịch Trung Quốc.
  const chart = astro.withOptions({
    type: 'lunar',
    dateStr: `${lunar.year}-${lunar.month}-${lunar.day}`,
    isLeapMonth: lunar.leap,
    timeIndex,
    gender,
    fixLeap,
    language: 'vi-VN',
    config: { yearDivide: 'normal', dayDivide: 'current', algorithm: 'default' },
  });
  const check = chart.rawDates.lunarDate;
  if (
    check.lunarYear !== lunar.year ||
    check.lunarMonth !== lunar.month ||
    check.lunarDay !== lunar.day ||
    check.isLeap !== lunar.leap
  )
    throw Error(
      'Bộ an sao không hỗ trợ đúng ngày âm Việt Nam này. Chưa lập lá số để tránh kết quả sai.',
    );
  return { chart, lunar };
}
