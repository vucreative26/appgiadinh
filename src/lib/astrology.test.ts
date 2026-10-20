import { it, expect } from 'vitest';
import { createChart } from './astrology';
it('lá số đủ 12 cung, 14 chính tinh và 4 tứ hóa', () => {
  const { chart, lunar } = createChart('1990-01-01', 'solar', false, 3, '男');
  expect(lunar).toEqual({ day: 5, month: 12, year: 1989, leap: false });
  expect(chart.palaces).toHaveLength(12);
  expect(new Set(chart.palaces.map((p) => p.name)).size).toBe(12);
  expect(chart.palaces.flatMap((p) => p.majorStars)).toHaveLength(14);
  expect(
    chart.palaces.flatMap((p) => [...p.majorStars, ...p.minorStars]).filter((s) => s.mutagen),
  ).toHaveLength(4);
  expect(chart.palaces.filter((p) => p.isBodyPalace)).toHaveLength(1);
});
it('ngày dương và âm tương ứng cho cùng một bố trí sao', () => {
  const a = createChart('1990-01-01', 'solar', false, 3, '男'),
    b = createChart('1989-12-05', 'lunar', false, 3, '男');
  expect(a.chart.palaces.map((p) => p.majorStars.map((s) => s.name))).toEqual(
    b.chart.palaces.map((p) => p.majorStars.map((s) => s.name)),
  );
});
it('không chấp nhận tháng nhuận tự nhập không có', () =>
  expect(() => createChart('2026-01-01', 'lunar', true, 0, '女')).toThrow());
