import { useFamily, configured } from '../context';
import { Icon } from './Icon';
import { copyText } from '../lib/storage';
export function DeviceConnection() {
  const { device, register, checkAccess, connecting, toast } = useFamily();
  const status = device.approved
    ? device.status === 'offline'
      ? 'Đã duyệt · đang dùng ngoại tuyến'
      : 'Thiết bị đã được duyệt'
    : device.status === 'checking'
      ? 'Đang kiểm tra quyền'
      : device.uid
        ? 'Đang chờ cấp quyền'
        : 'Chưa đăng ký thiết bị';
  async function copy() {
    if (!device.uid) return;
    try {
      await copyText(device.uid);
      toast('Đã sao chép UID thiết bị.');
    } catch (e) {
      toast((e as Error).message);
    }
  }
  return (
    <section className="card padded device-card">
      <span className="tile-icon mint">
        <Icon name="lock" />
      </span>
      <h2>{device.approved ? 'Máy này thuộc nhà mình' : 'Kết nối máy này với gia đình'}</h2>
      <p>
        {configured
          ? 'Đăng ký một lần trên từng bản cài. Sau đó chỉ cần PIN, không nhập email.'
          : 'Chưa có cấu hình Firebase. Điền .env để bật đồng bộ.'}
      </p>
      <div className="connection-status">
        <span className={'sync-dot ' + (!device.approved ? 'offline' : '')} />
        {status}
      </div>
      {device.uid ? (
        <>
          <label>
            Mã thiết bị (UID)
            <textarea
              className="device-uid"
              value={device.uid}
              readOnly
              rows={2}
              spellcheck={false}
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
          <div className="row device-actions">
            <button className="button secondary" onClick={copy}>
              <Icon name="copy" size={17} />
              Copy mã thiết bị
            </button>
            <button
              className="button primary"
              disabled={connecting || device.status === 'checking'}
              onClick={() => void checkAccess()}
            >
              <Icon name="refresh" size={17} />
              {connecting || device.status === 'checking' ? 'Đang kiểm tra…' : 'Kiểm tra quyền'}
            </button>
          </div>
          {!device.approved && (
            <p className="notice">
              Chỉ mã máy đã được thêm vào Firestore Rules mới truy cập được Đi chợ và Ngày giỗ. Đặt
              PIN không tự cấp quyền.
            </p>
          )}
        </>
      ) : (
        <button
          className="button primary"
          disabled={!configured || connecting}
          onClick={() => void register()}
        >
          <Icon name="plus" size={17} />
          {connecting ? 'Đang đăng ký…' : 'Đăng ký thiết bị này'}
        </button>
      )}
      <details className="device-guide">
        <summary>Cách duyệt thiết bị lần đầu</summary>
        <ol className="instructions">
          <li>
            Firebase Console → Authentication → Sign-in method → bật <strong>Anonymous</strong>.
            Không cần bật Google.
          </li>
          <li>
            Nhấn <strong>Đăng ký thiết bị này</strong>, rồi Copy UID hiện ở trên.
          </li>
          <li>
            Trong file <code>firestore.rules</code>, thay UID mẫu bằng UID của từng bản cài đã tin
            cậy.
          </li>
          <li>
            Firebase Console → Firestore → Rules: dán toàn bộ Rules đã chỉnh và nhấn{' '}
            <strong>Publish</strong>.
          </li>
          <li>
            Quay lại app, nhấn <strong>Kiểm tra quyền</strong>.
          </li>
        </ol>
        <p className="small-note">
          Nên cài lên màn hình chính trước rồi đăng ký ngay trong bản cài đó. Safari, PWA, iPad hoặc
          trình duyệt khác có thể có UID riêng. Chỉ duyệt mã từ máy của gia đình.
        </p>
      </details>
    </section>
  );
}
