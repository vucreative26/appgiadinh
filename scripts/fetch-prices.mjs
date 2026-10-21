import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const VCB = 'https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx';
import { parsePNJ, parseVNDate, validQuote, PNJ_HOSTS as PNJ } from '../src/lib/gold-source.mjs';
export { parsePNJ, parseVNDate, validQuote };
export function parseVCB(xml) {
  const row = xml.match(/<Exrate\b[^>]*CurrencyCode="USD"[^>]*\/>/i)?.[0];
  if (!row) throw Error('Không có USD trong XML Vietcombank.');
  const get = (k) => Number(row.match(new RegExp(`${k}="([^"]+)"`))?.[1].replace(/,/g, ''));
  const raw = xml.match(/<DateTime>([^<]+)<\/DateTime>/)?.[1],
    m = raw?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) throw Error('Thời gian Vietcombank không đúng định dạng.');
  let h = Number(m[4]);
  if (m[7]) h = (h % 12) + (m[7].toUpperCase() === 'PM' ? 12 : 0);
  const updatedAt = new Date(
    `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}T${String(h).padStart(2, '0')}:${m[5]}:${m[6]}+07:00`,
  ).toISOString();
  const q = {
    buy: get('Buy'),
    sell: get('Sell'),
    updatedAt,
    source: 'Vietcombank · mua tiền mặt',
    sourceUrl: VCB,
  };
  if (!validQuote(q) || q.buy < 1000 || q.sell > 1000000)
    throw Error('Tỷ giá Vietcombank không hợp lệ.');
  return q;
}
async function fetchText(url) {
  const r = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: {
      'User-Agent': 'NhaMinh-FamilyApp/1.0',
      Accept: 'application/json,text/xml,text/html',
    },
  });
  if (!r.ok) throw Error(`HTTP ${r.status}`);
  return r.text();
}
export async function fetchPNJ() {
  const errors = [];
  for (const host of PNJ) {
    try {
      return parsePNJ(
        JSON.parse(await fetchText(`${host}/ecom-frontend/v1/get-gold-price?zone=00`)),
        host,
      );
    } catch (e) {
      errors.push(`${host}: ${e.message}`);
    }
  }
  throw Error(errors.join('; '));
}
export async function fetchSJC() {
  const xml = await fetchText('https://sjc.com.vn/xml/tygiavang.xml');
  const row = xml.match(/<item\b[^>]*type="[^"]*SJC[^\"]*"[^>]*\/>/i)?.[0];
  if (!row) throw Error('SJC XML không có dòng SJC hợp lệ.');
  const get = (k) => Number(row.match(new RegExp(`${k}="([^"]+)"`))?.[1].replace(/,/g, '')) * 1000;
  const time = xml.match(/updated="([^"]+)"/)?.[1];
  const q = {
    buy: get('buy'),
    sell: get('sell'),
    source: 'SJC · XML',
    updatedAt: parseVNDate(time),
    sourceUrl: 'https://sjc.com.vn/xml/tygiavang.xml',
  };
  if (!validQuote(q)) throw Error('SJC XML: dữ liệu không hợp lệ.');
  return q;
}
export async function fetchUSD() {
  return parseVCB(await fetchText(VCB));
}
function validOld(value) {
  return value && value.gold && Array.isArray(value.history);
}
export function mergePrices(old, gold, usd, errors, now = new Date()) {
  const clean = (q) => (validQuote(q) ? q : null),
    previous = old || {},
    g = {
      sjc: clean(gold?.sjc) || clean(previous.gold?.sjc),
      pnj: clean(gold?.pnj) || clean(previous.gold?.pnj),
      world: null,
      source: 'PNJ / SJC · xem nguồn từng giá',
    };
  const u = clean(usd) || clean(previous.usd),
    dates = [g.sjc, g.pnj, u]
      .filter(Boolean)
      .map((q) => q.updatedAt)
      .sort();
  const cutoff = now.getTime() - 7 * 86400000;
  let history = (previous.history || []).filter(
    (p) =>
      Number.isFinite(Date.parse(p.t)) &&
      Date.parse(p.t) >= cutoff &&
      Date.parse(p.t) <= now.getTime() &&
      [p.usd, p.sjc].every((v) => v === null || (Number.isFinite(v) && v > 0)),
  );
  if (gold || usd)
    history.push({ t: now.toISOString(), usd: u?.buy ?? null, sjc: g.sjc?.buy ?? null });
  history = [...new Map(history.map((p) => [p.t, p])).values()]
    .sort((a, b) => a.t.localeCompare(b.t))
    .slice(-84);
  return { updatedAt: dates.at(-1) || null, usd: u, gold: g, history, errors };
}
export async function main() {
  let old = null;
  const errors = [];
  try {
    old = JSON.parse(await readFile('public/prices.json', 'utf8'));
  } catch {}
  if (process.env.PRICES_URL) {
    try {
      const remote = JSON.parse(await fetchText(process.env.PRICES_URL));
      if (validOld(remote)) old = remote;
      else throw Error('Dữ liệu cũ không hợp lệ.');
    } catch (e) {
      errors.push(`Lịch sử: ${e.message}`);
    }
  }
  let gold = null,
    usd = null;
  const [g, u] = await Promise.allSettled([fetchPNJ(), fetchUSD()]);
  if (g.status === 'fulfilled') gold = g.value;
  else {
    errors.push(`PNJ: ${g.reason.message}`);
    try {
      gold = { sjc: await fetchSJC(), pnj: null };
    } catch (e) {
      errors.push(`SJC: ${e.message}`);
    }
  }
  if (u.status === 'fulfilled') usd = u.value;
  else errors.push(`USD: ${u.reason.message}`);
  const merged = mergePrices(validOld(old) ? old : null, gold, usd, errors);
  await mkdir('public', { recursive: true });
  await writeFile('public/prices.json', JSON.stringify(merged, null, 2));
  console.log(
    JSON.stringify(
      {
        updatedAt: merged.updatedAt,
        sources: [merged.usd?.source, merged.gold.sjc?.source, merged.gold.pnj?.source].filter(
          Boolean,
        ),
        history: merged.history.length,
        errors,
      },
      null,
      2,
    ),
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((e) => {
    console.error(`Giữ nguyên giá cũ do lỗi: ${e.message}`);
    process.exitCode = 0;
  });
