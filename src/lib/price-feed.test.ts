import { it, expect, vi } from 'vitest';
import { combinePrices, loadPrices, type Prices } from './price-feed';
import { parsePNJ, parseVNDate } from './gold-source.mjs';
const now = new Date('2026-10-21T02:00:00Z');
const payload = {
  data: [
    { masp: 'SJC', giamua: 13930, giaban: 14230 },
    { masp: 'PNJ', giamua: 13820, giaban: 14120 },
  ],
  updateDate: '21/10/2026 08:39:47',
};
const quote = {
  buy: 139600000,
  sell: 142600000,
  source: 'PNJ',
  updatedAt: '2026-10-20T08:45:21.000Z',
};
const saved: Prices = {
  updatedAt: quote.updatedAt,
  usd: { buy: 25650, sell: 26060, updatedAt: '2026-10-21T00:34:15.000Z' },
  gold: {
    sjc: quote,
    pnj: { ...quote, buy: 138500000, sell: 141500000 },
    world: null,
    source: 'PNJ',
  },
  history: [{ t: '2026-10-21T00:37:34.065Z', sjc: 139600000, usd: 25650 }],
};
const reply = (data: unknown) =>
  new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

it('bấm làm mới lấy giá PNJ trực tiếp, thay bản GitHub 139,6 bằng 139,3 và giữ giờ nguồn', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockImplementation(async (input) =>
      reply(String(input).startsWith('/prices') ? saved : payload),
    );
  const result = await loadPrices(null, '/prices.json', fetcher, now);
  expect(result.data.gold.sjc!.buy).toBe(139300000);
  expect(result.data.gold.pnj!.buy).toBe(138200000);
  expect(result.data.gold.sjc!.updatedAt).toBe('2026-10-21T01:39:47.000Z');
  expect(result.goldCheckedAt).toBe(now.toISOString());
  expect(result.goldVerified).toEqual({ sjc: true, pnj: true });
  expect(result.warning).toBe('');
  expect(result.data.history.at(-1)!.sjc).toBe(139300000);
  for (const [, options] of fetcher.mock.calls) expect(options?.cache).toBe('no-store');
});
it('nguồn trực tiếp lỗi: giữ giá và giờ cũ, không gắn nhãn đã đối chiếu', async () => {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
    if (String(input).startsWith('/prices')) return reply(saved);
    throw Error('offline');
  });
  const result = await loadPrices(null, '/prices.json', fetcher, now);
  expect(result.data.gold.sjc!.updatedAt).toBe(quote.updatedAt);
  expect(result.goldCheckedAt).toBeNull();
  expect(result.goldVerified).toEqual({ sjc: false, pnj: false });
  expect(result.warning).toContain('bản giá lưu');
});
it('file GitHub lỗi vẫn tải được vàng trực tiếp, không cần đợi workflow', async () => {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
    if (String(input).startsWith('/prices')) return new Response('', { status: 404 });
    return reply(payload);
  });
  const result = await loadPrices(null, '/prices.json', fetcher, now);
  expect(result.data.gold.sjc!.buy).toBe(139300000);
  expect(result.data.usd).toBeNull();
});
it('API chính lỗi thì thử máy chủ PNJ dự phòng', async () => {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
    const url = String(input);
    if (url.startsWith('/prices')) return reply(saved);
    if (url.includes('edge-api.pnj.io')) return new Response('', { status: 503 });
    return reply(payload);
  });
  const result = await loadPrices(null, '/prices.json', fetcher, now);
  expect(result.data.gold.sjc!.sourceUrl).toContain('edge-cf-api.pnj.io');
  expect(result.goldVerified.sjc).toBe(true);
});
it('bảng nguồn thiếu một loại: chỉ cập nhật loại hợp lệ, giữ riêng thời điểm loại còn lại', async () => {
  const partial = { ...payload, data: payload.data.slice(0, 1) };
  const fetcher = vi
    .fn<typeof fetch>()
    .mockImplementation(async (input) =>
      reply(String(input).startsWith('/prices') ? saved : partial),
    );
  const result = await loadPrices(null, '/prices.json', fetcher, now);
  expect(result.data.gold.sjc!.buy).toBe(139300000);
  expect(result.data.gold.pnj!.updatedAt).toBe(quote.updatedAt);
  expect(result.goldVerified).toEqual({ sjc: true, pnj: false });
  expect(result.warning).toContain('thiếu một loại');
});
it('không dùng bản file hoặc phản hồi chậm hơn để ghi đè giá đã lấy mới hơn', async () => {
  const previous = {
    ...saved,
    gold: { ...saved.gold, sjc: { ...quote, buy: 139000000, updatedAt: '2026-10-21T01:50:00Z' } },
  };
  const fetcher = vi
    .fn<typeof fetch>()
    .mockImplementation(async (input) =>
      reply(String(input).startsWith('/prices') ? saved : payload),
    );
  const result = await loadPrices(previous, '/prices.json', fetcher, now);
  expect(result.data.gold.sjc!.buy).toBe(139000000);
  expect(result.goldVerified.sjc).toBe(false);
});
it('lỗi toàn bộ nguồn không tạo dữ liệu giả; dữ liệu đã có vẫn dùng được', async () => {
  const fetcher = vi.fn<typeof fetch>().mockRejectedValue(Error('offline'));
  await expect(loadPrices(null, '/prices.json', fetcher, now)).rejects.toThrow('Chưa lấy được');
  const result = await loadPrices(saved, '/prices.json', fetcher, now);
  expect(result.data.gold.sjc!.buy).toBe(139600000);
  expect(result.goldCheckedAt).toBeNull();
});
it('từ chối giờ nguồn tương lai, ngày không có thực và số liệu sai đơn vị', async () => {
  expect(() => parseVNDate('31/02/2026 08:00:00')).toThrow();
  expect(() =>
    parsePNJ(
      { ...payload, data: [{ masp: 'SJC', giamua: -1, giaban: 2 }] },
      'https://edge-api.pnj.io',
    ),
  ).toThrow();
  const fetcher = vi
    .fn<typeof fetch>()
    .mockImplementation(async (input) =>
      reply(
        String(input).startsWith('/prices')
          ? saved
          : { ...payload, updateDate: '22/10/2026 08:00:00' },
      ),
    );
  const result = await loadPrices(null, '/prices.json', fetcher, now);
  expect(result.data.gold.sjc!.buy).toBe(139600000);
  expect(result.goldVerified.sjc).toBe(false);
});
it('không thêm điểm biểu đồ trùng giá khi chỉ kiểm tra lại nguồn', () => {
  const live = parsePNJ(payload, 'https://edge-api.pnj.io');
  const first = combinePrices(saved, saved, live, now);
  const next = combinePrices(first, saved, live, new Date(now.getTime() + 300000));
  expect(next.history).toHaveLength(first.history.length);
  expect(next.history.at(-1)!.sjc).toBe(next.gold.sjc!.buy);
});
