export const PNJ_HOSTS = ['https://edge-api.pnj.io', 'https://edge-cf-api.pnj.io'];
export function validQuote(q) {
  return (
    !!q &&
    Number.isFinite(q.buy) &&
    Number.isFinite(q.sell) &&
    q.buy > 0 &&
    q.sell >= q.buy &&
    Number.isFinite(Date.parse(q.updatedAt))
  );
}
export function parseVNDate(value) {
  const m =
    typeof value === 'string' &&
    value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) throw Error('Thời gian nguồn PNJ không đúng định dạng.');
  const [day, month, year, hour, minute, second] = m.slice(1).map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    year < 2000 ||
    year > 2200 ||
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  )
    throw Error('Ngày giờ nguồn PNJ không hợp lệ.');
  return new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6]}+07:00`).toISOString();
}
export function parsePNJ(payload, host) {
  if (!payload || !Array.isArray(payload.data)) throw Error('PNJ không có bảng giá.');
  const updatedAt = parseVNDate(payload.updateDate);
  const get = (code) => {
    const row = payload.data.find((p) => p.masp === code);
    const q = {
      buy: Number(row?.giamua) * 10000,
      sell: Number(row?.giaban) * 10000,
      source: `PNJ · TP.HCM · ${code === 'SJC' ? 'SJC 999.9' : 'PNJ Phượng Hoàng'}`,
      sourceUrl: `${host}/ecom-frontend/v1/get-gold-price?zone=00`,
      updatedAt,
    };
    return validQuote(q) && q.buy >= 1e6 && q.sell <= 1e10 ? q : null;
  };
  const sjc = get('SJC'),
    pnj = get('PNJ');
  if (!sjc && !pnj) throw Error('PNJ: giá hoặc đơn vị bất thường.');
  return { sjc, pnj };
}
