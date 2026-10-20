import { createContext, type ComponentChildren } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import type { Memorial } from './lib/memorials';
import { usePin } from './pin-context';
export interface ShoppingItem {
  id: string;
  name: string;
  qty: string;
  category: string;
  done: boolean;
  addedBy: string;
  createdAt?: unknown;
}
export interface Suggestion {
  id: string;
  name: string;
  category: string;
  count: number;
}
export interface FamilyUser {
  name: string;
  uid: string;
}
export interface Device {
  uid: string | null;
  approved: boolean;
  status: 'unregistered' | 'checking' | 'pending' | 'approved' | 'offline' | 'error';
}
export const configured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID,
);
export type Cloud = typeof import('./cloud');
interface Family {
  user: FamilyUser | null;
  device: Device;
  items: ShoppingItem[];
  memorials: Memorial[];
  suggestions: Suggestion[];
  pending: boolean;
  error: string;
  online: boolean;
  cloud: Cloud | null;
  toast: (s: string) => void;
  register: () => Promise<void>;
  checkAccess: () => Promise<void>;
  connecting: boolean;
}
const Context = createContext<Family>(null!);
export const useFamily = () => useContext(Context);
export function FamilyProvider({ children }: { children: ComponentChildren }) {
  const { profile } = usePin();
  const [user, setUser] = useState<FamilyUser | null>(null),
    [device, setDevice] = useState<Device>({ uid: null, approved: false, status: 'unregistered' }),
    [items, setItems] = useState<ShoppingItem[]>([]),
    [memorials, setMemorials] = useState<Memorial[]>([]),
    [suggestions, setSuggestions] = useState<Suggestion[]>([]),
    [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    [cloud, setCloud] = useState<Cloud | null>(null),
    [online, setOnline] = useState(navigator.onLine),
    [notice, setNotice] = useState(''),
    [connecting, setConnecting] = useState(false);
  useEffect(() => {
    let cleanup: (() => void) | undefined,
      cancelled = false;
    if (configured)
      import('./cloud')
        .then((module) => {
          if (cancelled) return;
          setCloud(module);
          cleanup = module.start(
            {
              user: setUser,
              device: setDevice,
              items: setItems,
              memorials: setMemorials,
              suggestions: setSuggestions,
              pending: setPending,
              error: setError,
            },
            profile!.name,
          );
        })
        .catch(() => setError('Không khởi tạo được Firebase. Hãy kiểm tra cấu hình.'));
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [profile?.name]);
  useEffect(() => {
    const on = () => setOnline(navigator.onLine);
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', on);
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  async function register() {
    if (!cloud) {
      setNotice(
        configured ? 'Đang kết nối…' : 'Chưa cấu hình Firebase. Xem hướng dẫn trong Cài đặt.',
      );
      return;
    }
    setConnecting(true);
    setError('');
    try {
      await cloud.registerDevice();
    } catch (e) {
      setError(cloud.authError(e));
    } finally {
      setConnecting(false);
    }
  }
  async function checkAccess() {
    if (!cloud) return;
    setConnecting(true);
    try {
      await cloud.checkDeviceAccess();
    } finally {
      setConnecting(false);
    }
  }
  return (
    <Context.Provider
      value={{
        user,
        device,
        items,
        memorials,
        suggestions,
        pending,
        error,
        online,
        cloud,
        toast: setNotice,
        register,
        checkAccess,
        connecting,
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </Context.Provider>
  );
}
