import { useState } from 'preact/hooks';
import { createChart } from '../../lib/astrology';
import { branches } from '../../lib/lunar';
import { Icon } from '../../components/Icon';
import { copyText } from '../../lib/storage';
import { useFamily } from '../../context';
import meanings from '../../data/tuvi-luangiai.json';
const positions = [
  [4, 1],
  [3, 1],
  [2, 1],
  [1, 1],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 4],
  [3, 4],
  [4, 4],
  [4, 3],
  [4, 2],
];
export default function Astrology() {
  const { toast } = useFamily(),
    [type, setType] = useState<'solar' | 'lunar'>('solar'),
    [date, setDate] = useState('1990-01-01'),
    [gender, setGender] = useState<'男' | '女'>('男'),
    [hour, setHour] = useState(0),
    [leap, setLeap] = useState(false),
    [fixLeap, setFixLeap] = useState(true),
    [result, setResult] = useState<ReturnType<typeof createChart> | null>(null),
    [selected, setSelected] = useState(0),
    [error, setError] = useState('');
  const palace = result?.chart.palaces[selected];
  function submit(e: Event) {
    e.preventDefault();
    try {
      setResult(createChart(date, type, leap, hour, gender, fixLeap));
      setSelected(0);
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  }
  async function copy() {
    if (!result) return;
    const c = result.chart,
      l = result.lunar,
      text = [
        `Xin giải thích lá số Tử Vi sau; chỉ tham khảo, không dự đoán chắc chắn.`,
        `Ngày sinh âm lịch Việt Nam UTC+7: ${l.day}/${l.month}/${l.year}${l.leap ? ' nhuận' : ''}. Giới tính: ${gender === '男' ? 'Nam' : 'Nữ'}. Giờ: ${c.time}.`,
        `Quy ước an sao: iztro default; đổi năm mùng 1 Tết; giờ Tý muộn giữ ngày hiện tại; tháng nhuận ${fixLeap ? 'chia nửa đầu/cuối tháng' : 'giữ số tháng'}.`,
        `Cục: ${c.fiveElementsClass}; Mệnh tại ${c.earthlyBranchOfSoulPalace}; Thân tại ${c.earthlyBranchOfBodyPalace}.`,
        ...c.palaces.map(
          (p) =>
            `${p.name} (${p.heavenlyStem} ${p.earthlyBranch})${p.isBodyPalace ? ' [Thân]' : ''}: ${[...p.majorStars, ...p.minorStars, ...p.adjectiveStars].map((s) => `${s.name}${s.brightness ? ' ' + s.brightness : ''}${s.mutagen ? ' ' + s.mutagen : ''}`).join(', ')}`,
        ),
        'Câu hỏi của tôi: [Điền thêm bối cảnh]',
      ].join('\n');
    try {
      await copyText(text);
      toast('Đã sao chép dữ liệu lá số.');
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <>
      <section className="card padded">
        <h2>Lập lá số của bạn</h2>
        <form className="form-grid astrology-form" onSubmit={submit}>
          <label>
            Loại ngày sinh
            <select
              value={type}
              onChange={(e) => setType(e.currentTarget.value as 'solar' | 'lunar')}
            >
              <option value="solar">Dương lịch</option>
              <option value="lunar">Âm lịch</option>
            </select>
          </label>
          <label>
            Ngày sinh
            {type === 'solar' ? (
              <input
                type="date"
                required
                min="1900-01-01"
                max="2100-12-31"
                value={date}
                onInput={(e) => setDate(e.currentTarget.value)}
              />
            ) : (
              <input
                required
                aria-label="Ngày âm dạng năm-tháng-ngày"
                placeholder="1990-01-01"
                pattern="[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}"
                value={date}
                onInput={(e) => setDate(e.currentTarget.value)}
              />
            )}
          </label>
          <label>
            Giới tính dùng an sao
            <select
              value={gender}
              onChange={(e) => setGender(e.currentTarget.value as '男' | '女')}
            >
              <option value="男">Nam</option>
              <option value="女">Nữ</option>
            </select>
          </label>
          <label>
            Giờ sinh · UTC+7
            <select value={hour} onChange={(e) => setHour(Number(e.currentTarget.value))}>
              <option value={0}>Tý sớm · 00:00–00:59</option>
              {branches.slice(1).map((b, i) => (
                <option value={i + 1}>
                  {b} · {String(i * 2 + 1).padStart(2, '0')}:00–{String(i * 2 + 2).padStart(2, '0')}
                  :59
                </option>
              ))}
              <option value={12}>Tý muộn · 23:00–23:59</option>
            </select>
          </label>
          {type === 'lunar' && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={leap}
                onChange={(e) => setLeap(e.currentTarget.checked)}
              />
              Tháng nhuận
            </label>
          )}
          <label className="check-label wide">
            <input
              type="checkbox"
              checked={fixLeap}
              onChange={(e) => setFixLeap(e.currentTarget.checked)}
            />
            Tháng nhuận: nửa đầu theo tháng trước, nửa sau theo tháng kế
          </label>
          {error && (
            <p className="warning wide" role="alert">
              {error}
            </p>
          )}
          <button className="button primary" type="submit">
            <Icon name="oracle" size={18} />
            Lập lá số
          </button>
        </form>
      </section>
      {result && (
        <>
          <div className="section-heading">
            <h2>Lá số tham khảo</h2>
            <button className="button secondary" onClick={copy}>
              <Icon name="copy" size={17} />
              Copy để hỏi AI
            </button>
          </div>
          <p className="small-note">
            Chạm vào từng cung để xem đủ sao và ghi chú. Vuốt ngang bảng trên màn hình nhỏ.
          </p>
          <div className="chart-scroll">
            <div className="astrology-chart">
              <div className="chart-center">
                <div className="eyebrow">LÁ SỐ TỬ VI</div>
                <h2>{result.chart.fiveElementsClass}</h2>
                <p>
                  Âm lịch {result.lunar.day}/{result.lunar.month}/{result.lunar.year}
                  {result.lunar.leap ? ' nhuận' : ''}
                </p>
                <p>
                  {result.chart.time} · {gender === '男' ? 'Nam' : 'Nữ'}
                </p>
                <dl>
                  <dt>Mệnh tại</dt>
                  <dd>{result.chart.earthlyBranchOfSoulPalace}</dd>
                  <dt>Thân tại</dt>
                  <dd>{result.chart.earthlyBranchOfBodyPalace}</dd>
                  <dt>Mệnh chủ</dt>
                  <dd>{result.chart.soul}</dd>
                  <dt>Thân chủ</dt>
                  <dd>{result.chart.body}</dd>
                </dl>
              </div>
              {result.chart.palaces.map((p, i) => (
                <button
                  className={'palace ' + (selected === i ? 'selected' : '')}
                  style={{ gridRow: positions[i][0], gridColumn: positions[i][1] }}
                  onClick={() => setSelected(i)}
                  aria-pressed={selected === i}
                >
                  <div className="palace-heading">
                    <small>
                      {p.heavenlyStem} {p.earthlyBranch}
                    </small>
                    {p.isBodyPalace && <span className="badge">Thân</span>}
                  </div>
                  <strong>{p.name}</strong>
                  <div className="major-stars">
                    {p.majorStars.length ? (
                      p.majorStars.map((s) => (
                        <div>
                          {s.name}
                          <small>{s.brightness}</small>
                          {s.mutagen && <b>{s.mutagen}</b>}
                        </div>
                      ))
                    ) : (
                      <span className="small-note">Vô chính diệu</span>
                    )}
                  </div>
                  <div className="minor-stars">
                    {p.minorStars.map((s) => (
                      <span>
                        {s.name}
                        {s.mutagen && <b> {s.mutagen}</b>}
                      </span>
                    ))}
                  </div>
                  <small className="palace-age">Đại hạn {p.decadal.range.join('–')}</small>
                </button>
              ))}
            </div>
          </div>
          {palace && (
            <section className="card padded">
              <h2>
                Cung {palace.name} · {palace.earthlyBranch}
              </h2>
              <div className="star-tags">
                {[...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars].map((s) => (
                  <span className="badge">
                    {s.name}
                    {s.brightness ? ' · ' + s.brightness : ''}
                    {s.mutagen ? ' · ' + s.mutagen : ''}
                  </span>
                ))}
              </div>
              {[...palace.majorStars, ...palace.minorStars].map(
                (s) =>
                  (meanings as Record<string, string>)[s.name] && (
                    <p>
                      <strong>{s.name}: </strong>
                      {(meanings as Record<string, string>)[s.name]}
                    </p>
                  ),
              )}
              {!palace.majorStars.length && (
                <p>
                  Cung vô chính diệu: không luận riêng chỉ từ việc thiếu chính tinh; cần xem các
                  cung liên hệ.
                </p>
              )}
            </section>
          )}
        </>
      )}
      <p className="small-note">
        Chỉ mang tính tham khảo. Bộ an sao iztro dùng quy tắc mặc định; có thể khác trường phái Tử
        Vi Việt Nam. Ngày âm được đổi theo UTC+7 trước khi an sao. Chưa nghiệm thu với lá số mẫu
        riêng của gia đình.{' '}
        <a
          href="https://docs.iztro.com/vi_VN/posts/config-n-plugin"
          target="_blank"
          rel="noopener noreferrer"
        >
          Xem quy tắc
        </a>
        .
      </p>
    </>
  );
}
