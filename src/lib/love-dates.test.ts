import { describe, it, expect } from 'vitest';
import {
  eventOccurrences,
  nextMemorial,
  validateEvent,
  familyLabel,
  eventTitle,
  type Memorial,
} from './memorials';
import { lunarToSolar, solarToLunar, fromJD, jd } from './lunar';
const base: Memorial = {
  id: 'test',
  name: 'Mẹ',
  relation: 'Mẹ',
  side: 'ngoai',
  lunarDay: 1,
  lunarMonth: 1,
  isLeapMonth: false,
};
describe('Sổ ngày yêu thương', () => {
  it('giữ cách đọc ngày giỗ cũ và không tự gán bên vợ/chồng', () => {
    expect(eventTitle(base)).toBe('Ngày giỗ · Mẹ');
    expect(familyLabel(base)).toContain('Chưa phân');
    expect(familyLabel(base)).toContain('Ngoại');
    expect(nextMemorial(base, [1, 1, 2026])?.date).toEqual(lunarToSolar(1, 1, 2026));
  });
  it('sinh nhật 29/2 có cả năm nhuận và ngày cuối tháng năm không nhuận', () => {
    const m = {
      ...base,
      kind: 'birthday',
      calendar: 'solar',
      lunarDay: 29,
      lunarMonth: 2,
    } as Memorial;
    const rows = eventOccurrences(m, [1, 1, 2024], [31, 12, 2025]);
    expect(rows.map((r) => r.date)).toEqual([
      [29, 2, 2024],
      [28, 2, 2025],
    ]);
    expect(rows.map((r) => r.adjusted)).toEqual([false, true]);
  });
  it('ngày 31 hằng tháng không tràn sang tháng tiếp theo', () => {
    const m = { ...base, calendar: 'solar', repeat: 'monthly', lunarDay: 31 } as Memorial;
    expect(eventOccurrences(m, [1, 1, 2026], [31, 3, 2026]).map((r) => r.date)).toEqual([
      [31, 1, 2026],
      [28, 2, 2026],
      [31, 3, 2026],
    ]);
    expect(nextMemorial(m, [1, 12, 2026])?.date).toEqual([31, 12, 2026]);
  });
  it('hằng tháng âm bao gồm tháng nhuận, ngày 30 thiếu về 29, không trùng ngày', () => {
    const m = { ...base, repeat: 'monthly', lunarDay: 30 } as Memorial;
    const from = lunarToSolar(1, 1, 2025)!,
      to = fromJD(jd(...lunarToSolar(1, 1, 2026)!) - 1);
    const rows = eventOccurrences(m, from, to);
    expect(rows).toHaveLength(13);
    expect(new Set(rows.map((r) => jd(...r.date))).size).toBe(13);
    const lunar = rows.map((r) => solarToLunar(...r.date));
    expect(lunar.filter((l) => l.leap)).toHaveLength(1);
    expect(lunar.every((l) => l.day === 29 || l.day === 30)).toBe(true);
  });
  it('ngày một lần trong tương lai xa vẫn có lần tới; qua ngày không lặp lại', () => {
    const m = {
      ...base,
      calendar: 'solar',
      repeat: 'once',
      eventYear: 2032,
      lunarDay: 15,
      lunarMonth: 8,
    } as Memorial;
    expect(nextMemorial(m, [1, 1, 2026])?.date).toEqual([15, 8, 2032]);
    expect(nextMemorial(m, [16, 8, 2032])).toBeNull();
    expect(nextMemorial(m, [15, 8, 2032])?.remaining).toBe(0);
  });
  it('chặn ngày vô lý và tháng nhuận không tồn tại với ngày một lần', () => {
    expect(() =>
      validateEvent({ ...base, calendar: 'solar', lunarDay: 31, lunarMonth: 4 }),
    ).toThrow();
    expect(() =>
      validateEvent({
        ...base,
        calendar: 'solar',
        repeat: 'once',
        eventYear: 2026,
        lunarDay: 29,
        lunarMonth: 2,
      }),
    ).toThrow();
    expect(() =>
      validateEvent({ ...base, repeat: 'once', eventYear: 2026, isLeapMonth: true, lunarMonth: 6 }),
    ).toThrow();
    expect(() => validateEvent({ ...base, lunarDay: 31 })).toThrow();
    expect(() =>
      validateEvent({ ...base, calendar: 'solar', repeat: 'monthly', lunarDay: 31 }),
    ).not.toThrow();
  });
  it('lặp hằng năm không bỏ giỗ tháng 12 âm ở đầu năm dương; ô lân cận cuối tháng vẫn có dịp', () => {
    const m = { ...base, lunarDay: 20, lunarMonth: 12 };
    const next = nextMemorial(m, [1, 1, 2026]);
    expect(next?.year).toBe(2025);
    const birthday = { ...base, calendar: 'solar', lunarDay: 1, lunarMonth: 11 } as Memorial;
    expect(eventOccurrences(birthday, [26, 10, 2026], [1, 11, 2026])[0]?.date).toEqual([
      1, 11, 2026,
    ]);
  });
  it('phân biệt đủ bốn nhánh và nhóm chung', () => {
    const labels = ['wife', 'husband'].flatMap((family) =>
      ['noi', 'ngoai'].map((branch) => familyLabel({ ...base, family, branch } as Memorial)),
    );
    expect(new Set(labels).size).toBe(4);
    expect(familyLabel({ ...base, family: 'shared', branch: 'chung' })).toBe('Gia đình chung');
  });
});
