import { useState, useEffect } from 'preact/hooks';
import { PageTitle, Tabs } from '../../components/Shared';
import { Icon } from '../../components/Icon';
import {
  todayParts,
  solarToLunar,
  canChiDay,
  canChiMonth,
  canChiYear,
  jd,
  fromJD,
  solarTerm,
} from '../../lib/lunar';
import { catholicInfo } from '../../lib/catholic';
import { dayAlmanac, vnTime } from '../../lib/almanac';
import fixed from '../../data/catholic-fixed.json';
import { useFamily } from '../../context';
import { eventOccurrences, eventTitle } from '../../lib/memorials';
export default function Calendar() {
  const [clock, setClock] = useState(() => new Date()),
    [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const today = todayParts(clock),
    [month, setMonth] = useState(today[1]),
    [year, setYear] = useState(today[2]),
    [selected, setSelected] = useState(today),
    [tab, setTab] = useState<'am' | 'conggiao'>(
      location.hash.includes('mode=conggiao') ? 'conggiao' : 'am',
    );
  const { memorials } = useFamily(),
    first = jd(1, month, year),
    offset = first % 7,
    days = new Date(year, month, 0).getDate(),
    count = Math.ceil((offset + days) / 7) * 7,
    lunar = solarToLunar(...selected),
    faith = catholicInfo(...selected),
    fixedName = (fixed as Record<string, string>)[
      `${String(selected[1]).padStart(2, '0')}-${String(selected[0]).padStart(2, '0')}`
    ];
  const time = vnTime(clock),
    detail = dayAlmanac(selected, hour ?? time.hour);
  const memorialDays = new Map<number, string[]>();
  for (const v of memorials) {
    for (const r of eventOccurrences(
      v,
      fromJD(first - offset),
      fromJD(first - offset + count - 1),
    )) {
      const key = jd(...r.date);
      memorialDays.set(key, [...(memorialDays.get(key) || []), eventTitle(v)]);
    }
  }
  function change(n: number) {
    const date = new Date(year, month - 1 + n, 1);
    if (date.getFullYear() < 1900 || date.getFullYear() > 2100) return;
    setMonth(date.getMonth() + 1);
    setYear(date.getFullYear());
  }
  return (
    <>
      <PageTitle
        eyebrow="NHỊP NGÀY THÂN QUEN"
        title="Lịch nhà mình"
        description="Ngày dương để hẹn, ngày âm để nhớ."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'am', label: 'Lịch Âm' },
          { value: 'conggiao', label: 'Lịch Công giáo' },
        ]}
      />
      <div className="calendar-layout">
        <section className="card calendar-card">
          <div className="calendar-toolbar">
            <div className="row">
              <button
                className="icon-button rotate"
                aria-label="Tháng trước"
                onClick={() => change(-1)}
              >
                <Icon name="chevron" />
              </button>
              <h2>
                Tháng {month} <span>{year}</span>
              </h2>
              <button className="icon-button" aria-label="Tháng sau" onClick={() => change(1)}>
                <Icon name="chevron" />
              </button>
            </div>
            <button
              className="button secondary small"
              onClick={() => {
                setMonth(today[1]);
                setYear(today[2]);
                setSelected(today);
              }}
            >
              Hôm nay
            </button>
          </div>
          <div className="calendar-jump">
            <label>
              Tháng
              <select
                aria-label="Chọn tháng"
                value={month}
                onChange={(e) => setMonth(Number(e.currentTarget.value))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </label>
            <label>
              Năm
              <select
                aria-label="Chọn năm"
                value={year}
                onChange={(e) => setYear(Number(e.currentTarget.value))}
              >
                {Array.from({ length: 201 }, (_, i) => (
                  <option value={1900 + i}>{1900 + i}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="calendar-weekdays">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((x) => (
              <span>{x}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: count }, (_, i) => {
              const date = fromJD(first - offset + i),
                [d, m, y] = date,
                l = solarToLunar(...date),
                f = catholicInfo(...date),
                j = jd(...date),
                active = j === jd(...selected),
                isToday = j === jd(...today),
                mark = memorialDays.has(j),
                feast =
                  f.event ||
                  (fixed as Record<string, string>)[
                    `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  ];
              return (
                <button
                  key={j}
                  className={
                    'calendar-day ' +
                    (m !== month ? 'muted-day ' : '') +
                    (active ? 'chosen ' : '') +
                    (isToday ? 'today ' : '') +
                    (i % 7 === 6 ? 'sunday' : '')
                  }
                  aria-pressed={active}
                  aria-label={`${d}/${m}/${y}, âm lịch ${l.day}/${l.month}${mark ? ', có ngày yêu thương' : ''}${feast ? ', ' + feast : ''}`}
                  onClick={() => setSelected(date)}
                >
                  <strong>{d}</strong>
                  <small className={l.day === 1 || l.day === 15 ? 'lunar-special' : ''}>
                    {l.day === 1 ? `${l.day}/${l.month}${l.leap ? 'n' : ''}` : l.day}
                  </small>
                  <span className="day-dots">
                    {mark && <i className="memorial-dot" />}
                    {tab === 'conggiao' && (feast || f.sunday) && <i className="faith-dot" />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="calendar-legend">
            <span>
              <i className="memorial-dot" />
              Ngày yêu thương
            </span>
            <span>
              <i className="faith-dot" />
              Lễ / Chúa nhật
            </span>
            <span>Chữ nhỏ: ngày âm</span>
          </div>
        </section>
        <aside className="card day-detail">
          <div className="eyebrow">{detail.weekday.toLocaleUpperCase('vi')}</div>
          <div className="detail-date">{selected[0]}</div>
          <p>
            Tháng {selected[1]} năm {selected[2]}
          </p>
          {tab === 'am' ? (
            <>
              <div className="detail-highlight">
                <Icon name="moon" />
                <div>
                  <strong>
                    {lunar.day}/{lunar.month}
                    {lunar.leap ? ' nhuận' : ''} âm lịch
                  </strong>
                  <span>Năm {canChiYear(lunar.year)}</span>
                </div>
              </div>
              <dl>
                <dt>Ngày</dt>
                <dd>{canChiDay(...selected)}</dd>
                <dt>Tháng</dt>
                <dd>{canChiMonth(lunar.month, lunar.year)}</dd>
                <dt>Tiết khí</dt>
                <dd>{solarTerm(...selected)}</dd>
                <dt>Con giáp ngày</dt>
                <dd>{detail.animal}</dd>
                <dt>Tháng âm</dt>
                <dd>
                  {detail.monthLength} ngày · {lunar.leap ? 'Tháng nhuận' : 'Tháng thường'}
                </dd>
                <dt>Trăng (xấp xỉ)</dt>
                <dd>{detail.moon}</dd>
              </dl>
              <div className="hour-lookup">
                <label>
                  Tra giờ theo ngày đang chọn (UTC+7)
                  <select
                    value={hour ?? 'now'}
                    onChange={(e) =>
                      setHour(
                        e.currentTarget.value === 'now' ? null : Number(e.currentTarget.value),
                      )
                    }
                  >
                    <option value="now">Theo giờ hiện tại · {time.text}</option>
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  <strong>Giờ {detail.hour}</strong>
                  <span className="small-note">
                    {detail.hourRange} · Quy ước đổi ngày lúc 00:00
                  </span>
                </p>
              </div>
              <section className="auspicious-hours">
                <h3>Giờ hoàng đạo</h3>
                <div>
                  {detail.goodHours.map((h) => (
                    <span className="hour-chip" key={h.branch}>
                      <strong>{h.branch}</strong>
                      <small>{h.range}</small>
                    </span>
                  ))}
                </div>
                <p className="small-note">
                  Bảng giờ theo chi ngày trong lịch truyền thống; giờ Tý gồm 00:00–00:59 và
                  23:00–23:59 của ngày đang xem.
                </p>
              </section>
              {detail.observance && <p className="notice">{detail.observance}</p>}
              <details className="almanac-conventions">
                <summary>Cách đọc thông tin ngày</summary>
                <p className="small-note">
                  Lịch âm, Can Chi và tiết khí tính theo UTC+7. Tháng Can Chi ở đây theo tháng âm;
                  phần lập quẻ có quy ước tháng tiết khí riêng. Pha trăng ước tính theo ngày âm. Giờ
                  hoàng đạo là thông tin văn hóa dân gian, không phải xác suất tốt/xấu của một việc.
                </p>
                <a
                  className="text-link"
                  href="https://github.com/de-men/amlich"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Tham khảo lịch âm & giờ hoàng đạo <Icon name="arrow" size={14} />
                </a>
              </details>
            </>
          ) : (
            <>
              <div className="detail-highlight lavender">
                <Icon name="calendar" />
                <div>
                  <strong>{faith.event || faith.season}</strong>
                  <span>{faith.season}</span>
                </div>
              </div>
              {fixedName && <p className="notice">{fixedName}</p>}
              <dl>
                <dt>Chu kỳ Chúa nhật</dt>
                <dd>{faith.sundayCycle}</dd>
                <dt>Ngày thường</dt>
                <dd>{faith.weekdayCycle}</dd>
              </dl>
              <a
                className="button secondary"
                href="https://hdgmvietnam.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mở trang HĐGM Việt Nam <Icon name="arrow" size={16} />
              </a>
              <p className="small-note">
                Lịch tổng quát, chưa áp dụng đầy đủ chuyển lễ và lễ riêng từng giáo phận. Đối chiếu
                lịch chính thức khi sử dụng.
              </p>
            </>
          )}
          {memorialDays.get(jd(...selected))?.map((name) => (
            <a className="memorial-notice" href="#/giong">
              <Icon name="flower" size={18} />
              {name}
            </a>
          ))}
        </aside>
      </div>
    </>
  );
}
