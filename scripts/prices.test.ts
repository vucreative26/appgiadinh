import { it, expect } from 'vitest';
// @ts-expect-error Tập lệnh Node độc lập được kiểm thử trực tiếp.
import { parsePNJ, parseVCB, mergePrices } from './fetch-prices.mjs';
it('PNJ quy đổi nghìn đồng/chỉ thành đồng/lượng và giữ giờ nguồn', () => {
  const p = parsePNJ(
    {
      data: [
        { masp: 'SJC', giamua: 10000, giaban: 10200 },
        { masp: 'PNJ', giamua: 9900, giaban: 10100 },
      ],
      updateDate: '20/10/2026 15:45:21',
    },
    'https://edge-api.pnj.io',
  );
  expect(p.sjc.buy).toBe(100000000);
  expect(p.sjc.updatedAt).toBe('2026-10-20T08:45:21.000Z');
});
it('USD giữ giá mua/bán riêng và hiểu giờ AM/PM của nguồn', () => {
  const q = parseVCB(
    '<DateTime>10/20/2026 5:13:13 PM</DateTime><Exrate CurrencyCode="USD" Buy="25,100.00" Sell="26,200.00" />',
  );
  expect(q.buy).toBe(25100);
  expect(q.sell).toBe(26200);
  expect(q.updatedAt).toBe('2026-10-20T10:13:13.000Z');
});
it('nguồn lỗi không làm mới giả thời điểm giá cũ', () => {
  const quote = { buy: 100, sell: 110, updatedAt: '2026-10-20T00:00:00Z' };
  const old = { gold: { sjc: quote, pnj: null }, usd: null, history: [] };
  const p = mergePrices(old, null, null, ['nguồn lỗi'], new Date('2026-10-20T10:00:00Z'));
  expect(p.gold.sjc.updatedAt).toBe(quote.updatedAt);
  expect(p.updatedAt).toBe(quote.updatedAt);
  expect(p.history).toEqual([]);
});
it('lịch sử không vượt 84 điểm và bỏ điểm cũ hơn 7 ngày', () => {
  const now = new Date('2026-10-20T12:00:00Z'),
    history = Array.from({ length: 100 }, (_, i) => ({
      t: new Date(now.getTime() - i * 2 * 3600000).toISOString(),
      usd: 25000,
      sjc: 100000000,
    }));
  const p = mergePrices({ gold: {}, history }, null, null, [], now);
  expect(p.history.length).toBeLessThanOrEqual(84);
  expect(
    p.history.every((x: { t: string }) => Date.parse(x.t) >= now.getTime() - 7 * 86400000),
  ).toBe(true);
});
