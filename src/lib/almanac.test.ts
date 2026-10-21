import { it, expect } from 'vitest';
import { dayAlmanac, vnTime } from './almanac';
it('ngày trong ảnh: 23/10/2026 Canh Ngọ, giờ 16 là Giáp Thân', () => {
  const r = dayAlmanac([23, 10, 2026], 16);
  expect(r.weekday).toBe('Thứ sáu');
  expect(r.animal).toBe('Ngựa');
  expect(r.hour).toBe('Giáp Thân');
  expect(r.goodHours.map((h) => h.branch)).toEqual(['Tý', 'Sửu', 'Mão', 'Ngọ', 'Thân', 'Dậu']);
});
it('đối chiếu lịch ngày Bính Dần 19/10/2026 với bảng giờ công khai', () => {
  expect(dayAlmanac([19, 10, 2026], 0).goodHours.map((h) => h.branch)).toEqual([
    'Tý',
    'Sửu',
    'Thìn',
    'Tỵ',
    'Mùi',
    'Tuất',
  ]);
});
it('mỗi chi ngày có sáu giờ, giờ Tý hai đầu ngày nhưng Can Chi ngày không đổi trước 00:00', () => {
  for (let d = 1; d <= 12; d++) expect(dayAlmanac([d, 10, 2026], 0).goodHours).toHaveLength(6);
  expect(dayAlmanac([23, 10, 2026], 23).hour).toBe(dayAlmanac([23, 10, 2026], 0).hour);
  expect(dayAlmanac([23, 10, 2026], 23).hour).not.toBe(dayAlmanac([24, 10, 2026], 0).hour);
  expect(() => dayAlmanac([23, 10, 2026], 24)).toThrow();
});
it('đồng hồ UTC+7 qua nửa đêm và số ngày tháng âm thật', () => {
  expect(vnTime(new Date('2026-10-22T17:26:00Z'))).toEqual({ hour: 0, minute: 26, text: '00:26' });
  expect([29, 30]).toContain(dayAlmanac([23, 10, 2026], 0).monthLength);
});
