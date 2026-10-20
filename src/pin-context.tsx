import { createContext, type ComponentChildren } from 'preact';
import { useContext, useEffect, useState, useRef } from 'preact/hooks';
import {
  makePin,
  verifyPin,
  isPinRecord,
  nextFailure,
  readAttempts,
  emptyAttempts,
  type PinRecord,
} from './lib/pin';
import { Icon } from './components/Icon';
const PREFIX = `nha-${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'local'}`;
const PIN_KEY = `${PREFIX}-pin-v1`,
  ATTEMPT_KEY = `${PREFIX}-pin-attempts`,
  LOCK_KEY = `${PREFIX}-lock`;
function currentAttempts() {
  try {
    return readAttempts(localStorage, ATTEMPT_KEY);
  } catch {
    return { ...emptyAttempts };
  }
}
function readRecord(): { record: PinRecord | null; invalid: boolean } {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    if (!raw) return { record: null, invalid: false };
    const parsed = JSON.parse(raw);
    return isPinRecord(parsed)
      ? { record: parsed, invalid: false }
      : { record: null, invalid: true };
  } catch {
    return { record: null, invalid: true };
  }
}
interface PinContext {
  profile: PinRecord | null;
  lock: () => void;
  change: (oldPin: string, newPin: string) => Promise<void>;
}
const Context = createContext<PinContext>(null!);
export const usePin = () => useContext(Context);
export function PinProvider({ children }: { children: ComponentChildren }) {
  const [initial] = useState(readRecord),
    [profile, setProfile] = useState(initial.record),
    [invalid, setInvalid] = useState(initial.invalid),
    [unlocked, setUnlocked] = useState(false),
    [name, setName] = useState(''),
    [pin, setPin] = useState(''),
    [confirm, setConfirm] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [attempts, setAttempts] = useState(currentAttempts),
    [now, setNow] = useState(Date.now());
  const active = useRef(false),
    generation = useRef(0),
    operation = useRef(false),
    pinInput = useRef<HTMLInputElement>(null);
  function lock() {
    active.current = false;
    generation.current++;
    setUnlocked(false);
    setPin('');
    setConfirm('');
    setError('');
    try {
      localStorage.setItem(LOCK_KEY, String(Date.now()) + crypto.randomUUID());
    } catch {
      /* Khóa phiên hiện tại kể cả khi hết bộ nhớ. */
    }
  }
  useEffect(() => {
    const hide = () => {
        if (document.hidden) lock();
      },
      storage = (e: StorageEvent) => {
        if (e.key === PIN_KEY || e.key === LOCK_KEY) {
          const next = readRecord();
          setProfile(next.record);
          setInvalid(next.invalid);
          active.current = false;
          generation.current++;
          setUnlocked(false);
          setPin('');
          setConfirm('');
        }
        if (e.key === ATTEMPT_KEY) setAttempts(currentAttempts());
      };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', lock);
    window.addEventListener('storage', storage);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', lock);
      window.removeEventListener('storage', storage);
    };
  }, []);
  useEffect(() => {
    if (attempts.blockedUntil <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [attempts.blockedUntil]);
  function persistAttempts(value: typeof attempts) {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(value));
    setAttempts(value);
    setNow(Date.now());
  }
  async function authenticate(value: string) {
    const latest = currentAttempts();
    if (latest.blockedUntil > Date.now())
      throw Error('Bạn đã nhập sai nhiều lần. Vui lòng đợi rồi thử lại.');
    if (!profile || !(await verifyPin(value, profile))) {
      const next = nextFailure(latest);
      persistAttempts(next);
      throw Error(
        next.blockedUntil > Date.now()
          ? 'Nhập sai 5 lần. Vui lòng đợi trước khi thử lại.'
          : 'PIN chưa đúng. Thử lại nhé.',
      );
    }
    persistAttempts({ ...emptyAttempts });
  }
  async function submit(enteredPin = pin) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError('');
    const currentGeneration = generation.current;
    try {
      if (profile) {
        await authenticate(enteredPin);
      } else {
        if (pin !== confirm) throw Error('Hai lần nhập PIN chưa giống nhau.');
        const record = await makePin(pin, name);
        localStorage.setItem(PIN_KEY, JSON.stringify(record));
        setProfile(record);
        persistAttempts({ ...emptyAttempts });
      }
      if (currentGeneration === generation.current && !document.hidden) {
        active.current = true;
        setUnlocked(true);
      }
      setPin('');
      setConfirm('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không lưu được PIN trên thiết bị.');
      setPin('');
      setConfirm('');
    } finally {
      setBusy(false);
      operation.current = false;
      if (profile && currentGeneration === generation.current && !active.current)
        requestAnimationFrame(() => {
          if (!document.hidden && currentGeneration === generation.current)
            pinInput.current?.focus();
        });
    }
  }
  async function change(oldPin: string, newPin: string) {
    if (operation.current) throw Error('Đang xử lý, vui lòng đợi.');
    operation.current = true;
    try {
      const currentGeneration = generation.current;
      await authenticate(oldPin);
      const record = await makePin(newPin, profile!.name);
      if (!active.current || currentGeneration !== generation.current)
        throw Error('App đã khóa. Mở lại rồi đổi PIN.');
      localStorage.setItem(PIN_KEY, JSON.stringify(record));
      setProfile(record);
    } finally {
      operation.current = false;
    }
  }
  const remaining = Math.max(0, Math.ceil((attempts.blockedUntil - now) / 1000));
  return (
    <Context.Provider value={{ profile, lock, change }}>
      {unlocked && profile ? (
        children
      ) : (
        <main className="pin-page">
          <a className="brand pin-brand" href="#/">
            <span className="brand-mark">
              <Icon name="home" size={25} />
            </span>
            <span>
              Nhà mình<span className="brand-sub">một góc nhỏ, nhiều yêu thương</span>
            </span>
          </a>
          <section className="card pin-card">
            <span className="pin-symbol">
              <Icon name="lock" size={30} />
            </span>
            <div className="eyebrow">DÀNH RIÊNG CHO GIA ĐÌNH</div>
            <h1>
              {invalid
                ? 'Chưa đọc được khóa app'
                : profile
                  ? `Chào ${profile.name}`
                  : 'Tạo PIN cho máy này'}
            </h1>
            <p>
              {invalid
                ? 'Bộ nhớ thiết bị không khả dụng hoặc cấu hình PIN đã hỏng. Kiểm tra quyền lưu dữ liệu của Safari.'
                : profile
                  ? 'Nhập 4 số để mở một góc nhà mình.'
                  : 'Chỉ cần thiết lập một lần, không cần email.'}
            </p>
            {!invalid && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!profile || pin.length === 4) void submit();
                }}
              >
                {!profile && (
                  <label>
                    Tên hiển thị
                    <input
                      value={name}
                      maxLength={40}
                      placeholder="VD: Chồng, Vợ"
                      autoComplete="nickname"
                      required
                      onInput={(e) => setName(e.currentTarget.value)}
                    />
                  </label>
                )}
                <label>
                  {profile ? 'PIN 4 số' : 'Chọn PIN 4 số'}
                  <input
                    aria-label={profile ? 'PIN 4 số' : 'Chọn PIN 4 số'}
                    className="pin-input"
                    ref={pinInput}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    minLength={4}
                    maxLength={4}
                    autoComplete="off"
                    required
                    value={pin}
                    disabled={busy || remaining > 0}
                    onInput={(e) => {
                      const value = e.currentTarget.value.replace(/\D/g, '').slice(0, 4);
                      setPin(value);
                      setError('');
                      if (profile && value.length === 4 && !busy && remaining === 0)
                        void submit(value);
                    }}
                  />
                </label>
                {!profile && (
                  <label>
                    Nhập lại PIN
                    <input
                      className="pin-input"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]{4}"
                      minLength={4}
                      maxLength={4}
                      autoComplete="off"
                      required
                      value={confirm}
                      disabled={busy}
                      onInput={(e) => setConfirm(e.currentTarget.value.replace(/\D/g, ''))}
                    />
                  </label>
                )}
                {error && (
                  <p role="alert" className="warning">
                    {error}
                  </p>
                )}
                {remaining > 0 && (
                  <p className="small-note" role="status">
                    Thử lại sau {remaining} giây.
                  </p>
                )}
                {profile ? (
                  <p className="small-note" role="status" aria-live="polite">
                    {busy ? 'Đang kiểm tra…' : 'App tự mở khi nhập đúng 4 số.'}
                  </p>
                ) : (
                  <button
                    className="button primary full"
                    type="submit"
                    disabled={busy || remaining > 0}
                  >
                    {busy ? 'Đang lưu…' : 'Lưu PIN & vào nhà'}
                  </button>
                )}
              </form>
            )}
            <p className="small-note">
              PIN riêng cho bản cài này; không gửi lên Firebase. App tự khóa khi chuyển sang ứng
              dụng khác.
            </p>
            {profile && (
              <details>
                <summary>Quên PIN?</summary>
                <p className="small-note">
                  PIN không thể xem lại. Muốn thiết lập lại, cần xóa dữ liệu của app trong trình
                  duyệt. Sau đó có thể phải cấp quyền thiết bị mới. Dữ liệu gia đình trên Firebase
                  vẫn còn; thao tác chưa đồng bộ trên máy có thể mất.
                </p>
              </details>
            )}
          </section>
        </main>
      )}
    </Context.Provider>
  );
}
