import { useState } from 'preact/hooks';
import { useFamily } from '../../context';
import { PageTitle, AuthGate, Empty, Confirm } from '../../components/Shared';
import { Icon } from '../../components/Icon';
const categories: Record<string, string> = {
  rau: 'Rau củ',
  thit_ca: 'Thịt cá',
  gia_vi: 'Gia vị',
  gia_dung: 'Đồ gia dụng',
  khac: 'Khác',
};
function List() {
  const { items, suggestions, cloud, user, toast, pending, online } = useFamily(),
    [name, setName] = useState(''),
    [qty, setQty] = useState(''),
    [category, setCategory] = useState('khac'),
    [confirm, setConfirm] = useState(false);
  const done = items.filter((i) => i.done).length,
    sorted = [...items].sort(
      (a, b) => Number(a.done) - Number(b.done) || a.name.localeCompare(b.name, 'vi'),
    );
  function add(e: Event) {
    e.preventDefault();
    if (!name.trim() || !cloud || !user) return;
    void cloud
      .addItem(name.trim(), qty.trim(), category, user.name)
      .catch(() => toast('Chưa lưu được món. Hãy kiểm tra quyền truy cập.'));
    setName('');
    setQty('');
    toast(online ? 'Đã thêm vào danh sách.' : 'Đã ghi nhận, chờ kết nối để đồng bộ.');
  }
  return (
    <>
      <div className="shopping-summary">
        <span className="badge">{items.length - done} món cần mua</span>
        <span className="small-note">
          {!online
            ? 'Ngoại tuyến · chờ đồng bộ'
            : pending
              ? 'Đang đồng bộ…'
              : 'Danh sách chung của hai vợ chồng'}
        </span>
      </div>
      <form className="card add-shopping" onSubmit={add}>
        <div className="field grow">
          <label for="item-name">Thêm món cần mua</label>
          <input
            id="item-name"
            list="suggestions"
            placeholder="Hôm nay nhà mình cần gì?"
            value={name}
            maxLength={100}
            required
            onInput={(e) => setName(e.currentTarget.value)}
          />
          <datalist id="suggestions">
            {[...suggestions]
              .sort((a, b) => b.count - a.count)
              .slice(0, 50)
              .map((s) => (
                <option value={s.name} />
              ))}
          </datalist>
        </div>
        <div className="field qty-field">
          <label for="item-qty">Số lượng</label>
          <input
            id="item-qty"
            placeholder="VD: 2 bó"
            value={qty}
            maxLength={50}
            onInput={(e) => setQty(e.currentTarget.value)}
          />
        </div>
        <div className="field">
          <label for="item-category">Nhóm</label>
          <select
            id="item-category"
            value={category}
            onChange={(e) => setCategory(e.currentTarget.value)}
          >
            {Object.entries(categories).map(([k, v]) => (
              <option value={k}>{v}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="button primary">
          <Icon name="plus" size={19} />
          Thêm
        </button>
      </form>
      {!items.length ? (
        <div className="card">
          <Empty icon="bag" title="Giỏ đi chợ đang trống">
            Thêm một món, người kia sẽ thấy trên điện thoại của mình.
          </Empty>
        </div>
      ) : (
        <div className="shopping-groups">
          {Object.entries(categories).map(([key, label]) => {
            const group = sorted.filter((i) => i.category === key);
            return (
              group.length > 0 && (
                <section className="card shopping-group">
                  <h2>
                    {label}
                    <span>{group.filter((i) => !i.done).length}</span>
                  </h2>
                  {group.map((item) => (
                    <div className={'shopping-row ' + (item.done ? 'done' : '')} key={item.id}>
                      <button
                        className="check-button"
                        aria-label={`${item.done ? 'Bỏ đánh dấu' : 'Đánh dấu đã mua'} ${item.name}`}
                        aria-pressed={item.done}
                        onClick={() =>
                          void cloud
                            ?.toggleItem(item.id, !item.done)
                            .catch(() => toast('Không cập nhật được món.'))
                        }
                      >
                        {item.done && <Icon name="check" size={17} />}
                      </button>
                      <div className="grow">
                        <strong>{item.name}</strong>
                        <p>
                          {item.qty || 'Không ghi số lượng'}
                          <span> · </span>
                          {item.addedBy}
                        </p>
                      </div>
                      <button
                        className="icon-button subtle"
                        aria-label={`Xóa ${item.name}`}
                        onClick={() =>
                          void cloud?.removeItem(item.id).catch(() => toast('Không xóa được món.'))
                        }
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  ))}
                </section>
              )
            );
          })}
        </div>
      )}
      {done > 0 &&
        (confirm ? (
          <Confirm
            title={`Xóa ${done} món đã mua khỏi danh sách chung?`}
            onCancel={() => setConfirm(false)}
            onConfirm={() => {
              void cloud?.clearDone(items).catch(() => toast('Chưa xóa hết được các món đã mua.'));
              setConfirm(false);
            }}
          />
        ) : (
          <button className="button secondary" onClick={() => setConfirm(true)}>
            <Icon name="trash" size={17} />
            Xóa {done} món đã mua
          </button>
        ))}
    </>
  );
}
export default function Shopping() {
  return (
    <>
      <PageTitle
        eyebrow="CÙNG CHĂM CHÚT TỔ ẤM"
        title="Đi chợ cùng nhau"
        description="Bạn ghi, tôi mua. Không quên món nào."
      />
      <AuthGate>
        <List />
      </AuthGate>
    </>
  );
}
