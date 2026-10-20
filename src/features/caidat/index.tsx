import { useState } from 'preact/hooks';
import { PageTitle } from '../../components/Shared';
import { DeviceConnection } from '../../components/DeviceConnection';
import { useFamily } from '../../context';
import { usePin } from '../../pin-context';
import { Icon } from '../../components/Icon';
export default function Settings() {
  const { user, online, pending, toast } = useFamily(),
    { profile, lock, change } = usePin();
  const [oldPin, setOldPin] = useState(''),
    [newPin, setNewPin] = useState(''),
    [confirmation, setConfirmation] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function updatePin(e: Event) {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (newPin !== confirmation) {
      setError('Hai lần nhập PIN mới chưa giống nhau.');
      return;
    }
    setBusy(true);
    try {
      await change(oldPin, newPin);
      setOldPin('');
      setNewPin('');
      setConfirmation('');
      toast('Đã đổi PIN cho bản cài này.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="GÓC GIA ĐÌNH"
        title="Cài đặt & kết nối"
        description="Mỗi máy một lần kết nối, mỗi ngày chỉ cần PIN."
      />
      <div className="settings-grid">
        <div>
          <DeviceConnection />
          <section className="card padded">
            <h2>Cài lên iPhone / iPad</h2>
            <ol className="instructions">
              <li>Mở địa chỉ app bằng Safari.</li>
              <li>
                Chia sẻ → <strong>Thêm vào Màn hình chính</strong>.
              </li>
              <li>Mở app từ biểu tượng vừa thêm, tạo PIN và đăng ký thiết bị ngay trong app đó.</li>
            </ol>
            <p className="small-note">
              Nếu bản cài có UID khác Safari, cấp quyền cho UID của bản cài. Xóa dữ liệu trình duyệt
              hoặc đổi máy có thể cần cấp quyền lại.
            </p>
          </section>
        </div>
        <div>
          <section className="card padded">
            <h2>Khóa app bằng PIN</h2>
            <p>
              <strong>{profile?.name}</strong> · PIN 4 số chỉ lưu dạng kiểm chứng có salt trên máy
              này.
            </p>
            <p className="small-note">
              {user
                ? !online
                  ? 'Ngoại tuyến'
                  : pending
                    ? 'Có thay đổi chờ đồng bộ'
                    : 'Dữ liệu gia đình đã kết nối'
                : 'Các tính năng riêng mở sau khi thiết bị được duyệt.'}
            </p>
            <button className="button secondary" onClick={lock}>
              <Icon name="lock" size={18} />
              Khóa app ngay
            </button>
            <p className="small-note">
              App tự khóa khi chuyển ứng dụng, ẩn tab hoặc tải lại. PIN không mã hóa dữ liệu cache;
              quyền truy cập dữ liệu trên mạng do Firestore Rules quyết định.
            </p>
          </section>
          <section className="card padded">
            <h2>Đổi PIN của máy này</h2>
            <form className="form-grid" onSubmit={updatePin}>
              <label className="wide">
                PIN hiện tại
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  minLength={4}
                  required
                  value={oldPin}
                  onInput={(e) => setOldPin(e.currentTarget.value.replace(/\D/g, ''))}
                />
              </label>
              <label>
                PIN mới
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  minLength={4}
                  required
                  value={newPin}
                  onInput={(e) => setNewPin(e.currentTarget.value.replace(/\D/g, ''))}
                />
              </label>
              <label>
                Nhập lại PIN mới
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  minLength={4}
                  required
                  value={confirmation}
                  onInput={(e) => setConfirmation(e.currentTarget.value.replace(/\D/g, ''))}
                />
              </label>
              {error && (
                <p className="warning wide" role="alert">
                  {error}
                </p>
              )}
              <button className="button primary wide" type="submit" disabled={busy}>
                {busy ? 'Đang đổi PIN…' : 'Lưu PIN mới'}
              </button>
            </form>
          </section>
        </div>
        <section className="card padded wide">
          <h2>Khi đổi máy hoặc thu hồi quyền</h2>
          <p>
            Xóa UID máy cũ khỏi danh sách cho phép trong Firestore Rules, rồi Publish. Máy cũ sẽ mất
            quyền đọc/ghi trên mạng khi kết nối lại. Dữ liệu đã được tải về máy không thể xóa từ xa
            chỉ bằng việc thu hồi quyền.
          </p>
          <p className="small-note">
            Không bật tự động xóa tài khoản Anonymous sau 30 ngày nếu Firebase có tùy chọn đó. PIN
            không cần gửi cho người hỗ trợ, không đưa vào Rules, .env hoặc GitHub.
          </p>
        </section>
      </div>
    </>
  );
}
