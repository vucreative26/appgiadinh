import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  onSnapshot,
  doc,
  writeBatch,
  increment,
  serverTimestamp,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocFromServer,
} from 'firebase/firestore';
import type { FamilyUser, ShoppingItem, Suggestion, Device } from './context';
import type { Memorial } from './lib/memorials';
const e = import.meta.env;
const app = initializeApp({
  apiKey: e.VITE_FIREBASE_API_KEY,
  authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: e.VITE_FIREBASE_PROJECT_ID,
  storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: e.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: e.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app),
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
export async function registerDevice() {
  if (auth.currentUser?.isAnonymous) return;
  if (auth.currentUser) await signOut(auth);
  await signInAnonymously(auth);
}
export function authError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation')
    return 'Chưa bật Anonymous trong Firebase Authentication → Sign-in method. Bật Anonymous rồi thử lại.';
  if (code === 'auth/network-request-failed')
    return 'Chưa kết nối được Firebase. Kiểm tra mạng rồi thử lại.';
  if (code === 'auth/too-many-requests')
    return 'Firebase đang giới hạn lượt đăng ký. Vui lòng thử lại sau.';
  return 'Chưa đăng ký được thiết bị. Kiểm tra cấu hình Firebase và Anonymous Authentication.';
}
interface Callbacks {
  device: (value: Device) => void;
  user: (u: FamilyUser | null) => void;
  items: (x: ShoppingItem[]) => void;
  memorials: (x: Memorial[]) => void;
  suggestions: (x: Suggestion[]) => void;
  pending: (v: boolean) => void;
  error: (v: string) => void;
}
let currentCheck: () => Promise<void> = async () => {};
export const checkDeviceAccess = () => currentCheck();
export function start(c: Callbacks, name: string) {
  let stops: (() => void)[] = [],
    disposed = false,
    generation = 0,
    listeningUid: string | null = null;
  const cachedKey = (uid: string) => `nha-approval-${e.VITE_FIREBASE_PROJECT_ID}-${uid}`;
  const wasApproved = (uid: string) => {
    try {
      return localStorage.getItem(cachedKey(uid)) === 'approved';
    } catch {
      return false;
    }
  };
  const saveApproval = (uid: string, value: boolean) => {
    try {
      if (value) localStorage.setItem(cachedKey(uid), 'approved');
      else localStorage.removeItem(cachedKey(uid));
    } catch {
      /* Không dựa vào cache để cấp quyền trên server. */
    }
  };
  function stopData() {
    stops.forEach((f) => f());
    stops = [];
    listeningUid = null;
    c.user(null);
    c.items([]);
    c.memorials([]);
    c.suggestions([]);
    c.pending(false);
  }
  function denied(uid: string) {
    saveApproval(uid, false);
    stopData();
    c.device({ uid, approved: false, status: 'pending' });
    c.error('Thiết bị chưa được cấp quyền hoặc quyền đã bị thu hồi. Vào Cài đặt để lấy UID.');
  }
  function listenData(uid: string) {
    if (listeningUid === uid) return;
    stopData();
    listeningUid = uid;
    c.user({ uid, name });
    const states: Record<string, boolean> = {};
    const listen = (collectionName: string, fn: (rows: any[]) => void) =>
      onSnapshot(
        collection(db, collectionName),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (disposed || listeningUid !== uid) return;
          states[collectionName] = snapshot.metadata.hasPendingWrites;
          c.pending(Object.values(states).some(Boolean));
          fn(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
        },
        (error) => {
          if (disposed || listeningUid !== uid) return;
          if (error.code === 'permission-denied') denied(uid);
          else c.error('Chưa đọc được dữ liệu chung. Kiểm tra kết nối rồi thử lại.');
        },
      );
    stops = [
      listen('shopping_items', c.items),
      listen('memorials', c.memorials),
      listen('shopping_suggestions', c.suggestions),
    ];
  }
  async function check() {
    const user = auth.currentUser,
      token = ++generation;
    if (disposed) return;
    if (!user?.isAnonymous) {
      stopData();
      c.device({ uid: null, approved: false, status: 'unregistered' });
      return;
    }
    const uid = user.uid;
    c.device({ uid, approved: listeningUid === uid, status: 'checking' });
    c.error('');
    if (!navigator.onLine) {
      if (wasApproved(uid)) {
        listenData(uid);
        c.device({ uid, approved: true, status: 'offline' });
      } else {
        stopData();
        c.device({ uid, approved: false, status: 'offline' });
      }
      return;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // Đọc trực tiếp server. Cache của một tài liệu không chứng minh quyền đã được duyệt.
      await Promise.race([
        getDocFromServer(doc(db, 'shopping_suggestions', '__device_access_check__')),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(Error('timeout')), 10000);
        }),
      ]);
      if (disposed || token !== generation || auth.currentUser?.uid !== uid) return;
      saveApproval(uid, true);
      listenData(uid);
      c.device({ uid, approved: true, status: 'approved' });
    } catch (error) {
      if (disposed || token !== generation) return;
      if ((error as { code?: string }).code === 'permission-denied') denied(uid);
      else if (wasApproved(uid)) {
        listenData(uid);
        c.device({ uid, approved: true, status: 'offline' });
        c.error('Chưa xác nhận lại được quyền trên mạng. Đang dùng dữ liệu đã lưu trên máy.');
      } else {
        stopData();
        c.device({ uid, approved: false, status: 'error' });
        c.error(
          'Chưa kiểm tra được quyền thiết bị. Kiểm tra mạng và Firestore đã tạo rồi thử lại.',
        );
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  currentCheck = check;
  const stop = onAuthStateChanged(auth, () => {
    void check();
  });
  const online = () => {
    void check();
  };
  window.addEventListener('online', online);
  const interval = setInterval(() => {
    if (navigator.onLine && auth.currentUser?.isAnonymous) void check();
  }, 60000);
  return () => {
    disposed = true;
    generation++;
    stop();
    stopData();
    clearInterval(interval);
    window.removeEventListener('online', online);
    if (currentCheck === check) currentCheck = async () => {};
  };
}
export function addItem(name: string, qty: string, category: string, addedBy: string) {
  const batch = writeBatch(db),
    key = encodeURIComponent(name.trim().toLocaleLowerCase('vi')).slice(0, 1000);
  batch.set(doc(collection(db, 'shopping_items')), {
    name: name.trim(),
    qty,
    category,
    done: false,
    addedBy,
    createdAt: serverTimestamp(),
  });
  batch.set(
    doc(db, 'shopping_suggestions', key),
    { name: name.trim(), category, count: increment(1), lastUsed: serverTimestamp() },
    { merge: true },
  );
  return batch.commit();
}
export const toggleItem = (id: string, done: boolean) =>
  updateDoc(doc(db, 'shopping_items', id), { done });
export const removeItem = (id: string) => deleteDoc(doc(db, 'shopping_items', id));
export async function clearDone(items: ShoppingItem[]) {
  const done = items.filter((i) => i.done);
  for (let i = 0; i < done.length; i += 450) {
    const b = writeBatch(db);
    done.slice(i, i + 450).forEach((x) => b.delete(doc(db, 'shopping_items', x.id)));
    await b.commit();
  }
}
export function saveMemorial(value: Omit<Memorial, 'id'>, id?: string) {
  const { name, relation, side, lunarDay, lunarMonth, isLeapMonth, leapPolicy, note, deathYear } =
    value;
  const data = Object.fromEntries(
    Object.entries({
      name,
      relation,
      side,
      lunarDay,
      lunarMonth,
      isLeapMonth,
      leapPolicy,
      note,
      deathYear,
    }).filter(([, v]) => v !== undefined),
  );
  return setDoc(id ? doc(db, 'memorials', id) : doc(collection(db, 'memorials')), data);
}
export const deleteMemorial = (id: string) => deleteDoc(doc(db, 'memorials', id));
