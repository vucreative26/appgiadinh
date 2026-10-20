import { useState } from 'preact/hooks';
import { PageTitle, Empty, Confirm } from '../../components/Shared';
import { Icon } from '../../components/Icon';
import { money, balances, settle, type Expense } from '../../lib/money';
import { copyText } from '../../lib/storage';
import { useFamily } from '../../context';
// Chỉ giữ trong RAM của trang, không ghi vào bất kỳ storage hay database nào.
let session: { people: string[]; expenses: Expense[] } = { people: [], expenses: [] };
export default function ShareBill() {
  const { toast } = useFamily(),
    [people, setPeople] = useState(session.people),
    [expenses, setExpenses] = useState(session.expenses),
    [person, setPerson] = useState(''),
    [label, setLabel] = useState(''),
    [amount, setAmount] = useState(''),
    [payer, setPayer] = useState(''),
    [mode, setMode] = useState<Expense['mode']>('equal'),
    [shares, setShares] = useState<Record<string, string>>({}),
    [confirm, setConfirm] = useState(false),
    [error, setError] = useState('');
  session = { people, expenses };
  const b = balances(people, expenses),
    transfers = settle(b),
    total = expenses.reduce((s, e) => s + e.amount, 0);
  function addPerson(e: Event) {
    e.preventDefault();
    const name = person.trim();
    if (!name) return;
    if (people.includes(name)) {
      toast('Tên này đã có trong nhóm.');
      return;
    }
    if (people.length >= 10) {
      toast('Tối đa 10 người để tìm cách chuyển khoản ít nhất.');
      return;
    }
    setPeople([...people, name]);
    setPerson('');
    if (!payer) setPayer(name);
  }
  function addExpense(e: Event) {
    e.preventDefault();
    setError('');
    try {
      const value = Number(amount);
      if (!Number.isSafeInteger(value) || value <= 0 || value > 1e12)
        throw Error('Nhập số tiền nguyên dương, tối đa 1.000 tỷ đồng.');
      const weights = Object.fromEntries(
        people
          .map((p) => [
            p,
            shares[p] === undefined ? (mode === 'amount' ? 0 : 1) : Number(shares[p]),
          ])
          .filter(([, v]) => typeof v === 'number' && Number.isFinite(v) && v > 0),
      );
      const entry: Expense = {
        id: crypto.randomUUID(),
        label: label.trim() || 'Khoản chi',
        payer,
        amount: value,
        shares: weights as Record<string, number>,
        mode,
      };
      balances(people, [entry]);
      setExpenses([...expenses, entry]);
      setAmount('');
      setLabel('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function copy() {
    try {
      const text = [
        'CHIA TIỀN · NHÀ MÌNH',
        `Tổng chi: ${money(total)}`,
        ...expenses.map((e) => `• ${e.label}: ${e.payer} trả ${money(e.amount)}`),
        '',
        ...transfers.map((t) => `${t.from} trả ${t.to} ${money(t.amount)}`),
        ...(transfers.length ? [] : ['Mọi người đã cân bằng, không cần chuyển khoản.']),
      ].join('\n');
      await copyText(text);
      toast('Đã sao chép kết quả.');
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="CUỘC VUI TRỌN VẸN"
        title="Chia tiền, nhẹ đầu"
        description="Ghi khoản chi, tính phần chia, chuyển khoản gọn gàng."
      />
      <div className="notice row">
        <Icon name="heart" size={18} />
        <span>Dữ liệu chỉ ở trong bộ nhớ trang. Tải lại hoặc đóng app sẽ mất phiên chia tiền.</span>
      </div>
      <div className="bill-layout">
        <div>
          <section className="card padded">
            <div className="section-heading">
              <h2>
                <span className="step-number">1</span>Ai cùng tham gia?
              </h2>
              <small>{people.length}/10 người</small>
            </div>
            <form className="row" onSubmit={addPerson}>
              <input
                className="grow"
                aria-label="Tên người tham gia"
                placeholder="Nhập tên, rồi nhấn Thêm"
                maxLength={40}
                value={person}
                onInput={(e) => setPerson(e.currentTarget.value)}
              />
              <button className="button secondary" type="submit">
                <Icon name="plus" size={17} />
                Thêm
              </button>
            </form>
            <div className="people-chips">
              {people.map((p) => (
                <span className="person-chip">
                  {p}
                  {!expenses.length && (
                    <button
                      aria-label={`Bỏ ${p}`}
                      onClick={() => {
                        setPeople(people.filter((n) => n !== p));
                        if (payer === p) setPayer(people.find((n) => n !== p) || '');
                      }}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </section>
          {people.length > 0 && (
            <section className="card padded">
              <h2>
                <span className="step-number">2</span>Ghi khoản chi
              </h2>
              <form className="form-grid" onSubmit={addExpense}>
                <label>
                  Khoản chi
                  <input
                    placeholder="VD: Bữa tối"
                    value={label}
                    maxLength={100}
                    onInput={(e) => setLabel(e.currentTarget.value)}
                  />
                </label>
                <label>
                  Số tiền (đồng)
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="1000000000000"
                    step="1"
                    required
                    value={amount}
                    onInput={(e) => setAmount(e.currentTarget.value)}
                  />
                </label>
                <label>
                  Ai trả trước?
                  <select value={payer} onChange={(e) => setPayer(e.currentTarget.value)}>
                    {people.map((p) => (
                      <option value={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Cách chia
                  <select
                    value={mode}
                    onChange={(e) => {
                      setMode(e.currentTarget.value as Expense['mode']);
                      setShares({});
                    }}
                  >
                    <option value="equal">Chia đều cho người được chọn</option>
                    <option value="weight">Chia theo tỷ lệ</option>
                    <option value="amount">Nhập số tiền từng người</option>
                  </select>
                </label>
                <div className="wide shares-list">
                  {people.map((p) => (
                    <label className="share-person">
                      <span>{p}</span>
                      {mode === 'equal' ? (
                        <input
                          type="checkbox"
                          checked={shares[p] !== '0'}
                          onChange={(e) =>
                            setShares({ ...shares, [p]: e.currentTarget.checked ? '1' : '0' })
                          }
                        />
                      ) : (
                        <input
                          aria-label={`Phần của ${p}`}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step={mode === 'amount' ? '1' : 'any'}
                          value={shares[p] ?? (mode === 'amount' ? '0' : '1')}
                          onInput={(e) => setShares({ ...shares, [p]: e.currentTarget.value })}
                        />
                      )}
                    </label>
                  ))}
                </div>
                {error && (
                  <p className="warning wide" role="alert">
                    {error}
                  </p>
                )}
                <button type="submit" className="button primary wide">
                  <Icon name="plus" size={17} />
                  Thêm khoản chi
                </button>
              </form>
            </section>
          )}
          {expenses.length > 0 && (
            <section className="card padded">
              <h2>Các khoản đã chi</h2>
              {expenses.map((e) => (
                <div className="expense-row" key={e.id}>
                  <div className="grow">
                    <strong>{e.label}</strong>
                    <p>
                      {e.payer} trả trước · {Object.keys(e.shares).length} người chia
                    </p>
                  </div>
                  <strong>{money(e.amount)}</strong>
                  <button
                    className="icon-button subtle"
                    aria-label={`Xóa ${e.label}`}
                    onClick={() => setExpenses(expenses.filter((v) => v.id !== e.id))}
                  >
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              ))}
            </section>
          )}
        </div>
        <aside className="card padded bill-result">
          <div className="eyebrow">TÍNH GỌN CHO CẢ NHÓM</div>
          <h2>Ai trả ai?</h2>
          <div className="total-bill">
            <span>Tổng chi</span>
            <strong>{money(total)}</strong>
          </div>
          {!expenses.length ? (
            <Empty icon="split" title="Chưa có khoản chi">
              Thêm người và khoản chi để xem kết quả.
            </Empty>
          ) : (
            <>
              <div className="balances">
                {Object.entries(b).map(([name, n]) => (
                  <div>
                    <span>{name}</span>
                    <strong className={n > 0 ? 'positive' : n < 0 ? 'negative' : ''}>
                      {n === 0 ? 'Đã cân bằng' : `${n > 0 ? 'Nhận' : 'Trả'} ${money(Math.abs(n))}`}
                    </strong>
                  </div>
                ))}
              </div>
              {transfers.map((t) => (
                <div className="transfer">
                  <strong>
                    {t.from}
                    <Icon name="arrow" size={16} />
                    {t.to}
                  </strong>
                  <span>{money(t.amount)}</span>
                </div>
              ))}
              {!transfers.length && <p className="notice">Đã cân bằng, không cần chuyển khoản.</p>}
              <p className="small-note">
                {transfers.length} lần chuyển khoản · tìm phương án ít lần nhất. Tiền lẻ được phân
                bổ theo phần dư để tổng luôn khớp.
              </p>
              <button className="button primary full" onClick={copy}>
                <Icon name="copy" size={17} />
                Copy kết quả
              </button>
              {confirm ? (
                <Confirm
                  title="Chia xong và xóa toàn bộ phiên này?"
                  onCancel={() => setConfirm(false)}
                  onConfirm={() => {
                    setExpenses([]);
                    setPeople([]);
                    setPayer('');
                    setShares({});
                    setConfirm(false);
                    session = { people: [], expenses: [] };
                  }}
                />
              ) : (
                <button className="button secondary full" onClick={() => setConfirm(true)}>
                  Chia xong, xóa hết
                </button>
              )}
            </>
          )}
        </aside>
      </div>
    </>
  );
}
