import { lazy, Suspense } from 'preact/compat';
import { useState } from 'preact/hooks';
import { PageTitle, Tabs } from '../../components/Shared';
import { Icon } from '../../components/Icon';
import { cast, byNumbers, bySerial, byTime } from '../../lib/oracle';
import { todayParts, isoDate, VN } from '../../lib/lunar';
import hexagrams from '../../data/64que.json';
import { copyText } from '../../lib/storage';
import { useFamily } from '../../context';
const Astrology = lazy(() => import('../tuvi'));
function Lines({
  bits,
  moving = 0,
  onChange,
}: {
  bits: number;
  moving?: number;
  onChange?: (i: number) => void;
}) {
  return (
    <div className="hex-lines">
      {[5, 4, 3, 2, 1, 0].map((i) => {
        const line = (
          <>
            <span className={'hex-line ' + ((bits >> i) & 1 ? 'yang' : 'yin')}>
              <i />
              <i />
            </span>
            <small>
              {i + 1}
              {moving === i + 1 ? ' ◉' : ''}
            </small>
          </>
        );
        return onChange ? (
          <button
            type="button"
            aria-label={`Hào ${i + 1}: ${(bits >> i) & 1 ? 'dương' : 'âm'}, nhấn để đổi`}
            className={moving === i + 1 ? 'moving' : ''}
            onClick={() => onChange(i)}
          >
            {line}
          </button>
        ) : (
          <div className={moving === i + 1 ? 'moving' : ''}>{line}</div>
        );
      })}
    </div>
  );
}
function Divination() {
  const { toast } = useFamily(),
    [method, setMethod] = useState('time'),
    [bits, setBits] = useState(63),
    [moving, setMoving] = useState(1),
    [date, setDate] = useState(isoDate(todayParts())),
    [time, setTime] = useState(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: VN,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(new Date()),
    ),
    [serial, setSerial] = useState(''),
    [a, setA] = useState(''),
    [b, setB] = useState(''),
    [result, setResult] = useState<ReturnType<typeof cast> | null>(null),
    [note, setNote] = useState(''),
    [error, setError] = useState('');
  function generate(e: Event) {
    e.preventDefault();
    try {
      setError('');
      if (method === 'lines') {
        setResult(cast(bits, moving));
        setNote(`Nhập sáu hào trực tiếp; đánh số từ dưới lên; hào động ${moving || 'không có'}.`);
      } else if (method === 'time') {
        const r = byTime(date, time);
        setResult(r.result);
        setNote(`Lập lúc ${time}, ${date} (UTC+7). ${r.note}`);
      } else if (method === 'serial') {
        setResult(bySerial(serial));
        setNote(
          `Sê-ri ${serial}. Bỏ ký tự không phải số, chia chuỗi chữ số thành hai nửa; nửa đầu dài hơn nếu lẻ.`,
        );
      } else {
        setResult(byNumbers(a, b));
        setNote(`Thượng số ${a}; hạ số ${b}.`);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function copy() {
    if (!result) return;
    const main = hexagrams[result.main.number - 1],
      mutual = hexagrams[result.mutual.number - 1],
      changed = result.changed && hexagrams[result.changed.number - 1];
    const text = `Xin giải thích quẻ Kinh Dịch sau theo hướng dễ hiểu, phân biệt ý nghĩa truyền thống và suy luận. Không khẳng định dự đoán chắc chắn.\n\nDỮ LIỆU\n${note}\nQuy ước Mai Hoa: Càn 1, Đoài 2, Ly 3, Chấn 4, Tốn 5, Khảm 6, Cấn 7, Khôn 8; dư 0 lấy 8 hoặc 6. Với hai số, hào động lấy tổng hai số chia 6.\nQuẻ chủ #${result.main.number}: ${main[0]}\nHào từ dưới lên: ${Array.from({ length: 6 }, (_, i) => ((result.main.bits >> i) & 1 ? 'Dương' : 'Âm')).join(' – ')}\nHào động: ${result.moving || 'Không có'}\nQuẻ hỗ #${result.mutual.number}: ${mutual[0]}\nQuẻ biến: ${changed ? changed[0] : 'Không có'}\n${result.moving ? `Thể: ${result.moving <= 3 ? result.main.upper.name : result.main.lower.name}; Dụng: ${result.moving <= 3 ? result.main.lower.name : result.main.upper.name}.` : ''}\n\nLỜI THAM KHẢO DO APP BIÊN SOẠN\n${main[1]}\n\nCÂU HỎI CỦA TÔI: [Điền bối cảnh tại đây]`;
    try {
      await copyText(text);
      toast('Đã copy quẻ và lời luận để mang sang AI.');
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <>
      <div className="oracle-layout">
        <section className="card padded">
          <h2>Bạn muốn lập quẻ thế nào?</h2>
          <label className="field">
            Cách nhập
            <select value={method} onChange={(e) => setMethod(e.currentTarget.value)}>
              <option value="time">Theo ngày giờ</option>
              <option value="lines">Nhập sáu hào Âm / Dương</option>
              <option value="serial">Theo số sê-ri tiền</option>
              <option value="numbers">Theo hai số tự chọn</option>
            </select>
          </label>
          <form onSubmit={generate}>
            {method === 'time' ? (
              <div className="form-grid">
                <label>
                  Ngày dương
                  <input
                    type="date"
                    min="1900-01-01"
                    max="2100-12-31"
                    required
                    value={date}
                    onInput={(e) => setDate(e.currentTarget.value)}
                  />
                </label>
                <label>
                  Giờ Việt Nam
                  <input
                    type="time"
                    required
                    value={time}
                    onInput={(e) => setTime(e.currentTarget.value)}
                  />
                </label>
                <p className="small-note wide">
                  Dùng chi năm + tháng âm + ngày âm làm thượng quái; thêm chi giờ làm hạ quái và hào
                  động. Giờ Tý từ 23:00; giữ ngày âm của ngày đã chọn. Tháng nhuận dùng cùng số
                  tháng.
                </p>
              </div>
            ) : method === 'lines' ? (
              <>
                <p className="small-note">Nhấn từng hào để đổi âm/dương. Hào 1 ở dưới cùng.</p>
                <Lines bits={bits} moving={moving} onChange={(i) => setBits(bits ^ (1 << i))} />
                <label>
                  Hào động
                  <select value={moving} onChange={(e) => setMoving(Number(e.currentTarget.value))}>
                    <option value={0}>Không có hào động</option>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option value={n}>Hào {n}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : method === 'serial' ? (
              <>
                <label>
                  Số sê-ri tiền
                  <input
                    placeholder="VD: AB12345678"
                    required
                    maxLength={110}
                    value={serial}
                    onInput={(e) => setSerial(e.currentTarget.value)}
                  />
                </label>
                <p className="small-note">
                  Quy ước của app: tách chữ số thành hai nửa làm thượng/hạ số; lấy tổng hai số tính
                  hào động. Đây là một cách lập quẻ, không phải quy tắc duy nhất.
                </p>
              </>
            ) : (
              <div className="form-grid">
                <label>
                  Thượng số
                  <input
                    inputMode="numeric"
                    pattern="[0-9]+"
                    maxLength={100}
                    required
                    value={a}
                    onInput={(e) => setA(e.currentTarget.value)}
                  />
                </label>
                <label>
                  Hạ số
                  <input
                    inputMode="numeric"
                    pattern="[0-9]+"
                    maxLength={100}
                    required
                    value={b}
                    onInput={(e) => setB(e.currentTarget.value)}
                  />
                </label>
              </div>
            )}
            {error && (
              <p className="warning" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="button primary full">
              <Icon name="oracle" size={19} />
              Lập quẻ
            </button>
          </form>
        </section>
        <section className="card padded oracle-result">
          {result ? (
            <>
              <div className="eyebrow">QUẺ CHỦ · SỐ {result.main.number}</div>
              <h2 className="oracle-name">{hexagrams[result.main.number - 1][0]}</h2>
              <Lines bits={result.main.bits} moving={result.moving} />
              <div className="oracle-summary">
                <span>
                  Thượng: {result.main.upper.name} · {result.main.upper.element}
                </span>
                <span>
                  Hạ: {result.main.lower.name} · {result.main.lower.element}
                </span>
              </div>
              <p className="oracle-meaning">{hexagrams[result.main.number - 1][1]}</p>
              <dl>
                <dt>Quẻ hỗ</dt>
                <dd>{hexagrams[result.mutual.number - 1][0]}</dd>
                <dt>Quẻ biến</dt>
                <dd>
                  {result.changed ? hexagrams[result.changed.number - 1][0] : 'Không có hào động'}
                </dd>
                {result.moving > 0 && (
                  <>
                    <dt>Thể / Dụng</dt>
                    <dd>
                      {result.moving <= 3 ? result.main.upper.name : result.main.lower.name} /{' '}
                      {result.moving <= 3 ? result.main.lower.name : result.main.upper.name}
                    </dd>
                  </>
                )}
              </dl>
              <p className="small-note">{note}</p>
              <button className="button primary full" onClick={copy}>
                <Icon name="copy" size={18} />
                Copy để hỏi AI
              </button>
            </>
          ) : (
            <div className="empty oracle-empty">
              <span className="oracle-symbol">☯</span>
              <h3>Một quẻ, một góc nhìn</h3>
              <p>Chọn cách nhập để xem quẻ chủ, quẻ hỗ, quẻ biến và lời tham khảo.</p>
            </div>
          )}
        </section>
      </div>
      <p className="small-note">
        Chỉ mang tính tham khảo. Lời luận là nội dung ngắn do app biên soạn, không phải nguyên văn
        Kinh Dịch. App không gọi AI; bạn chủ động sao chép để hỏi thêm.
      </p>
    </>
  );
}
export default function Oracle() {
  const [tab, setTab] = useState<'dich' | 'tuvi'>('dich');
  return (
    <>
      <PageTitle
        eyebrow="THÊM MỘT GÓC NHÌN"
        title="Kinh Dịch & Tử Vi"
        description="Chiêm nghiệm để hiểu mình, tham khảo để suy ngẫm."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: 'dich', label: 'Kinh Dịch' },
          { value: 'tuvi', label: 'Tử Vi' },
        ]}
      />
      {tab === 'dich' ? (
        <Divination />
      ) : (
        <Suspense fallback={<div className="loading">Đang tải bộ an sao…</div>}>
          <Astrology />
        </Suspense>
      )}
    </>
  );
}
