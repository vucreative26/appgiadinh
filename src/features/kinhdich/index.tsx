import { lazy, Suspense } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { PageTitle, Tabs } from '../../components/Shared';
import { Icon } from '../../components/Icon';
import { cast, castMany, byCoins, byNumbers, bySerial, byTime } from '../../lib/oracle';
import { analyse, calendarContext, detailedPrompt, relatives } from '../../lib/liuyao';
import { todayParts, isoDate, VN } from '../../lib/lunar';
import { copyText } from '../../lib/storage';
import { useFamily } from '../../context';
import { HexLines } from './HexLines';
import { ReadingView } from './ReadingView';
import { HexagramLibrary, OracleReference } from './HexagramContent';
import './oracle.css';
const Astrology = lazy(() => import('../tuvi'));
type Session = { result: ReturnType<typeof cast>; note: string; date: string; time: string };
function Divination() {
  const { toast } = useFamily();
  const [view, setView] = useState<'cast' | 'library' | 'reference'>('cast');
  const [method, setMethod] = useState('time'),
    [bits, setBits] = useState(63),
    [moving, setMoving] = useState<number[]>([1]);
  const [coins, setCoins] = useState([7, 7, 7, 7, 7, 7]);
  const [date, setDate] = useState(isoDate(todayParts()));
  const [time, setTime] = useState(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: VN,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date()),
  );
  const [serial, setSerial] = useState(''),
    [a, setA] = useState(''),
    [b, setB] = useState('');
  const [question, setQuestion] = useState(''),
    [target, setTarget] = useState('Thế');
  const [session, setSession] = useState<Session | null>(null),
    [error, setError] = useState('');
  const reading = session ? analyse(session.result, session.date, session.time, target) : null;
  useEffect(() => {
    if (!session) return;
    requestAnimationFrame(() =>
      document.querySelector('.reading-view')?.scrollIntoView({
        block: 'start',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      }),
    );
  }, [session]);
  function generate(e: Event) {
    e.preventDefault();
    try {
      setError('');
      calendarContext(date, time);
      let result: ReturnType<typeof cast>, note: string;
      if (method === 'lines') {
        result = castMany(bits, moving);
        note =
          'Nhập sáu hào trực tiếp, hào 1 từ dưới lên. Hào động: ' +
          (moving.join(', ') || 'không có') +
          '.';
      } else if (method === 'coins') {
        result = byCoins(coins);
        note =
          'Tổng ba đồng xu mỗi hào, từ dưới lên: ' +
          coins.join(' – ') +
          '. Quy ước một mặt 2, mặt kia 3; 6 lão âm động, 7 thiếu dương tĩnh, 8 thiếu âm tĩnh, 9 lão dương động.';
      } else if (method === 'time') {
        const value = byTime(date, time);
        result = value.result;
        note = 'Mai Hoa theo ngày giờ. ' + value.note;
      } else if (method === 'serial') {
        result = bySerial(serial);
        note =
          'Sê-ri ' +
          serial +
          '. Bỏ ký tự không phải số, chia chữ số thành hai nửa; nửa đầu dài hơn nếu lẻ. Thượng/hạ số chia 8, tổng chia 6 lấy hào động. Đây là quy ước số của app, không phải phép gieo ba đồng xu.';
      } else {
        result = byNumbers(a, b);
        note =
          'Mai Hoa hai số: thượng số ' +
          a +
          '; hạ số ' +
          b +
          '. Mỗi số chia 8 lấy quái, tổng chia 6 lấy hào động; dư 0 lấy 8 hoặc 6.';
      }
      setSession({ result, note, date, time });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa lập được quẻ.');
    }
  }
  async function copy() {
    if (!session || !reading) return;
    try {
      await copyText(detailedPrompt(session.result, reading, session.note, question));
      toast('Đã copy đầy đủ quẻ, Lục hào, cổ văn và câu hỏi cho AI.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Chưa sao chép được.');
    }
  }
  return (
    <>
      <Tabs
        value={view}
        onChange={setView}
        options={[
          { value: 'cast', label: 'Lập & luận quẻ' },
          { value: 'library', label: '64 quẻ' },
          { value: 'reference', label: 'Kiến thức' },
        ]}
      />
      {view === 'library' ? (
        <HexagramLibrary />
      ) : view === 'reference' ? (
        <OracleReference />
      ) : (
        <div className="oracle-workspace">
          <section className="card padded casting-form">
            <div className="eyebrow">MỘT VIỆC · MỘT CÂU HỎI</div>
            <h2>Lập quẻ cho điều bạn đang nghĩ</h2>
            <form onSubmit={generate}>
              <label>
                Câu hỏi & bối cảnh
                <textarea
                  rows={3}
                  maxLength={3000}
                  placeholder="Bạn đang hỏi việc gì, trong khoảng thời gian nào?"
                  value={question}
                  onInput={(e) => setQuestion(e.currentTarget.value)}
                />
              </label>
              <label>
                Cách lập quẻ
                <select value={method} onChange={(e) => setMethod(e.currentTarget.value)}>
                  <option value="time">Mai Hoa · theo ngày giờ</option>
                  <option value="lines">Nhập Âm / Dương & chọn hào động</option>
                  <option value="coins">Lục hào · nhập kết quả ba đồng xu</option>
                  <option value="serial">Mai Hoa · số sê-ri tiền</option>
                  <option value="numbers">Mai Hoa · hai số tự chọn</option>
                </select>
              </label>
              <div className="form-grid">
                <label>
                  Ngày lập quẻ
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
              </div>
              <p className="small-note">
                Dùng thời điểm này để an Can Chi, Nhật/Nguyệt và Lục thú cho mọi cách nhập. Kết quả
                chỉ đổi khi bấm Lập quẻ.
              </p>
              {method === 'time' ? (
                <p className="notice">
                  Mai Hoa: chi năm âm + tháng âm + ngày âm lấy thượng quái; cộng chi giờ lấy hạ quái
                  và một hào động. Tháng nhuận dùng cùng số tháng, 23:00 vào giờ Tý nhưng giữ ngày
                  đã chọn.
                </p>
              ) : method === 'lines' ? (
                <>
                  <p className="small-note">
                    Nhấn từng hào để đổi âm/dương. Chọn được nhiều hào động, hoặc bỏ hết để lập quẻ
                    tĩnh.
                  </p>
                  <HexLines
                    bits={bits}
                    moving={moving}
                    onChange={(i) => setBits(bits ^ (1 << i))}
                  />
                  <fieldset className="moving-picker">
                    <legend>Hào động · đánh số từ dưới lên</legend>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <label>
                        <input
                          type="checkbox"
                          checked={moving.includes(n)}
                          onChange={() =>
                            setMoving((current) =>
                              current.includes(n)
                                ? current.filter((value) => value !== n)
                                : [...current, n].sort((x, y) => x - y),
                            )
                          }
                        />
                        Hào {n}
                      </label>
                    ))}
                  </fieldset>
                </>
              ) : method === 'coins' ? (
                <>
                  <p className="small-note">
                    Gieo ba đồng xu sáu lần, ghi từ dưới lên. Chọn một mặt bằng 2, mặt còn lại bằng
                    3 và giữ quy ước suốt lần gieo.
                  </p>
                  <div className="coin-inputs">
                    {[5, 4, 3, 2, 1, 0].map((i) => (
                      <label>
                        Hào {i + 1}
                        {i === 0 ? ' · lần gieo đầu' : ''}
                        <select
                          value={coins[i]}
                          onChange={(e) => {
                            const next = Number(e.currentTarget.value);
                            setCoins((current) =>
                              current.map((value, index) => (index === i ? next : value)),
                            );
                          }}
                        >
                          <option value={6}>6 · Âm động</option>
                          <option value={7}>7 · Dương tĩnh</option>
                          <option value={8}>8 · Âm tĩnh</option>
                          <option value={9}>9 · Dương động</option>
                        </select>
                      </label>
                    ))}
                  </div>
                </>
              ) : method === 'serial' ? (
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
              ) : (
                <div className="form-grid">
                  <label>
                    Thượng số
                    <input
                      inputMode="numeric"
                      pattern="[0-9]+"
                      required
                      maxLength={100}
                      value={a}
                      onInput={(e) => setA(e.currentTarget.value)}
                    />
                  </label>
                  <label>
                    Hạ số
                    <input
                      inputMode="numeric"
                      pattern="[0-9]+"
                      required
                      maxLength={100}
                      value={b}
                      onInput={(e) => setB(e.currentTarget.value)}
                    />
                  </label>
                </div>
              )}
              <label>
                Dụng thần muốn xét
                <select value={target} onChange={(e) => setTarget(e.currentTarget.value)}>
                  <option value="Thế">Thế · bản thân / tổng quát</option>
                  <option value="Ứng">Ứng · phía đối diện / hoàn cảnh</option>
                  {relatives.map((kind) => (
                    <option value={kind}>{kind}</option>
                  ))}
                </select>
              </label>
              <p className="small-note">
                Tiền/nguồn lực thường xét Thê tài; công việc xét Quan quỷ; học hành/giấy tờ xét Phụ
                mẫu; con cái/đầu ra xét Tử tôn. Cần chọn theo đúng việc hỏi. Đổi lựa chọn này sẽ cập
                nhật phần phân tích của quẻ đang xem.
              </p>
              {error && (
                <p className="warning" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="button primary full">
                <Icon name="oracle" size={19} />
                Lập quẻ & xem chi tiết
              </button>
            </form>
          </section>
          {session && reading ? (
            <ReadingView
              key={
                session.result.main.bits +
                '-' +
                session.result.movingLines.join() +
                '-' +
                session.date +
                '-' +
                session.time
              }
              result={session.result}
              reading={reading}
              note={session.note}
              onCopy={() => void copy()}
            />
          ) : (
            <section className="card padded oracle-intro">
              <span className="oracle-symbol">☯</span>
              <h2>Một quẻ, đủ ba lớp nhìn</h2>
              <p>
                Quẻ gốc cho tình thế ban đầu. Quẻ hỗ lấy cấu trúc bên trong. Quẻ biến hình thành từ
                các hào động.
              </p>
              <div className="intro-checks">
                <span>
                  <Icon name="check" size={17} />
                  Bảng Nạp giáp & Lục thân
                </span>
                <span>
                  <Icon name="check" size={17} />
                  Giải thích sinh khắc từng hào
                </span>
                <span>
                  <Icon name="check" size={17} />
                  Copy hồ sơ chi tiết cho AI
                </span>
              </div>
              <button
                className="button secondary"
                onClick={() => {
                  try {
                    calendarContext(date, time);
                  } catch (error) {
                    setError(error instanceof Error ? error.message : 'Ngày giờ không hợp lệ.');
                    return;
                  }
                  setError('');
                  setMethod('lines');
                  setBits(42);
                  setMoving([2]);
                  setSession({
                    result: cast(42, 2),
                    note: 'Ví dụ cấu trúc: Hỏa Thủy Vị Tế, hào 2 động thành Hỏa Địa Tấn. Ngày giờ lấy từ ô đang chọn.',
                    date,
                    time,
                  });
                }}
              >
                Xem mẫu Vị Tế → Tấn
              </button>
            </section>
          )}
        </div>
      )}
      <p className="small-note">
        Lời diễn nghĩa và phần giải thích quy tắc do app biên soạn để tham khảo. Nút Copy chứa dữ
        liệu chi tiết để bạn chủ động mang sang AI; app không gọi AI trực tiếp.
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
        description="Lập quẻ, hiểu từng hào và tra cứu cổ văn."
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
