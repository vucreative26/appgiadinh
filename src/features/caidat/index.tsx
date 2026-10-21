import { useState } from 'preact/hooks';
import { PageTitle } from '../../components/Shared';
import { DeviceConnection } from '../../components/DeviceConnection';
import { useFamily } from '../../context';
import { usePin } from '../../pin-context';
import { Icon } from '../../components/Icon';
import { biometricError } from '../../lib/biometric';
export default function Settings() {
  const { user, online, pending, toast } = useFamily(),
    {
      profile,
      lock,
      change,
      lockDelay,
      setLockDelay,
      biometricSupported,
      biometricEnabled,
      prepareBiometric,
      enableBiometric,
      disableBiometric,
    } = usePin();
  const [oldPin, setOldPin] = useState(''),
    [newPin, setNewPin] = useState(''),
    [confirmation, setConfirmation] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [biometricPin, setBiometricPin] = useState(''),
    [biometricReady, setBiometricReady] = useState(false),
    [biometricBusy, setBiometricBusy] = useState(false),
    [securityError, setSecurityError] = useState('');
  async function confirmBiometricPin(e: Event) {
    e.preventDefault();
    if (biometricBusy) return;
    setBiometricBusy(true);
    setSecurityError('');
    try {
      await prepareBiometric(biometricPin);
      setBiometricPin('');
      setBiometricReady(true);
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : 'Chưa xác nhận được PIN.');
      setBiometricPin('');
    } finally {
      setBiometricBusy(false);
    }
  }
  async function registerBiometric() {
    if (biometricBusy) return;
    setBiometricBusy(true);
    setSecurityError('');
    try {
      await enableBiometric();
      setBiometricReady(false);
      toast('Đã bật mở app bằng Face ID / Touch ID hoặc khóa máy.');
    } catch (error) {
      setSecurityError(biometricError(error));
      setBiometricReady(false);
    } finally {
      setBiometricBusy(false);
    }
  }
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
        description="Kết nối gia đình, chọn cách mở khóa và thời gian chờ."
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
            <h2>Thời gian tự khóa</h2>
            <p>
              <strong>{profile?.name}</strong> · PIN 4 số chỉ lưu dạng kiểm chứng có salt trên máy
              này.
            </p>
            <label className="field">
              Tự khóa sau khi rời app
              <select
                value={lockDelay}
                onChange={(e) => {
                  try {
                    setLockDelay(Number(e.currentTarget.value));
                    setSecurityError('');
                    toast('Đã lưu thời gian tự khóa.');
                  } catch (error) {
                    setSecurityError(
                      error instanceof Error ? error.message : 'Chưa lưu được thiết lập.',
                    );
                  }
                }}
              >
                <option value={0}>Khóa ngay</option>
                <option value={30000}>30 giây</option>
                <option value={60000}>1 phút</option>
                <option value={300000}>5 phút</option>
                <option value={900000}>15 phút</option>
              </select>
            </label>
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
              Trong thời gian chờ, quay lại app sẽ dùng tiếp. Tải lại hoặc mở phiên app mới vẫn cần
              mở khóa. Nút Khóa app ngay luôn khóa lập tức. PIN không mã hóa dữ liệu cache; quyền dữ
              liệu trên mạng do Firestore Rules quyết định.
            </p>
          </section>
          <section className="card padded biometric-settings">
            <div className="section-heading">
              <h2>Face ID / Touch ID</h2>
              <span className="tile-icon mint">
                <Icon name="face" size={26} />
              </span>
            </div>
            <p>
              Mở app bằng xác nhận của máy. Hệ thống chọn Face ID, Touch ID hoặc mã khóa thiết bị;
              app không nhận dữ liệu khuôn mặt hay vân tay.
            </p>
            {biometricEnabled ? (
              <>
                <p className="connection-status">
                  <span className="sync-dot" />
                  Đã bật trên bản cài này
                </p>
                <button
                  className="button secondary"
                  disabled={biometricBusy}
                  onClick={() => {
                    try {
                      disableBiometric();
                      setBiometricReady(false);
                      toast('Đã tắt mở khóa bằng thiết bị trên app.');
                    } catch (error) {
                      setSecurityError(biometricError(error));
                    }
                  }}
                >
                  Tắt Face ID / Touch ID trên app
                </button>
              </>
            ) : biometricSupported === null ? (
              <p className="small-note">Đang kiểm tra hỗ trợ của máy…</p>
            ) : !biometricSupported ? (
              <p className="notice">
                Máy hoặc trình duyệt này chưa cung cấp mở khóa bằng thiết bị. Trên iPhone/iPad, hãy
                thử Safari cập nhật mới và bật khóa màn hình của máy. Bạn vẫn dùng PIN bình thường.
              </p>
            ) : biometricReady ? (
              <>
                <p className="notice">
                  PIN đã đúng. Nhấn Tiếp tục để máy xác nhận và tạo khóa mở app.
                </p>
                <button
                  className="button primary full"
                  disabled={biometricBusy}
                  onClick={() => void registerBiometric()}
                >
                  <Icon name="face" size={20} />
                  {biometricBusy ? 'Đang chờ máy xác nhận…' : 'Tiếp tục với Face ID / Touch ID'}
                </button>
              </>
            ) : (
              <form onSubmit={confirmBiometricPin} className="biometric-form">
                <label>
                  PIN hiện tại để bật khóa máy
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    pattern="[0-9]{4}"
                    minLength={4}
                    maxLength={4}
                    required
                    disabled={biometricBusy}
                    value={biometricPin}
                    onInput={(e) => setBiometricPin(e.currentTarget.value.replace(/\D/g, ''))}
                  />
                </label>
                <button type="submit" className="button primary full" disabled={biometricBusy}>
                  {biometricBusy ? 'Đang xác nhận…' : 'Bật Face ID / Touch ID'}
                </button>
              </form>
            )}
            {securityError && (
              <p className="warning" role="alert">
                {securityError}
              </p>
            )}
            <p className="small-note">
              Thiết lập một lần trong bản cài đang dùng. Khi app khóa, bấm nút Face ID / Touch ID
              trên màn hình PIN. Đổi PIN sẽ yêu cầu bật lại tính năng này. Tắt trên app chỉ bỏ liên
              kết ở bản cài này; khóa đã tạo có thể vẫn nằm trong trình quản lý mật khẩu của máy.
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
