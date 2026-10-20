import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const sdk = vi.hoisted(() => ({
  auth: { currentUser: null as null | { uid: string; isAnonymous: boolean } },
  changed: null as null | (() => void),
  probe: vi.fn(),
  anonymous: vi.fn(),
  snapshots: [] as {
    name: string;
    next: (s: any) => void;
    error: (e: any) => void;
    stop: ReturnType<typeof vi.fn>;
  }[],
}));
vi.mock('firebase/app', () => ({ initializeApp: () => ({}) }));
vi.mock('firebase/auth', () => ({
  getAuth: () => sdk.auth,
  onAuthStateChanged: (_: unknown, next: () => void) => {
    sdk.changed = next;
    return vi.fn();
  },
  signInAnonymously: () => sdk.anonymous(),
  signOut: async () => {
    sdk.auth.currentUser = null;
    sdk.changed?.();
  },
}));
vi.mock('firebase/firestore', () => ({
  initializeFirestore: () => ({}),
  persistentLocalCache: () => ({}),
  persistentMultipleTabManager: () => ({}),
  collection: (_: unknown, name: string) => name,
  doc: (_: unknown, name: string, id: string) => {
    // Mô phỏng ràng buộc ID của Firestore để phát hiện tên dành riêng trước khi gọi server.
    if (/^__.*__$/.test(id))
      throw Object.assign(new Error('Document ID is reserved'), { code: 'invalid-argument' });
    return `${name}/${id}`;
  },
  getDocFromServer: (...args: unknown[]) => sdk.probe(...args),
  onSnapshot: (
    name: string,
    _options: unknown,
    next: (s: any) => void,
    error: (e: any) => void,
  ) => {
    const stop = vi.fn();
    sdk.snapshots.push({ name, next, error, stop });
    return stop;
  },
  writeBatch: vi.fn(),
  increment: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
}));
import { start, checkDeviceAccess, registerDevice, authError, accessError } from '../cloud';
describe('Quyền thiết bị và vòng đời kết nối', () => {
  let stop: (() => void) | undefined, storage: Map<string, string>, online: { onLine: boolean };
  function setup() {
    const calls = {
      user: vi.fn(),
      device: vi.fn(),
      items: vi.fn(),
      memorials: vi.fn(),
      suggestions: vi.fn(),
      pending: vi.fn(),
      error: vi.fn(),
    };
    stop = start(calls, 'Chồng');
    sdk.changed?.();
    return calls;
  }
  const last = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.at(-1)?.[0];
  beforeEach(() => {
    storage = new Map();
    online = { onLine: true };
    vi.stubGlobal('navigator', online);
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
      removeItem: (k: string) => storage.delete(k),
    });
    sdk.auth.currentUser = { uid: 'knownDeviceUID1234567890123456', isAnonymous: true };
    sdk.snapshots = [];
    sdk.changed = null;
    sdk.probe.mockReset().mockResolvedValue({ exists: () => false });
    sdk.anonymous.mockReset();
  });
  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.unstubAllGlobals();
  });
  it('chưa đăng ký không tự tạo tài khoản hoặc mở listener dữ liệu', async () => {
    sdk.auth.currentUser = null;
    const c = setup();
    expect(last(c.device).status).toBe('unregistered');
    expect(sdk.probe).not.toHaveBeenCalled();
    expect(sdk.anonymous).not.toHaveBeenCalled();
    expect(sdk.snapshots).toHaveLength(0);
  });
  it('chỉ mở dữ liệu sau khi server cho đọc, kể cả tài liệu kiểm tra không tồn tại', async () => {
    const c = setup();
    expect(sdk.snapshots).toHaveLength(0);
    await vi.waitFor(() => expect(last(c.device)?.approved).toBe(true));
    expect(sdk.probe).toHaveBeenCalledWith('shopping_suggestions/device-access-check');
    expect(last(c.user)).toEqual({ uid: sdk.auth.currentUser!.uid, name: 'Chồng' });
    expect(sdk.snapshots.map((s) => s.name)).toEqual([
      'shopping_items',
      'memorials',
      'shopping_suggestions',
    ]);
  });
  it('từ chối thiết bị chưa duyệt dù có PIN và danh tính Anonymous', async () => {
    sdk.probe.mockRejectedValue({ code: 'permission-denied' });
    const c = setup();
    await vi.waitFor(() => expect(last(c.device)?.status).toBe('pending'));
    expect(last(c.user)).toBeNull();
    expect(sdk.snapshots).toHaveLength(0);
  });
  it('thu hồi quyền dừng listener, xóa dữ liệu đang hiển thị và cache phê duyệt', async () => {
    const c = setup();
    await vi.waitFor(() => expect(last(c.device)?.approved).toBe(true));
    expect(storage.size).toBe(1);
    sdk.probe.mockRejectedValue({ code: 'permission-denied' });
    await checkDeviceAccess();
    expect(last(c.device).approved).toBe(false);
    expect(last(c.user)).toBeNull();
    expect(last(c.items)).toEqual([]);
    expect(last(c.memorials)).toEqual([]);
    expect(storage.size).toBe(0);
    expect(sdk.snapshots.every((s) => s.stop.mock.calls.length > 0)).toBe(true);
  });
  it('lỗi permission từ listener cũng thu hồi quyền, không chờ lần kiểm tra tiếp', async () => {
    const c = setup();
    await vi.waitFor(() => expect(last(c.device)?.approved).toBe(true));
    sdk.snapshots[0].error({ code: 'permission-denied' });
    expect(last(c.device).approved).toBe(false);
    expect(last(c.user)).toBeNull();
    expect(storage.size).toBe(0);
  });
  it('máy mới ngoại tuyến không được cấp quyền chỉ từ dữ liệu cache', () => {
    online.onLine = false;
    const c = setup();
    expect(last(c.device)).toMatchObject({ approved: false, status: 'offline' });
    expect(sdk.snapshots).toHaveLength(0);
  });
  it('máy từng được server duyệt dùng cache ngoại tuyến nhưng bị chặn khi kết nối lại và quyền bị thu hồi', async () => {
    const c = setup();
    await vi.waitFor(() => expect(last(c.device)?.approved).toBe(true));
    online.onLine = false;
    await checkDeviceAccess();
    expect(last(c.device)).toMatchObject({ approved: true, status: 'offline' });
    online.onLine = true;
    sdk.probe.mockRejectedValue({ code: 'permission-denied' });
    await checkDeviceAccess();
    expect(last(c.device).approved).toBe(false);
  });
  it('khóa app khi đang kiểm tra không mở lại kết nối bởi kết quả đến muộn', async () => {
    let finish!: (v: unknown) => void;
    sdk.probe.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const c = setup();
    stop?.();
    stop = undefined;
    finish({});
    await Promise.resolve();
    await Promise.resolve();
    expect(last(c.user)).toBeNull();
    expect(sdk.snapshots).toHaveLength(0);
  });
  it('tài khoản Google cũ không được xem là thiết bị đã duyệt', () => {
    sdk.auth.currentUser = { uid: 'legacyGoogle', isAnonymous: false };
    const c = setup();
    expect(last(c.device).status).toBe('unregistered');
    expect(last(c.user)).toBeNull();
    expect(sdk.probe).not.toHaveBeenCalled();
  });
  it('đăng ký lại không thay UID Anonymous đang dùng', async () => {
    await registerDevice();
    expect(sdk.anonymous).not.toHaveBeenCalled();
    expect(sdk.auth.currentUser?.uid).toBe('knownDeviceUID1234567890123456');
  });
  it('lỗi chưa bật Anonymous chỉ đúng chỗ cần thiết lập', () => {
    expect(authError({ code: 'auth/operation-not-allowed' })).toContain('bật Anonymous');
  });
  it('lỗi cấu hình trả mã cụ thể thay vì báo nhầm UID chưa duyệt', async () => {
    sdk.probe.mockRejectedValue({ code: 'invalid-argument' });
    const c = setup();
    await vi.waitFor(() => expect(last(c.device)?.status).toBe('error'));
    expect(last(c.error)).toContain('invalid-argument');
    expect(last(c.user)).toBeNull();
    expect(sdk.snapshots).toHaveLength(0);
  });
  it('phân biệt database chưa có và quá thời gian phản hồi', () => {
    expect(accessError({ code: 'not-found' })).toContain('(default)');
    expect(accessError(Error('timeout'))).toContain('timeout');
  });
});
