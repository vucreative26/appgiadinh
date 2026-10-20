import { useRef, useState } from 'preact/hooks';
import type { cast } from '../../lib/oracle';
import type { Reading } from '../../lib/liuyao';
import { branches } from '../../lib/lunar';
import names from '../../data/64que.json';
import { Icon } from '../../components/Icon';
import { HexLines } from './HexLines';
import { HexagramContent } from './HexagramContent';

export function ReadingView({
  result,
  reading,
  note,
  onCopy,
}: {
  result: ReturnType<typeof cast>;
  reading: Reading;
  note: string;
  onCopy: () => void;
}) {
  const [article, setArticle] = useState<'main' | 'mutual' | 'changed'>('main');
  const articleSection = useRef<HTMLElement>(null);
  function readArticle(kind: typeof article) {
    setArticle(kind);
    requestAnimationFrame(() =>
      articleSection.current?.scrollIntoView({
        block: 'start',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      }),
    );
  }
  const { calendar: c, palace: p } = reading;
  const panels = [
    {
      kind: 'main' as const,
      label: 'Quẻ gốc',
      hex: result.main,
      explanation: 'Tình thế ban đầu',
      moving: result.movingLines,
    },
    {
      kind: 'mutual' as const,
      label: 'Quẻ hỗ',
      hex: result.mutual,
      explanation: 'Cấu trúc bên trong',
      moving: [],
    },
    {
      kind: 'changed' as const,
      label: 'Quẻ biến',
      hex: result.changed,
      explanation: 'Sau khi đổi hào động',
      moving: result.movingLines,
    },
  ];
  const active = article === 'changed' && !result.changed ? 'main' : article;
  const displayed =
    active === 'main' ? result.main : active === 'mutual' ? result.mutual : result.changed!;
  return (
    <div className="reading-view">
      <section className="card padded">
        <div className="section-heading">
          <div>
            <div className="eyebrow">BẢN LẬP QUẺ</div>
            <h2>Gốc · Hỗ · Biến</h2>
          </div>
          <button className="button primary" onClick={onCopy}>
            <Icon name="copy" size={17} />
            Copy đầy đủ
          </button>
        </div>
        <div className="hex-comparison">
          {panels.map((panel) => (
            <div className={`comparison-card ${panel.kind}`} key={panel.kind}>
              <div className="eyebrow">{panel.label}</div>
              {panel.hex ? (
                <>
                  <h3>
                    #{panel.hex.number}
                    <br />
                    {names[panel.hex.number - 1][0]}
                  </h3>
                  <HexLines bits={panel.hex.bits} moving={panel.moving} />
                  <p>
                    Thượng {panel.hex.upper.name}
                    <br />
                    Hạ {panel.hex.lower.name}
                  </p>
                  <button className="text-link" onClick={() => readArticle(panel.kind)}>
                    Đọc quẻ <Icon name="arrow" size={14} />
                  </button>
                </>
              ) : (
                <div className="quiet-empty">
                  <p>Quẻ tĩnh</p>
                  <p>Không có hào động nên không sinh quẻ biến khác.</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="reading-time">
          <span>
            <small>Thời điểm UTC+7</small>
            {c.time} · {c.date}
          </span>
          <span>
            <small>Năm · theo Lập Xuân</small>
            {c.year}
          </span>
          <span>
            <small>Nguyệt kiến · tiết khí</small>
            {c.month}
          </span>
          <span>
            <small>Nhật thần</small>
            {c.day}
          </span>
          <span>
            <small>Giờ Can Chi</small>
            {c.hour}
          </span>
          <span>
            <small>Tuần không</small>
            {c.empty.map((i) => branches[i]).join(' · ')}
          </span>
        </div>
        {c.nearTerm && (
          <p className="warning">
            Thời điểm này gần ranh tiết khí. Nguyệt kiến đang tính xấp xỉ; hãy đối chiếu giờ giao
            tiết trước khi luận vượng suy.
          </p>
        )}
        <p className="small-note">{note}</p>
      </section>
      <section className="card padded">
        <h2>Bảng Lục hào · Nạp giáp</h2>
        <p>
          Cung {p.name} – {p.element} · {p.stage} · Thế hào {p.host} / Ứng hào {p.guest}. Đọc từ
          trên xuống là hào 6 → 1.
        </p>
        <p className="small-note">
          Vuốt ngang để xem toàn bộ bảng. Màu đỏ đánh dấu hào động; Lục thân quẻ biến vẫn quy theo
          cung quẻ gốc.
        </p>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Bảng Lục hào có thể cuộn ngang"
        >
          <table className="liuyao-table">
            <thead>
              <tr>
                <th>Hào / Tượng</th>
                <th>Thế–Ứng</th>
                <th>Lục thân / Can Chi</th>
                <th>Lục thú</th>
                <th>Trạng thái</th>
                <th>Phục thần</th>
                <th>Quẻ biến</th>
              </tr>
            </thead>
            <tbody>
              {[...reading.rows].reverse().map((row) => {
                const moving = result.movingLines.includes(row.position),
                  hidden = reading.hidden.find((r) => r.position === row.position),
                  after = reading.changedRows?.[row.position - 1];
                const flags = [
                  row.empty && 'Tuần không',
                  row.monthBroken && 'Nguyệt phá',
                  row.dayClash && 'Nhật xung',
                  row.monthCombined && 'Nguyệt hợp',
                ].filter(Boolean);
                return (
                  <tr className={moving ? 'is-moving' : ''} key={row.position}>
                    <th>
                      <span>
                        Hào {row.position}
                        {moving ? ' · Động' : ''}
                      </span>
                      <span
                        aria-label={row.yang ? 'Dương' : 'Âm'}
                        className={'table-line ' + (row.yang ? 'yang' : 'yin')}
                      >
                        <i />
                        <i />
                      </span>
                    </th>
                    <td>
                      {row.position === p.host ? (
                        <strong>Thế</strong>
                      ) : row.position === p.guest ? (
                        <strong>Ứng</strong>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <strong>{row.relative}</strong>
                      <br />
                      {row.canChi} · {row.element}
                    </td>
                    <td>{row.animal}</td>
                    <td>
                      <strong>{row.strength}</strong>
                      <br />
                      {flags.join(' · ') || '—'}
                    </td>
                    <td>
                      {hidden ? (
                        <>
                          <strong>{hidden.relative}</strong>
                          <br />
                          {hidden.canChi} · {hidden.element}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {after ? (
                        <>
                          <strong>{after.relative}</strong>
                          <br />
                          {after.canChi} · {after.element}
                          <br />
                          <small>{moving ? 'Hào biến' : 'Tham chiếu · tĩnh'}</small>
                        </>
                      ) : (
                        'Không biến'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="small-note">
          Vượng suy ở đây chỉ theo quan hệ hành tháng. Nhật xung không tự coi là ám động. Các hào
          không động trong cột quẻ biến chỉ là tham chiếu, không tự có tác động động.
        </p>
      </section>
      <section className="card padded reading-analysis">
        <h2>Vì sao ra quẻ này?</h2>
        {reading.explanations.map((text, i) => (
          <div className="explanation-step">
            <span>{i + 1}</span>
            <p>{text}</p>
          </div>
        ))}
        <h3>Đọc theo Mai Hoa · Thể–Dụng</h3>
        <p>{reading.maiHoa}</p>
        <h3>Dụng thần đang xét: {reading.target}</h3>
        {reading.useNotes.map((text) => (
          <p className="reading-callout">{text}</p>
        ))}
        <h3>Hào động & Phi–Phục ảnh hưởng ra sao?</h3>
        {reading.influence.length ? (
          <ul>
            {reading.influence.map((text) => (
              <li>{text}</li>
            ))}
          </ul>
        ) : (
          <p>
            Quẻ tĩnh, không có hào động để tính tác động động–biến. Vẫn cần xét Nhật, Nguyệt,
            Thế–Ứng và điều đang hỏi.
          </p>
        )}
        <p className="small-note">
          App giải thích các quan hệ đã tính bằng quy tắc. Đây chưa phải kết luận cát/hung toàn
          diện; dùng nội dung và bối cảnh để luận tiếp.
        </p>
        <button className="button primary full" onClick={onCopy}>
          <Icon name="copy" size={18} />
          Copy hồ sơ chi tiết cho AI luận giải
        </button>
      </section>
      <section className="card padded" ref={articleSection}>
        <div className="section-heading">
          <h2>Nội dung các quẻ liên quan</h2>
        </div>
        <div className="article-tabs" aria-label="Chọn quẻ để đọc">
          {panels
            .filter((panel) => panel.hex)
            .map((panel) => (
              <button
                className={active === panel.kind ? 'selected' : ''}
                onClick={() => setArticle(panel.kind)}
                aria-pressed={active === panel.kind}
              >
                {panel.label}
              </button>
            ))}
        </div>
        <HexagramContent
          key={displayed.number}
          number={displayed.number}
          moving={active === 'main' ? result.movingLines : []}
        />
      </section>
    </div>
  );
}
