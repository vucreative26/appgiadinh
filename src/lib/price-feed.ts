import { parsePNJ, PNJ_HOSTS, validQuote } from './gold-source.mjs';
export interface Quote {
  buy: number;
  sell: number;
  source?: string;
  sourceUrl?: string;
  updatedAt: string;
}
export interface Prices {
  updatedAt: string | null;
  usd: Quote | null;
  gold: { sjc: Quote | null; pnj: Quote | null; world: number | null; source: string };
  history: { t: string; usd: number | null; sjc: number | null }[];
  errors?: string[];
}
export interface PriceRefresh {
  data: Prices;
  goldCheckedAt: string | null;
  warning: string;
  goldVerified: { sjc: boolean; pnj: boolean };
}
function snapshot(value: unknown): Prices {
  if (
    !value ||
    typeof value !== 'object' ||
    !('gold' in value) ||
    !value.gold ||
    typeof value.gold !== 'object' ||
    !('history' in value) ||
    !Array.isArray(value.history)
  )
    throw Error('Bảng giá lưu không hợp lệ.');
  return value as Prices;
}
function latest(candidates: unknown[], now: number): Quote | null {
  return candidates
    .filter(validQuote)
    .filter((q) => Date.parse(q.updatedAt) <= now + 5 * 60000)
    .reduce<Quote | null>(
      (best, q) => (!best || Date.parse(q.updatedAt) >= Date.parse(best.updatedAt) ? q : best),
      null,
    );
}
export function combinePrices(
  previous: Prices | null,
  saved: Prices | null,
  live: { sjc: Quote | null; pnj: Quote | null } | null,
  now = new Date(),
): Prices {
  const time = now.getTime(),
    sjc = latest([previous?.gold.sjc, saved?.gold.sjc, live?.sjc], time),
    pnj = latest([previous?.gold.pnj, saved?.gold.pnj, live?.pnj], time);
  const usd = latest([previous?.usd, saved?.usd], time);
  let history = [
    ...new Map(
      [...(previous?.history || []), ...(saved?.history || [])]
        .filter(
          (p) =>
            p &&
            Number.isFinite(Date.parse(p.t)) &&
            Date.parse(p.t) >= time - 7 * 86400000 &&
            Date.parse(p.t) <= time &&
            [p.usd, p.sjc].every((n) => n === null || (Number.isFinite(n) && n! > 0)),
        )
        .map((p) => [p.t, p]),
    ).values(),
  ]
    .sort((a, b) => a.t.localeCompare(b.t))
    .slice(-84);
  if (live?.sjc && sjc === live.sjc && history.at(-1)?.sjc !== sjc.buy) {
    history = [
      ...history.filter((point) => point.t !== now.toISOString()),
      { t: now.toISOString(), sjc: sjc.buy, usd: usd?.buy ?? null },
    ].slice(-84);
  }
  return {
    updatedAt:
      [sjc, pnj, usd]
        .filter((q): q is Quote => !!q)
        .map((q) => q.updatedAt)
        .sort()
        .at(-1) || null,
    usd,
    gold: { sjc, pnj, world: null, source: 'Xem nguồn và thời điểm của từng giá' },
    history,
    errors: saved?.errors || [],
  };
}
async function getJSON(fetcher: typeof fetch, url: string) {
  const response = await fetcher(url, { cache: 'no-store', signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  return response.json();
}
export async function fetchLiveGold(fetcher: typeof fetch = fetch, now = new Date()) {
  const errors: string[] = [];
  for (const host of PNJ_HOSTS) {
    try {
      const quotes = parsePNJ(
        await getJSON(fetcher, `${host}/ecom-frontend/v1/get-gold-price?zone=00&_=${Date.now()}`),
        host,
      );
      if (
        [quotes.sjc, quotes.pnj].some(
          (q) => q && Date.parse(q.updatedAt) > now.getTime() + 5 * 60000,
        )
      )
        throw Error('Giờ nguồn PNJ nằm trong tương lai.');
      return quotes;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Lỗi nguồn');
    }
  }
  throw Error(errors.join('; '));
}
export async function loadPrices(
  previous: Prices | null,
  savedUrl: string,
  fetcher: typeof fetch = fetch,
  now = new Date(),
): Promise<PriceRefresh> {
  const [savedResult, liveResult] = await Promise.allSettled([
    getJSON(fetcher, savedUrl).then(snapshot),
    fetchLiveGold(fetcher, now),
  ]);
  const saved = savedResult.status === 'fulfilled' ? savedResult.value : null,
    live = liveResult.status === 'fulfilled' ? liveResult.value : null;
  const data = combinePrices(previous, saved, live, now);
  if (!data.gold.sjc && !data.gold.pnj && !data.usd)
    throw Error('Chưa lấy được bảng giá. Kiểm tra mạng hoặc mở nguồn để đối chiếu.');
  let warning = !live
    ? 'Chưa đối chiếu được nguồn PNJ. Đang hiển thị bản giá lưu theo thời điểm ghi trên từng thẻ.'
    : '';
  if (live && (!live.sjc || !live.pnj))
    warning =
      'Nguồn PNJ đang thiếu một loại vàng; loại đó giữ bản giá lưu, không coi là vừa được cập nhật.';
  const verified = (key: 'sjc' | 'pnj') =>
    !!live?.[key] &&
    live[key]!.updatedAt === data.gold[key]?.updatedAt &&
    live[key]!.buy === data.gold[key]?.buy &&
    live[key]!.sell === data.gold[key]?.sell;
  return {
    data,
    goldCheckedAt: live ? now.toISOString() : null,
    warning,
    goldVerified: { sjc: verified('sjc'), pnj: verified('pnj') },
  };
}
