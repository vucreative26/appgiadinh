import { useEffect, useState } from 'preact/hooks';
import { PageTitle } from '../../components/Shared';
import { Icon } from '../../components/Icon';
import { usePrices, type Quote } from '../../lib/prices';
import { money } from '../../lib/money';
import { useLocal } from '../../lib/storage';
import { VN } from '../../lib/lunar';
function Sparkline({ values }: { values: (number | null)[] }) {
  const data = values.filter((v): v is number => Number.isFinite(v) && v !== null);
  if (data.length < 2) return <p className="small-note">Chưa đủ lịch sử để vẽ biểu đồ.</p>;
  const min = Math.min(...data),
    max = Math.max(...data),
    range = max - min || 1;
  return (
    <svg
      viewBox="0 0 320 60"
      className="sparkline"
      role="img"
      aria-label={`Diễn biến ${data.length} lần cập nhật gần nhất`}
    >
      <polyline
        points={data
          .map((v, i) => `${(i / (data.length - 1)) * 316 + 2},${54 - ((v - min) / range) * 45}`)
          .join(' ')}
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  );
}
export default function Prices() {
  const { data, loading, error, refresh, goldCheckedAt, goldVerified } = usePrices(),
    [holdings, setHoldings] = useLocal('nha-gold', { chi: '', cost: '', brand: 'sjc' }),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const quote = holdings.brand === 'pnj' ? data?.gold.pnj : data?.gold.sjc,
    quantity = Number(holdings.chi),
    cost = Number(holdings.cost),
    value = quote && quantity > 0 ? (quantity / 10) * quote.buy : null,
    profit = value !== null && cost > 0 ? value - quantity * cost : null;
  const stale = (q: Quote | null | undefined) =>
    !q?.updatedAt || now - new Date(q.updatedAt).getTime() > 6 * 3600000;
  const showTime = (value: string | undefined | null) =>
    value
      ? new Intl.DateTimeFormat('vi-VN', {
          timeZone: VN,
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        }).format(new Date(value))
      : 'Chưa có dữ liệu';
  const cards = [
    {
      label: data?.gold.sjc?.source?.startsWith('SJC')
        ? 'Vàng miếng SJC · nguồn SJC'
        : 'Vàng miếng SJC tại PNJ',
      verified: goldVerified.sjc,
      q: data?.gold.sjc,
      unit: 'đồng / lượng',
      icon: 'sand',
      values: data?.history.map((p) => p.sjc) || [],
    },
    {
      label: 'PNJ Phượng Hoàng',
      verified: goldVerified.pnj,
      q: data?.gold.pnj,
      unit: 'đồng / lượng',
      icon: 'peach',
      values: [],
    },
    {
      label: 'Tỷ giá USD / VND',
      verified: false,
      q: data?.usd,
      unit: 'đồng / 1 USD',
      icon: 'mint',
      values: data?.history.map((p) => p.usd) || [],
    },
  ];
  return (
    <>
      <PageTitle
        eyebrow="THEO DÕI MỖI NGÀY"
        title="Vàng & đô la"
        description="Xem giá rõ nguồn, nhớ lúc cập nhật."
        action={
          <button
            className="button secondary"
            disabled={loading}
            onClick={() => {
              setNow(Date.now());
              void refresh();
            }}
          >
            <Icon name="refresh" size={17} />
            {loading ? 'Đang tải' : 'Làm mới'}
          </button>
        }
      />
      {error && (
        <p className="warning" role="alert">
          {error}
        </p>
      )}
      <p className="notice price-refresh-note" role="status">
        {goldCheckedAt
          ? `Đã đối chiếu nguồn PNJ lúc ${showTime(goldCheckedAt)} (giờ Việt Nam). `
          : 'Chưa đối chiếu được trực tiếp nguồn PNJ trong lần tải này. '}
        Giờ niêm yết của từng giá nằm trên thẻ. USD lấy từ bản giá lưu; làm mới không đồng nghĩa giá
        đã thay đổi.
      </p>
      <div className="price-grid">
        {cards.map((c) => {
          const valid = c.values.filter((v): v is number => v !== null),
            delta = valid.length > 1 ? valid.at(-1)! - valid.at(-2)! : null;
          return (
            <section className="card padded price-card">
              <div className="section-heading">
                <span className={`tile-icon ${c.icon}`}>
                  <Icon name="chart" />
                </span>
                <span className={'badge ' + (stale(c.q) ? 'urgent' : '')}>
                  {!c.q
                    ? 'Chờ nguồn'
                    : stale(c.q)
                      ? 'Giá đã cũ'
                      : c.verified
                        ? 'Đã đối chiếu nguồn'
                        : 'Bản giá lưu'}
                </span>
              </div>
              <h2>{c.label}</h2>
              <p className="small-note">{c.unit}</p>
              <div className="quote-values">
                <div>
                  <span>Mua vào</span>
                  <strong>{c.q ? money(c.q.buy) : '—'}</strong>
                </div>
                <div>
                  <span>Bán ra</span>
                  <strong>{c.q ? money(c.q.sell) : '—'}</strong>
                </div>
              </div>
              <Sparkline values={c.values} />
              {delta !== null && (
                <p className={delta >= 0 ? 'positive' : 'negative'}>
                  {delta >= 0 ? '+' : ''}
                  {money(delta)} so với điểm trước · mua vào
                </p>
              )}
              <div className="price-source">
                {c.q?.source || 'Chưa có nguồn giá xác thực'}
                <br />
                Giờ nguồn: {showTime(c.q?.updatedAt)}
                {c.q?.sourceUrl?.startsWith('https://') && (
                  <>
                    <br />
                    <a className="text-link" href={c.q.sourceUrl} target="_blank" rel="noreferrer">
                      Mở nguồn báo giá <Icon name="arrow" size={14} />
                    </a>
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <section className="card padded">
        <div className="section-heading">
          <div>
            <div className="eyebrow">GÓC TÀI SẢN NHỎ</div>
            <h2>Vàng nhà mình đang giữ</h2>
          </div>
          <Icon name="chart" />
        </div>
        <div className="form-grid">
          <label>
            Loại vàng
            <select
              value={holdings.brand}
              onChange={(e) => setHoldings({ ...holdings, brand: e.currentTarget.value })}
            >
              <option value="sjc">SJC</option>
              <option value="pnj">PNJ</option>
            </select>
          </label>
          <label>
            Số chỉ đang giữ
            <input
              inputMode="decimal"
              type="number"
              min="0"
              step="0.01"
              value={holdings.chi}
              onInput={(e) => setHoldings({ ...holdings, chi: e.currentTarget.value })}
            />
          </label>
          <label>
            Giá mua bình quân (đồng / chỉ)
            <input
              inputMode="numeric"
              type="number"
              min="0"
              step="1"
              value={holdings.cost}
              onInput={(e) => setHoldings({ ...holdings, cost: e.currentTarget.value })}
            />
          </label>
          <div className="holding-result">
            <span>Giá trị bán lại ước tính</span>
            <strong>{value !== null ? money(value) : 'Chờ số lượng và giá mua vào'}</strong>
            {profit !== null && (
              <span className={profit >= 0 ? 'positive' : 'negative'}>
                {profit >= 0 ? 'Lãi' : 'Lỗ'} tạm tính: {money(Math.abs(profit))}
              </span>
            )}
          </div>
        </div>
        <p className="small-note">
          Dùng giá <strong>tiệm mua vào</strong> để ước tính tiền bạn nhận khi bán, 1 lượng = 10
          chỉ. Chưa tính phí và chênh lệch sản phẩm. Thông tin vàng đang giữ chỉ lưu trên thiết bị
          này.
        </p>
      </section>
      <p className="small-note">
        Giá vàng miếng SJC và PNJ Phượng Hoàng do PNJ TP.HCM niêm yết; có thể chênh với bảng giá tại
        SJC.com.vn hoặc sản phẩm khác. Giá vàng được hỏi lại nguồn khi mở trang, bấm Làm mới và mỗi
        5 phút khi app đang mở. Nếu nguồn lỗi, giữ giá cũ và giờ nguồn cũ. Giá quá 6 giờ được đánh
        dấu.
      </p>
    </>
  );
}
