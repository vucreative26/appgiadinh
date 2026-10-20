import { describe, it, expect } from 'vitest';
import { solarToLunar, lunarToSolar, jd, fromJD, todayParts } from './lunar';
import { easter, catholicInfo, advent } from './catholic';
import { memorialDate, nextMemorial, type Memorial } from './memorials';
import { allocate, balances, settle } from './money';
import { cast, byNumbers, byTime, bySerial } from './oracle';
describe('Lịch âm Việt Nam UTC+7', () => {
  it.each([
    [29, 1, 2025],
    [17, 2, 2026],
    [6, 2, 2027],
  ])('Tết %i/%i/%i', (d, m, y) => {
    expect(solarToLunar(d, m, y)).toEqual({ day: 1, month: 1, year: y, leap: false });
    expect(lunarToSolar(1, 1, y)).toEqual([d, m, y]);
  });
  it('đổi hai chiều mọi ngày 1900–2100, gồm tháng nhuận', () => {
    for (let j = jd(1, 1, 1900); j <= jd(31, 12, 2100); j++) {
      const date = fromJD(j),
        l = solarToLunar(...date);
      expect(lunarToSolar(l.day, l.month, l.year, l.leap), date.join('/')).toEqual(date);
    }
  });
  it('không chấp nhận ngày 30 tháng thiếu và tháng nhuận không có', () => {
    expect(lunarToSolar(30, 2, 2025)).toBeNull();
    expect(lunarToSolar(1, 1, 2026, true)).toBeNull();
  });
  it('ngày hiện tại theo UTC+7, không phụ thuộc múi giờ thiết bị', () => {
    expect(todayParts(new Date('2026-02-16T18:00:00Z'))).toEqual([17, 2, 2026]);
  });
});
describe('Lịch Công giáo', () => {
  it.each([
    [2026, 5, 4],
    [2027, 28, 3],
  ])('Phục Sinh %i', (y, d, m) => expect(easter(y)).toEqual([d, m, y]));
  it('Mùa Vọng bắt đầu Chúa nhật, đổi chu kỳ phụng vụ', () => {
    expect((advent(2026) + 1) % 7).toBe(0);
    expect(catholicInfo(29, 11, 2026).sundayCycle).toBe('B');
    expect(catholicInfo(28, 11, 2026).sundayCycle).toBe('A');
    expect(catholicInfo(5, 4, 2026).season).toBe('Mùa Phục Sinh');
  });
});
describe('Ngày giỗ', () => {
  const m: Memorial = {
    id: 'a',
    name: 'Ông',
    relation: 'Ông nội',
    side: 'noi',
    lunarDay: 30,
    lunarMonth: 2,
    isLeapMonth: false,
  };
  it('ngày 30 tháng thiếu chuyển về 29 có ghi chú', () => {
    const r = memorialDate(m, 2025);
    expect(r.adjusted).toBe(true);
    expect(r.date).toEqual(lunarToSolar(29, 2, 2025));
  });
  it('tháng nhuận mặc định dùng tháng thường', () => {
    expect(
      memorialDate({ ...m, lunarDay: 1, lunarMonth: 6, isLeapMonth: true }, 2025).date,
    ).toEqual(lunarToSolar(1, 6, 2025));
  });
  it('ưu tiên tháng nhuận, không có thì dùng tháng thường', () => {
    expect(
      memorialDate(
        { ...m, lunarDay: 1, lunarMonth: 6, isLeapMonth: true, leapPolicy: 'preferLeap' },
        2025,
      ).date,
    ).toEqual(lunarToSolar(1, 6, 2025, true));
    expect(
      memorialDate(
        { ...m, lunarDay: 1, lunarMonth: 6, isLeapMonth: true, leapPolicy: 'preferLeap' },
        2026,
      ).fallback,
    ).toBe(true);
  });
  it('giỗ cuối năm âm nằm trong tháng 1 dương vẫn được tìm thấy', () => {
    const next = nextMemorial({ ...m, lunarDay: 20, lunarMonth: 12 }, [1, 1, 2026]);
    expect(next?.year).toBe(2025);
    expect(next?.remaining).toBeGreaterThanOrEqual(0);
  });
});
describe('Share Bill', () => {
  it('không bắt người khác nhận rồi chuyển hộ', () => {
    const result = settle({ An: 200000, Bình: -100000, Chi: -100000 });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.to === 'An' && t.amount === 100000)).toBe(true);
  });
  it('chia lẻ bảo toàn tổng tiền', () => {
    expect(allocate(100, { An: 1, Bình: 1, Chi: 1 })).toEqual({ An: 34, Bình: 33, Chi: 33 });
    expect(allocate(100, { An: 1, Bình: 3 })).toEqual({ An: 25, Bình: 75 });
  });
  it('tính đúng cả khoản chia đều và chia tiền trực tiếp', () => {
    const b = balances(
      ['An', 'Bình', 'Chi'],
      [
        {
          id: '1',
          label: 'ăn',
          payer: 'An',
          amount: 100,
          mode: 'equal',
          shares: { An: 1, Bình: 1, Chi: 1 },
        },
        {
          id: '2',
          label: 'xe',
          payer: 'Bình',
          amount: 30,
          mode: 'amount',
          shares: { An: 20, Chi: 10 },
        },
      ],
    );
    expect(b).toEqual({ An: 46, Bình: -3, Chi: -43 });
    expect(settle(b)).toHaveLength(2);
  });
  it('tìm ít lần chuyển hơn ghép tham lam khoản lớn nhất', () => {
    const b = { A: -8, B: -7, C: -5, D: 12, E: 8 };
    const transfers = settle(b);
    expect(transfers).toHaveLength(3);
    const copy = { ...b } as Record<string, number>;
    for (const t of transfers) {
      expect(t.amount).toBeGreaterThan(0);
      copy[t.from] += t.amount;
      copy[t.to] -= t.amount;
    }
    expect(Object.values(copy).every((v) => v === 0)).toBe(true);
  });
  it('mọi số dư ngẫu nhiên sau chuyển đều bằng 0', () => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed % 200) - 100;
    };
    for (let k = 0; k < 150; k++) {
      const v = Array.from({ length: 7 }, rand);
      v.push(-v.reduce((s, n) => s + n, 0));
      const b = Object.fromEntries(v.map((n, i) => [String(i), n]));
      for (const t of settle(b)) {
        b[t.from] += t.amount;
        b[t.to] -= t.amount;
      }
      expect(Object.values(b).every((n) => n === 0)).toBe(true);
    }
  });
  it('từ chối tổng chia trực tiếp không khớp', () =>
    expect(() =>
      balances(
        ['A'],
        [{ id: '1', label: 'x', payer: 'A', amount: 100, mode: 'amount', shares: { A: 99 } }],
      ),
    ).toThrow());
});
describe('Kinh Dịch', () => {
  it('64 tổ hợp cho ra đủ 64 quẻ khác nhau', () => {
    expect(new Set(Array.from({ length: 64 }, (_, bits) => cast(bits, 1).main.number)).size).toBe(
      64,
    );
    expect(cast(63, 0).main.number).toBe(1);
    expect(cast(0, 0).main.number).toBe(2);
  });
  it('quẻ biến chỉ đổi đúng một hào, quẻ hỗ lấy hào 2-5', () => {
    for (let bits = 0; bits < 64; bits++) {
      for (let h = 1; h <= 6; h++) expect(cast(bits, h).changed!.bits ^ bits).toBe(1 << (h - 1));
      expect(cast(bits, 0).mutual.bits).toBe(((bits >> 1) & 7) | (((bits >> 2) & 7) << 3));
    }
  });
  it('xử lý số lớn và seri giữ quy tắc đã công bố', () => {
    expect(byNumbers('8', '8').main.number).toBe(2);
    expect(bySerial('AB12345678')).toEqual(byNumbers('1234', '5678'));
    expect(byNumbers('9999999999999999999999999', '8').moving).toBeGreaterThan(0);
  });
  it('mốc Tết dùng chi năm âm mới', () =>
    expect(byTime('2026-02-17', '00:30').note).toContain('Ngọ=7'));
});
