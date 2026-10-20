import { useFamily } from '../../context';
import { todayParts, solarToLunar, canChiDay, canChiYear, jd, VN } from '../../lib/lunar';
import { catholicInfo } from '../../lib/catholic';
import { nextMemorial } from '../../lib/memorials';
import { usePrices } from '../../lib/prices';
import { money } from '../../lib/money';
import { Icon } from '../../components/Icon';
export default function Home() {
  const today = todayParts(),
    [d, m, y] = today,
    lunar = solarToLunar(d, m, y),
    faith = catholicInfo(d, m, y),
    { user, items, memorials } = useFamily(),
    { data } = usePrices();
  const weekday = ['Chúa nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][
    (jd(d, m, y) + 1) % 7
  ];
  const upcoming = memorials
    .map((v) => ({ value: v, next: nextMemorial(v, today) }))
    .filter((v) => v.next && v.next.remaining <= 30)
    .sort((a, b) => a.next!.remaining - b.next!.remaining);
  return (
    <>
      <div className="home-heading">
        <div>
          <div className="eyebrow">KHÔNG GIAN CỦA CHÚNG MÌNH</div>
          <h1>
            Về nhà thôi<span className="title-dot">.</span>
          </h1>
          <p>Một ngày mới, những điều thân quen.</p>
        </div>
        <div className="date-pill">
          <Icon name="calendar" size={17} />
          <span>
            {weekday}, {d}/{m}/{y}
          </span>
        </div>
      </div>
      <section className="hero">
        <div className="hero-main">
          <span className="hero-label">
            <span className="tiny-sun" />
            HÔM NAY Ở NHÀ MÌNH
          </span>
          <div className="hero-date">
            <span>{String(d).padStart(2, '0')}</span>
            <div>
              <strong>Tháng {String(m).padStart(2, '0')}</strong>
              <span>
                {weekday} · {y}
              </span>
            </div>
          </div>
          <div className="hero-lunar">
            <Icon name="moon" size={17} />
            <span>
              Âm lịch {lunar.day}/{lunar.month}
              {lunar.leap ? ' nhuận' : ''} · {canChiYear(lunar.year)}
            </span>
          </div>
          <div className="hero-divider" />
          <p>
            Ngày {canChiDay(d, m, y)}
            <span className="hero-dot">·</span>
            {lunar.day === 1
              ? 'Mùng một, khởi đầu an lành'
              : lunar.day === 15
                ? 'Ngày rằm, lòng mình bình an'
                : 'Chúc nhà mình một ngày bình an'}
          </p>
          <a href="#/lich" className="hero-link">
            Mở lịch gia đình <Icon name="arrow" size={17} />
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <svg viewBox="0 0 320 260" fill="none">
            <circle cx="225" cy="72" r="43" fill="#e8c989" opacity=".9" />
            <circle cx="225" cy="72" r="58" stroke="#f0dfb7" opacity=".25" />
            <path d="M5 232C91 156 158 173 320 118v142H5Z" fill="#759986" opacity=".35" />
            <path d="M0 253c113-92 204-85 320-39v46H0Z" fill="#b7c7ab" opacity=".25" />
            <path
              d="m86 229 25-109m-12 55c-42 0-55-30-40-49 25 3 43 19 40 49Zm11-41c28 3 45-15 45-36-30-3-47 11-45 36Zm-21 61c24 1 48-16 47-36-26-4-44 14-47 36Z"
              stroke="#d1dfc0"
              stroke-width="2"
              fill="#aec9ad"
              fill-opacity=".2"
            />
            <path d="M164 230V139l49-40 49 40v91h-36v-52h-25v52Z" fill="#e7e8cd" />
            <path
              d="m153 142 60-50 60 50"
              stroke="#e7e8cd"
              stroke-width="8"
              stroke-linecap="round"
            />
            <rect x="178" y="150" width="18" height="21" rx="2" fill="#799282" />
            <path
              d="M288 227V165m0 29c-28-7-37-27-27-38 23 9 27 24 27 38Zm0-15c26-4 34-22 27-33-21 7-27 17-27 33Z"
              stroke="#a9c5a9"
              stroke-width="2"
            />
          </svg>
        </div>
      </section>
      <div className="section-heading">
        <h2>Một chút hôm nay</h2>
        <span>Những điều đáng nhớ</span>
      </div>
      <div className="overview-grid">
        <a className="card overview-card" href="#/lich?mode=conggiao">
          <span className="tile-icon lavender">
            <Icon name="calendar" />
          </span>
          <div className="card-label">LỊCH CÔNG GIÁO</div>
          <h3>{faith.event || faith.season}</h3>
          <p>
            {faith.sunday ? 'Chúa nhật' : 'Ngày thường'} · Năm {faith.sundayCycle} /{' '}
            {faith.weekdayCycle}
          </p>
          <span className="card-bottom">
            Xem lịch phụng vụ <Icon name="arrow" size={17} />
          </span>
        </a>
        <a className="card overview-card" href="#/dicho">
          <span className="tile-icon peach">
            <Icon name="bag" />
          </span>
          <div className="card-label">GIỎ ĐI CHỢ</div>
          <h3>
            {user ? (
              <>
                <strong className="number">{items.filter((i) => !i.done).length}</strong> món chưa
                mua
              </>
            ) : (
              'Cùng nhau đi chợ'
            )}
          </h3>
          <p>{user ? 'Ghi lại, để lần sau không quên.' : 'Duyệt thiết bị để cùng cập nhật.'}</p>
          <span className="card-bottom">
            Mở danh sách <Icon name="arrow" size={17} />
          </span>
        </a>
        <a className="card overview-card" href="#/gia">
          <span className="tile-icon sand">
            <Icon name="chart" />
          </span>
          <div className="card-label">GIÁ VÀNG SJC · MUA VÀO</div>
          <h3>{data?.gold.sjc ? money(data.gold.sjc.buy) : 'Chờ bảng giá'}</h3>
          <p>{data?.gold.sjc ? 'Đơn vị đồng / lượng' : 'Hiển thị khi có nguồn giá xác thực.'}</p>
          <span className="card-bottom">
            Vàng & tỷ giá USD <Icon name="arrow" size={17} />
          </span>
        </a>
      </div>
      <div className="home-lower">
        <section className="card remembrance">
          <div className="section-heading">
            <div>
              <div className="eyebrow">GHI NHỚ YÊU THƯƠNG</div>
              <h2>Những ngày sắp tới</h2>
            </div>
            <span className="soft-icon">
              <Icon name="flower" />
            </span>
          </div>
          {upcoming.length ? (
            upcoming.slice(0, 3).map(({ value, next }) => (
              <a className="reminder-row" key={value.id} href="#/giong">
                <div className="date-block">
                  {next!.date![0]}
                  <small>TH {next!.date![1]}</small>
                </div>
                <div>
                  <strong>Giỗ {value.name}</strong>
                  <p>
                    {value.relation} · {value.side === 'noi' ? 'Bên nội' : 'Bên ngoại'}
                  </p>
                </div>
                <span className={'badge ' + (next!.remaining <= 7 ? 'urgent' : '')}>
                  {next!.remaining === 0 ? 'Hôm nay' : `Còn ${next!.remaining} ngày`}
                </span>
              </a>
            ))
          ) : (
            <div className="quiet-empty">
              <Icon name="flower" size={32} />
              <p>
                {user
                  ? 'Chưa có ngày giỗ trong 30 ngày tới.'
                  : 'Những ngày quan trọng của gia đình sẽ ở đây.'}
              </p>
              <a className="text-link" href="#/giong">
                {user ? 'Quản lý ngày giỗ' : 'Mở sổ ngày giỗ'} <Icon name="arrow" size={15} />
              </a>
            </div>
          )}
        </section>
        <section className="card shortcuts">
          <div className="eyebrow">TIỆN ÍCH NHỎ</div>
          <h2>Cần là có</h2>
          <a href="#/sharebill">
            <span className="tile-icon mint">
              <Icon name="split" />
            </span>
            <div>
              <strong>Chia tiền, nhẹ đầu</strong>
              <p>Tính gọn sau mỗi cuộc vui</p>
            </div>
            <Icon name="chevron" size={18} />
          </a>
          <a href="#/dich">
            <span className="tile-icon lavender">
              <Icon name="oracle" />
            </span>
            <div>
              <strong>Một quẻ hôm nay</strong>
              <p>Gieo quẻ, thêm một góc nhìn</p>
            </div>
            <Icon name="chevron" size={18} />
          </a>
          <div className="small-note">
            <Icon name="heart" size={15} /> Dành riêng cho hai chúng mình
          </div>
        </section>
      </div>
    </>
  );
}
