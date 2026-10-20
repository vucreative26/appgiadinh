import { describe as suite, it, expect } from 'vitest';
import { cast, castMany, byCoins, describe, trigrams } from './oracle';
import {
  analyse,
  arrange,
  calendarContext,
  detailedPrompt,
  elements,
  palaceOf,
  relativeOf,
  relation,
} from './liuyao';
import classic from '../data/iching-classic.json';
import vi from '../data/iching-vi.json';

suite('Lập Lục hào và dữ liệu cổ văn', () => {
  it('ba đồng xu: 6/9 động, 7/8 tĩnh, thứ tự gieo từ hào 1', () => {
    expect(byCoins([8, 9, 8, 7, 8, 7])).toEqual(cast(42, 2));
    expect(byCoins([6, 6, 6, 6, 6, 6]).changed!.number).toBe(1);
    expect(byCoins([9, 9, 9, 9, 9, 9]).changed!.number).toBe(2);
    expect(byCoins([7, 8, 7, 8, 7, 8]).changed).toBeNull();
    expect(() => byCoins([6, 7, 8])).toThrow();
    expect(() => byCoins([6, 7, 8, 9, 5, 7])).toThrow();
  });
  it('khớp bảng Bát cung truyền thống cho đủ 64 quẻ', () => {
    const expected = [
      [1, 44, 33, 12, 20, 23, 35, 14],
      [58, 47, 45, 31, 39, 15, 62, 54],
      [30, 56, 50, 64, 4, 59, 6, 13],
      [51, 16, 40, 32, 46, 48, 28, 17],
      [57, 9, 37, 42, 25, 21, 27, 18],
      [29, 60, 3, 63, 49, 55, 36, 7],
      [52, 22, 26, 41, 38, 10, 61, 53],
      [2, 24, 19, 11, 34, 43, 5, 8],
    ];
    const grouped = trigrams.map((t) =>
      Array.from({ length: 64 }, (_, bits) => bits)
        .filter((bits) => palaceOf(bits).name === t.name)
        .map((bits) => describe(bits).number)
        .sort((a, b) => a - b),
    );
    expect(grouped).toEqual(expected.map((row) => [...row].sort((a, b) => a - b)));
    for (let bits = 0; bits < 64; bits++) {
      const palace = palaceOf(bits);
      expect(Math.abs(palace.host - palace.guest)).toBe(3);
    }
  });
  it('đối chiếu ví dụ Vị Tế hào 2 động → Tấn và Phục thần Quan Hợi', () => {
    const result = cast(42, 2),
      reading = analyse(result, '2000-01-07', '12:00');
    expect(result.main.number).toBe(64);
    expect(result.changed!.number).toBe(35);
    expect(reading.palace).toMatchObject({ name: 'Ly', element: 'Hỏa', host: 3, guest: 6 });
    expect(reading.rows.map((r) => [r.relative, r.canChi])).toEqual([
      ['Phụ mẫu', 'Mậu Dần'],
      ['Tử tôn', 'Mậu Thìn'],
      ['Huynh đệ', 'Mậu Ngọ'],
      ['Thê tài', 'Kỷ Dậu'],
      ['Tử tôn', 'Kỷ Mùi'],
      ['Huynh đệ', 'Kỷ Tỵ'],
    ]);
    expect(reading.changedRows![1]).toMatchObject({ relative: 'Huynh đệ', canChi: 'Ất Tỵ' });
    expect(reading.hidden).toHaveLength(1);
    expect(reading.hidden[0]).toMatchObject({
      position: 3,
      relative: 'Quan quỷ',
      canChi: 'Kỷ Hợi',
    });
  });
  it('đối chiếu Cấn thuần: Nạp giáp, Thế 6, Ứng 3', () => {
    const calendar = calendarContext('2000-01-07', '12:00');
    expect(arrange(36, calendar).map((r) => r.canChi)).toEqual([
      'Bính Thìn',
      'Bính Ngọ',
      'Bính Thân',
      'Bính Tuất',
      'Bính Tý',
      'Bính Dần',
    ]);
    expect(palaceOf(36)).toMatchObject({ name: 'Cấn', host: 6, guest: 3 });
  });
  it('64 mẫu hào động đảo đúng toàn bộ tập được chọn, quẻ tĩnh không giả tạo quẻ biến', () => {
    for (let bits = 0; bits < 64; bits++)
      for (let mask = 0; mask < 64; mask++) {
        const moving = Array.from({ length: 6 }, (_, i) => i + 1).filter(
          (i) => mask & (1 << (i - 1)),
        );
        const result = castMany(bits, moving);
        expect(result.changed?.bits ?? null).toBe(mask ? bits ^ mask : null);
        expect(result.movingLines).toEqual(moving);
      }
    expect(() => castMany(1, [7])).toThrow();
    expect(() => cast(1, NaN)).toThrow();
  });
  it('Can Chi ngày, Tuần không, Lục thú và đổi tháng theo tiết thay vì mùng một âm', () => {
    const c = calendarContext('2000-01-07', '00:00');
    expect(c.day).toBe('Giáp Tý');
    expect(c.empty).toEqual([10, 11]);
    expect(arrange(63, c).map((r) => r.animal)).toEqual([
      'Thanh Long',
      'Chu Tước',
      'Câu Trần',
      'Đằng Xà',
      'Bạch Hổ',
      'Huyền Vũ',
    ]);
    const before = calendarContext('2026-02-03', '12:00'),
      after = calendarContext('2026-02-05', '12:00');
    expect(before.year).toBe('Ất Tỵ');
    expect(after.year).toBe('Bính Ngọ');
    expect(before.monthBranch).toBe(1);
    expect(after.monthBranch).toBe(2);
    expect(calendarContext('2000-01-07', '23:30').day).toBe('Giáp Tý');
    expect(() => calendarContext('2026-02-31', '12:00')).toThrow();
  });
  it('ngũ hành dùng hai chu trình sinh/khắc và quy chiếu Lục thân', () => {
    for (const element of elements) expect(relativeOf(element, element)).toBe('Huynh đệ');
    expect(relativeOf('Hỏa', 'Mộc')).toBe('Phụ mẫu');
    expect(relativeOf('Hỏa', 'Thổ')).toBe('Tử tôn');
    expect(relativeOf('Hỏa', 'Kim')).toBe('Thê tài');
    expect(relativeOf('Hỏa', 'Thủy')).toBe('Quan quỷ');
    expect(relation('Mộc', 'Hỏa')).toBe('sinh');
    expect(relation('Mộc', 'Thổ')).toBe('khắc');
  });
  it('64 quái từ, Thoán, Đại tượng và 384 hào từ đủ thứ tự, không rỗng', () => {
    expect(classic).toHaveLength(64);
    expect(vi).toHaveLength(64);
    for (const [index, item] of classic.entries()) {
      const bits = Array.from({ length: 64 }, (_, value) => value).find(
        (value) => describe(value).number === item.number,
      )!;
      expect(item.number).toBe(index + 1);
      expect(item.lines).toHaveLength(6);
      item.lines.forEach((line, position) =>
        expect(line.slice(0, 2).includes('九')).toBe(!!(bits & (1 << position))),
      );
      expect(item.judgement.length).toBeGreaterThan(3);
      expect(item.tuan.length).toBeGreaterThan(5);
      expect(item.image).not.toContain('初九：');
      expect(item.lines.map((x) => x.slice(0, 2))).toEqual(
        item.lines.map((_, i) =>
          i === 0
            ? expect.stringMatching(/^初[六九]$/)
            : i === 5
              ? expect.stringMatching(/^上[六九]$/)
              : expect.stringMatching(new RegExp(`^[六九]${['', '二', '三', '四', '五'][i]}$`)),
        ),
      );
    }
  });
  it('prompt giữ bối cảnh, dữ liệu từng hào và chỉ rõ quy ước, không gán Thể/Dụng khi nhiều hào động', () => {
    const result = castMany(42, [2, 5]);
    const reading = analyse(result, '2000-01-07', '12:00', 'Thê tài');
    const prompt = detailedPrompt(result, reading, 'Nhập tay sáu hào.', 'Hỏi về một hợp đồng.');
    for (const value of [
      'Hỏi về một hợp đồng',
      'Hào 6:',
      'Hào 1:',
      'DỤNG THẦN',
      'Tuần không',
      'Phục thần',
      'Nạp giáp',
      'quẻ biến',
      'CỔ VĂN',
      'hào 2, 5',
    ])
      expect(prompt.toLowerCase()).toContain(value.toLowerCase());
    expect(reading.maiHoa).toContain('không tự gán');
    const quiet = analyse(cast(63, 0), '2000-01-07', '12:00');
    expect(quiet.influence).toEqual([]);
  });
});
