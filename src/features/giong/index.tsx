import { useState } from 'preact/hooks';
import { useFamily } from '../../context';
import { PageTitle, AuthGate, Empty, Confirm } from '../../components/Shared';
import { Icon } from '../../components/Icon';
import {
  nextMemorial,
  eventOccurrences,
  eventKinds,
  familyNames,
  familyLabel,
  eventTitle,
  eventDateLabel,
  validateEvent,
  type Memorial,
} from '../../lib/memorials';
import { todayParts, fromJD, jd } from '../../lib/lunar';
type Value = Omit<Memorial, 'id'>;
const blank: Value = {
  name: '',
  relation: '',
  side: 'noi',
  kind: 'birthday',
  calendar: 'solar',
  repeat: 'yearly',
  family: 'shared',
  branch: 'chung',
  lunarDay: 1,
  lunarMonth: 1,
  isLeapMonth: false,
  leapPolicy: 'regular',
  note: '',
};
export function EventEditor({
  initial,
  editing,
  onSave,
  onClose,
}: {
  initial: Value;
  editing: boolean;
  onSave: (v: Value) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const solar = value.calendar === 'solar',
    monthly = value.repeat === 'monthly';
  const update = (patch: Partial<Value>) => setValue({ ...value, ...patch });
  async function save(e: Event) {
    e.preventDefault();
    if (busy) return;
    setError('');
    try {
      const data = {
        ...value,
        name: value.name.trim(),
        relation: value.relation.trim(),
        isLeapMonth: !solar && !monthly && value.isLeapMonth,
        branch: value.family === 'shared' ? ('chung' as const) : value.branch,
      };
      if (data.repeat !== 'once') delete data.eventYear;
      validateEvent(data);
      setBusy(true);
      await onSave(data);
      onClose();
    } catch (e) {
      setError(
        (e as { code?: string }).code === 'permission-denied'
          ? 'Chưa lưu được. Cần cập nhật khối Rules cho Sổ ngày yêu thương theo hướng dẫn đi kèm; giữ nguyên UID thiết bị.'
          : e instanceof Error
            ? e.message
            : 'Chưa lưu được. Kiểm tra kết nối rồi thử lại.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card padded love-editor">
      <div className="section-heading">
        <h2>{editing ? 'Chỉnh ngày yêu thương' : 'Ghi một ngày yêu thương'}</h2>
        <button
          className="icon-button"
          aria-label="Đóng biểu mẫu"
          disabled={busy}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <form className="form-grid" onSubmit={save}>
        <label>
          Loại ngày
          <select
            value={value.kind || 'memorial'}
            onChange={(e) => update({ kind: e.currentTarget.value as Value['kind'] })}
          >
            {Object.entries(eventKinds).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tên người / dịp đáng nhớ
          <input
            required
            maxLength={100}
            placeholder="VD: Sinh nhật mẹ, Ngày cưới"
            value={value.name}
            onInput={(e) => update({ name: e.currentTarget.value })}
          />
        </label>
        <label>
          Quan hệ
          <input
            maxLength={100}
            placeholder="VD: Mẹ, ông nội, hai chúng mình"
            value={value.relation}
            onInput={(e) => update({ relation: e.currentTarget.value })}
          />
        </label>
        <label>
          Bên gia đình
          <select
            value={value.family || 'unspecified'}
            onChange={(e) => update({ family: e.currentTarget.value as Value['family'] })}
          >
            {Object.entries(familyNames).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {value.family !== 'shared' && (
          <label>
            Nhánh gia đình
            <select
              value={value.branch || value.side}
              onChange={(e) =>
                update({
                  branch: e.currentTarget.value as Value['branch'],
                  side: e.currentTarget.value === 'ngoai' ? 'ngoai' : 'noi',
                })
              }
            >
              <option value="chung">Không chia nội / ngoại</option>
              <option value="noi">Nội</option>
              <option value="ngoai">Ngoại</option>
            </select>
          </label>
        )}
        <label>
          Lịch sử dụng
          <select
            value={value.calendar || 'lunar'}
            onChange={(e) =>
              update({
                calendar: e.currentTarget.value as Value['calendar'],
                lunarDay: Math.min(value.lunarDay, e.currentTarget.value === 'lunar' ? 30 : 31),
                isLeapMonth: false,
              })
            }
          >
            <option value="solar">Dương lịch</option>
            <option value="lunar">Âm lịch Việt Nam</option>
          </select>
        </label>
        <label>
          Lặp lại
          <select
            value={value.repeat || 'yearly'}
            onChange={(e) =>
              update({
                repeat: e.currentTarget.value as Value['repeat'],
                eventYear:
                  e.currentTarget.value === 'once' ? value.eventYear || todayParts()[2] : undefined,
              })
            }
          >
            <option value="yearly">Hằng năm</option>
            <option value="monthly">Hằng tháng</option>
            <option value="once">Một lần</option>
          </select>
        </label>
        <label>
          Ngày
          <select
            value={value.lunarDay}
            onChange={(e) => update({ lunarDay: Number(e.currentTarget.value) })}
          >
            {Array.from({ length: solar ? 31 : 30 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        {!monthly && (
          <label>
            Tháng
            <select
              value={value.lunarMonth}
              onChange={(e) => update({ lunarMonth: Number(e.currentTarget.value) })}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
        )}
        {value.repeat === 'once' && (
          <label>
            Năm
            <input
              type="number"
              required
              min={1900}
              max={2100}
              value={value.eventYear}
              onInput={(e) => update({ eventYear: Number(e.currentTarget.value) })}
            />
          </label>
        )}
        {!solar && !monthly && (
          <label className="check-label">
            <input
              type="checkbox"
              checked={value.isLeapMonth}
              onChange={(e) => update({ isLeapMonth: e.currentTarget.checked })}
            />
            Ngày thuộc tháng nhuận
          </label>
        )}
        {!solar && !monthly && value.repeat !== 'once' && value.isLeapMonth && (
          <label>
            Cách nhắc tháng nhuận
            <select
              value={value.leapPolicy || 'regular'}
              onChange={(e) => update({ leapPolicy: e.currentTarget.value as Value['leapPolicy'] })}
            >
              <option value="regular">Dùng tháng thường cùng số</option>
              <option value="preferLeap">Ưu tiên tháng nhuận, không có thì tháng thường</option>
            </select>
          </label>
        )}
        <p className="small-note wide">
          {monthly
            ? 'Nhắc mỗi tháng; tháng thiếu dùng ngày cuối tháng. Lịch âm nhắc cả tháng thường và tháng nhuận.'
            : value.repeat === 'once'
              ? 'Ngày một lần phải tồn tại đúng trong năm đã chọn.'
              : 'Ngày 30 âm gặp tháng thiếu dùng ngày 29. Sinh nhật 29/2 được nhắc vào 28/2 trong năm không nhuận.'}{' '}
          Lịch tính theo giờ Việt Nam (UTC+7).
        </p>
        <label className="wide">
          Ghi chú
          <textarea
            rows={3}
            maxLength={2000}
            placeholder="Lời chúc, món quà, việc cần chuẩn bị…"
            value={value.note || ''}
            onInput={(e) => update({ note: e.currentTarget.value })}
          />
        </label>
        {error && (
          <p className="warning wide" role="alert">
            {error}
          </p>
        )}
        {busy && (
          <p className="small-note wide" role="status">
            Đang lưu và chờ xác nhận từ Firebase. Nếu mất mạng, kết nối lại để hoàn tất.
          </p>
        )}
        <div className="wide row">
          <button disabled={busy} className="button primary" type="submit">
            {busy ? 'Đang lưu…' : 'Lưu ngày yêu thương'}
          </button>
          <button disabled={busy} type="button" className="button secondary" onClick={onClose}>
            Hủy
          </button>
        </div>
      </form>
    </section>
  );
}
function Book() {
  const { memorials, cloud, toast } = useFamily(),
    [editing, setEditing] = useState<Memorial | null | undefined>(),
    [family, setFamily] = useState('all'),
    [branch, setBranch] = useState('all'),
    [kind, setKind] = useState('all'),
    [query, setQuery] = useState(''),
    [deleting, setDeleting] = useState<string | null>(null),
    [removing, setRemoving] = useState(false);
  const today = todayParts(),
    list = memorials
      .filter(
        (m) =>
          (family === 'all' || (m.family || 'unspecified') === family) &&
          (branch === 'all' || (m.branch || m.side) === branch) &&
          (kind === 'all' || (m.kind || 'memorial') === kind) &&
          `${m.name} ${m.relation} ${m.note || ''}`
            .toLocaleLowerCase('vi')
            .includes(query.toLocaleLowerCase('vi')),
      )
      .map((m) => ({ m, next: nextMemorial(m, today) }))
      .sort((a, b) => (a.next?.remaining ?? Infinity) - (b.next?.remaining ?? Infinity));
  return (
    <>
      <section className="love-banner">
        <span className="tile-icon lavender">
          <Icon name="heart" size={27} />
        </span>
        <div>
          <h2>Mỗi ngày nhớ, một điều thương</h2>
          <p>Sinh nhật, kỷ niệm và nếp nhà — cùng giữ trong một cuốn sổ.</p>
        </div>
        <button className="button primary" onClick={() => setEditing(null)}>
          <Icon name="plus" size={18} />
          Thêm ngày
        </button>
      </section>
      <div className="love-filters">
        <label>
          Tìm trong sổ
          <input
            type="search"
            placeholder="Tên, quan hệ, ghi chú…"
            value={query}
            onInput={(e) => setQuery(e.currentTarget.value)}
          />
        </label>
        <label>
          Loại ngày
          <select value={kind} onChange={(e) => setKind(e.currentTarget.value)}>
            <option value="all">Tất cả loại ngày</option>
            {Object.entries(eventKinds).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Bên gia đình
          <select value={family} onChange={(e) => setFamily(e.currentTarget.value)}>
            <option value="all">Tất cả gia đình</option>
            {Object.entries(familyNames).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nhánh
          <select value={branch} onChange={(e) => setBranch(e.currentTarget.value)}>
            <option value="all">Tất cả nhánh</option>
            <option value="noi">Nội</option>
            <option value="ngoai">Ngoại</option>
            <option value="chung">Không chia nội / ngoại</option>
          </select>
        </label>
      </div>
      {editing !== undefined && (
        <EventEditor
          key={editing?.id || 'new'}
          initial={
            editing
              ? {
                  ...editing,
                  kind: editing.kind || 'memorial',
                  calendar: editing.calendar || 'lunar',
                  repeat: editing.repeat || 'yearly',
                  family: editing.family || 'unspecified',
                  branch: editing.branch || editing.side,
                }
              : blank
          }
          editing={!!editing}
          onClose={() => setEditing(undefined)}
          onSave={async (value) => {
            if (!cloud) throw Error('Chưa kết nối gia đình.');
            await cloud.saveMemorial(value, editing?.id);
            toast('Đã ghi vào Sổ ngày yêu thương.');
          }}
        />
      )}
      {!list.length ? (
        <div className="card">
          <Empty title={memorials.length ? 'Chưa có ngày phù hợp bộ lọc' : 'Một cuốn sổ để thương'}>
            Ghi ngày của người thân và những dịp muốn nhớ. Các ngày sẽ xuất hiện trên lịch và
            Dashboard.
          </Empty>
        </div>
      ) : (
        <div className="memorial-grid">
          {list.map(({ m, next }) => {
            const dates =
              m.repeat === 'once'
                ? next
                  ? [next]
                  : []
                : eventOccurrences(
                    m,
                    today,
                    fromJD(Math.min(jd(31, 12, 2100), jd(...today) + 800)),
                  ).slice(0, 2);
            return (
              <section className="card padded love-event" key={m.id}>
                <div className="section-heading">
                  <span className={'badge event-' + (m.kind || 'memorial')}>
                    {eventKinds[m.kind || 'memorial']}
                  </span>
                  <span className={'badge ' + (next && next.remaining <= 7 ? 'urgent' : '')}>
                    {next?.remaining === 0
                      ? 'Hôm nay'
                      : next
                        ? `Còn ${next.remaining} ngày`
                        : 'Không còn lịch sắp tới'}
                  </span>
                </div>
                <h2>{m.name}</h2>
                <p>
                  {m.relation && `${m.relation} · `}
                  {familyLabel(m)}
                </p>
                <div className="detail-highlight">
                  <Icon name={m.calendar === 'solar' ? 'calendar' : 'moon'} size={18} />
                  <strong>{eventDateLabel(m)}</strong>
                </div>
                <p className="small-note">
                  {m.repeat === 'monthly'
                    ? 'Lặp hằng tháng'
                    : m.repeat === 'once'
                      ? 'Một lần'
                      : 'Lặp hằng năm'}
                </p>
                <dl>
                  {dates.map((r, i) => (
                    <div key={jd(...r.date)}>
                      <dt>{i === 0 ? 'Lần tới' : 'Tiếp theo'}</dt>
                      <dd>
                        {r.date.join('/')}
                        {r.adjusted && <small>Tháng thiếu: dùng ngày cuối tháng</small>}
                        {r.fallback && <small>Không có tháng nhuận: dùng tháng thường</small>}
                      </dd>
                    </div>
                  ))}
                </dl>
                {m.note && <p className="small-note event-note">{m.note}</p>}
                {deleting === m.id ? (
                  <div aria-busy={removing}>
                    <Confirm
                      title={`Xóa ${eventTitle(m)} khỏi sổ?`}
                      onCancel={() => {
                        if (!removing) setDeleting(null);
                      }}
                      onConfirm={() => {
                        if (removing || !cloud) return;
                        setRemoving(true);
                        void cloud
                          .deleteMemorial(m.id)
                          .then(() => {
                            setDeleting(null);
                            toast('Đã xóa ngày khỏi sổ.');
                          })
                          .catch(() => toast('Chưa xóa được. Kiểm tra kết nối và quyền.'))
                          .finally(() => setRemoving(false));
                      }}
                    />
                  </div>
                ) : (
                  <div className="row">
                    <button className="button secondary small" onClick={() => setEditing(m)}>
                      Chỉnh sửa
                    </button>
                    <button
                      className="icon-button subtle"
                      aria-label={`Xóa ${m.name}`}
                      onClick={() => setDeleting(m.id)}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
      <p className="small-note">
        Ngày giỗ cũ vẫn được giữ nguyên theo lịch âm. Chỉnh sửa để phân thêm bên vợ/chồng. Sổ đánh
        dấu các dịp trong app; chưa gửi thông báo nền lên máy.
      </p>
    </>
  );
}
export default function Memorials() {
  return (
    <>
      <PageTitle
        eyebrow="GHI NHỚ YÊU THƯƠNG"
        title="Sổ ngày yêu thương"
        description="Nhớ người thân, giữ những ngày của chúng mình."
      />
      <AuthGate>
        <Book />
      </AuthGate>
    </>
  );
}
