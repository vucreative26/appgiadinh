import { useState } from 'preact/hooks';
import { useFamily } from '../../context';
import { PageTitle, AuthGate, Empty, Confirm, Tabs } from '../../components/Shared';
import { Icon } from '../../components/Icon';
import { nextMemorial, memorialDate, type Memorial } from '../../lib/memorials';
import { todayParts } from '../../lib/lunar';
const blank = {
  name: '',
  relation: '',
  side: 'noi' as 'noi' | 'ngoai',
  lunarDay: 1,
  lunarMonth: 1,
  isLeapMonth: false,
  leapPolicy: 'regular' as 'regular' | 'preferLeap',
  note: '',
};
function Book() {
  const { memorials, cloud, toast } = useFamily(),
    [form, setForm] = useState(false),
    [editing, setEditing] = useState<string | undefined>(),
    [value, setValue] = useState(blank),
    [side, setSide] = useState<'all' | 'noi' | 'ngoai'>('all'),
    [deleting, setDeleting] = useState<string | null>(null);
  const year = todayParts()[2],
    list = memorials
      .filter((m) => side === 'all' || m.side === side)
      .map((m) => ({ m, next: nextMemorial(m) }))
      .sort((a, b) => (a.next?.remaining ?? 999) - (b.next?.remaining ?? 999));
  function save(e: Event) {
    e.preventDefault();
    if (!cloud || !value.name.trim()) return;
    void cloud
      .saveMemorial({ ...value, name: value.name.trim() }, editing)
      .catch(() => toast('Không lưu được ngày giỗ. Kiểm tra kết nối và quyền truy cập.'));
    setForm(false);
    toast('Đã ghi vào sổ ngày giỗ.');
  }
  function edit(m: Memorial) {
    setValue({ ...blank, ...m, leapPolicy: m.leapPolicy || 'regular', note: m.note || '' });
    setEditing(m.id);
    setForm(true);
  }
  return (
    <>
      <div className="section-heading">
        <Tabs
          value={side}
          onChange={setSide}
          options={[
            { value: 'all', label: 'Tất cả' },
            { value: 'noi', label: 'Bên nội' },
            { value: 'ngoai', label: 'Bên ngoại' },
          ]}
        />
        <button
          className="button primary"
          onClick={() => {
            setEditing(undefined);
            setValue(blank);
            setForm(true);
          }}
        >
          <Icon name="plus" size={18} />
          Thêm ngày giỗ
        </button>
      </div>
      {form && (
        <section className="card padded">
          <div className="section-heading">
            <h2>{editing ? 'Chỉnh ngày giỗ' : 'Ghi thêm ngày giỗ'}</h2>
            <button
              className="icon-button"
              aria-label="Đóng biểu mẫu"
              onClick={() => setForm(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          <form className="form-grid" onSubmit={save}>
            <label>
              Tên người đã mất
              <input
                required
                maxLength={100}
                value={value.name}
                onInput={(e) => setValue({ ...value, name: e.currentTarget.value })}
              />
            </label>
            <label>
              Quan hệ
              <input
                maxLength={100}
                placeholder="VD: Ông nội"
                value={value.relation}
                onInput={(e) => setValue({ ...value, relation: e.currentTarget.value })}
              />
            </label>
            <label>
              Bên gia đình
              <select
                value={value.side}
                onChange={(e) =>
                  setValue({ ...value, side: e.currentTarget.value as 'noi' | 'ngoai' })
                }
              >
                <option value="noi">Bên nội</option>
                <option value="ngoai">Bên ngoại</option>
              </select>
            </label>
            <div className="row">
              <label>
                Ngày âm
                <select
                  value={value.lunarDay}
                  onChange={(e) => setValue({ ...value, lunarDay: Number(e.currentTarget.value) })}
                >
                  {Array.from({ length: 30 }, (_, i) => (
                    <option value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </label>
              <label>
                Tháng âm
                <select
                  value={value.lunarMonth}
                  onChange={(e) =>
                    setValue({ ...value, lunarMonth: Number(e.currentTarget.value) })
                  }
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={value.isLeapMonth}
                onChange={(e) => setValue({ ...value, isLeapMonth: e.currentTarget.checked })}
              />
              Ngày mất thuộc tháng nhuận
            </label>
            {value.isLeapMonth && (
              <label>
                Cách cúng tháng nhuận
                <select
                  value={value.leapPolicy}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      leapPolicy: e.currentTarget.value as 'regular' | 'preferLeap',
                    })
                  }
                >
                  <option value="regular">Cúng vào tháng thường cùng số</option>
                  <option value="preferLeap">
                    Cúng tháng nhuận nếu năm đó có, không có thì tháng thường
                  </option>
                </select>
              </label>
            )}
            <label className="wide">
              Ghi chú
              <textarea
                rows={2}
                maxLength={2000}
                value={value.note}
                onInput={(e) => setValue({ ...value, note: e.currentTarget.value })}
              />
            </label>
            <div className="wide row">
              <button className="button primary" type="submit">
                Lưu ngày giỗ
              </button>
              <button type="button" className="button secondary" onClick={() => setForm(false)}>
                Hủy
              </button>
            </div>
          </form>
        </section>
      )}
      {!list.length ? (
        <div className="card">
          <Empty icon="flower" title="Một cuốn sổ để nhớ">
            Ghi lại ngày giỗ âm lịch. App sẽ quy đổi sang ngày dương từng năm.
          </Empty>
        </div>
      ) : (
        <div className="memorial-grid">
          {list.map(({ m, next }) => (
            <section className="card padded" key={m.id}>
              <div className="section-heading">
                <span className="tile-icon sand">
                  <Icon name="flower" />
                </span>
                <span className={'badge ' + (next && next.remaining <= 7 ? 'urgent' : '')}>
                  {next?.remaining === 0
                    ? 'Hôm nay'
                    : next
                      ? `Còn ${next.remaining} ngày`
                      : 'Chưa quy đổi được'}
                </span>
              </div>
              <h2>{m.name}</h2>
              <p>
                {m.relation} · {m.side === 'noi' ? 'Bên nội' : 'Bên ngoại'}
              </p>
              <div className="detail-highlight">
                <Icon name="moon" size={18} />
                <strong>
                  {m.lunarDay}/{m.lunarMonth}
                  {m.isLeapMonth ? ' nhuận' : ''} âm lịch
                </strong>
              </div>
              <dl>
                {[year, year + 1].map((y) => {
                  const r = memorialDate(m, y);
                  return (
                    <>
                      <dt>Năm {y}</dt>
                      <dd>
                        {r.date
                          ? `${r.date[0]}/${r.date[1]}/${r.date[2]}`
                          : 'Không có ngày tương ứng'}
                        {r.adjusted && <small>Tháng thiếu: cúng ngày 29</small>}
                        {r.fallback && <small>Không có tháng nhuận: dùng tháng thường</small>}
                      </dd>
                    </>
                  );
                })}
              </dl>
              {m.note && <p className="small-note">{m.note}</p>}
              {deleting === m.id ? (
                <Confirm
                  title="Xóa ngày giỗ này khỏi sổ gia đình?"
                  onCancel={() => setDeleting(null)}
                  onConfirm={() => {
                    void cloud?.deleteMemorial(m.id).catch(() => toast('Không xóa được ngày giỗ.'));
                    setDeleting(null);
                  }}
                />
              ) : (
                <div className="row">
                  <button className="button secondary small" onClick={() => edit(m)}>
                    Chỉnh sửa
                  </button>
                  <button
                    className="icon-button subtle"
                    aria-label={`Xóa ngày giỗ ${m.name}`}
                    onClick={() => setDeleting(m.id)}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
      <p className="small-note">
        Ngày 30 âm gặp tháng thiếu được dời về ngày 29. Mặc định giỗ tháng nhuận cúng theo tháng
        thường cùng số.
      </p>
    </>
  );
}
export default function Memorials() {
  return (
    <>
      <PageTitle
        eyebrow="GHI NHỚ YÊU THƯƠNG"
        title="Sổ ngày giỗ"
        description="Nhớ người thân, giữ nếp nhà."
      />
      <AuthGate>
        <Book />
      </AuthGate>
    </>
  );
}
