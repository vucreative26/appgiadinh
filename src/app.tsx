import { render, Component, type ComponentChildren, type ComponentType } from 'preact';
import { lazy, Suspense } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { FamilyProvider, useFamily } from './context';
import { useLocal } from './lib/storage';
import { Icon, type IconName } from './components/Icon';
import { PinProvider, usePin } from './pin-context';
import './style.css';
const Home = lazy(() => import('./features/home'));
const Calendar = lazy(() => import('./features/lich'));
const Oracle = lazy(() => import('./features/kinhdich'));
const Prices = lazy(() => import('./features/gia'));
const More = lazy(() => import('./features/khac'));
const Shopping = lazy(() => import('./features/dicho'));
const ShareBill = lazy(() => import('./features/sharebill'));
const Memorials = lazy(() => import('./features/giong'));
const Settings = lazy(() => import('./features/caidat'));
const routes: Record<string, ComponentType> = {
  '/': Home,
  '/lich': Calendar,
  '/dich': Oracle,
  '/gia': Prices,
  '/khac': More,
  '/dicho': Shopping,
  '/sharebill': ShareBill,
  '/giong': Memorials,
  '/caidat': Settings,
};
const nav: { path: string; label: string; icon: IconName }[] = [
  { path: '/', label: 'Trang chủ', icon: 'home' },
  { path: '/lich', label: 'Lịch', icon: 'calendar' },
  { path: '/dich', label: 'Dịch / Tử vi', icon: 'oracle' },
  { path: '/gia', label: 'Giá', icon: 'chart' },
  { path: '/khac', label: 'Khác', icon: 'more' },
];
class FeatureBoundary extends Component<{ children: ComponentChildren }, { failed: boolean }> {
  state = { failed: false };
  componentDidCatch() {
    this.setState({ failed: true });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="card padded">
        <h2>Chưa mở được tính năng này</h2>
        <p>
          Tính năng có thể chưa được tải để dùng ngoại tuyến, hoặc app vừa có bản cập nhật. Kết nối
          mạng rồi tải lại trang để thử lại.
        </p>
        <button className="button secondary" onClick={() => location.reload()}>
          Tải lại trang
        </button>
        <p className="small-note">Tải lại sẽ kết thúc phiên Share Bill đang có.</p>
      </section>
    );
  }
}
function App() {
  const { lock } = usePin();
  const [route, setRoute] = useState(location.hash.slice(1).split('?')[0] || '/'),
    [menu, setMenu] = useState(false),
    [dark, setDark] = useState(matchMedia('(prefers-color-scheme: dark)').matches),
    [theme, setTheme] = useLocal<'light' | 'dark' | 'system'>('nha-theme', 'system');
  const { online, pending, user, error } = useFamily();
  useEffect(() => {
    const change = () => {
      setRoute(location.hash.slice(1).split('?')[0] || '/');
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)'),
      apply = () => {
        document.documentElement.dataset.theme =
          theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
        setDark(document.documentElement.dataset.theme === 'dark');
      };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menu]);
  const Page = routes[route] || Home;
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Đến nội dung
      </a>
      <header className="topbar">
        <a href="#/" className="brand">
          <span className="brand-mark">
            <Icon name="home" size={24} />
          </span>
          <span>
            Nhà mình<span className="brand-sub">một góc nhỏ, nhiều yêu thương</span>
          </span>
        </a>
        <div className="top-actions">
          <span className={'sync-dot ' + (!online ? 'offline' : '')}></span>
          <span className="sync-label">
            {!online
              ? 'Ngoại tuyến'
              : pending
                ? 'Đang đồng bộ'
                : user
                  ? 'Đã kết nối'
                  : 'Không gian gia đình'}
          </span>
          <button
            className="icon-button"
            aria-label="Đổi sáng tối"
            onClick={() =>
              setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')
            }
          >
            <Icon name={dark ? 'sun' : 'moon'} />
          </button>
          <button
            className={'avatar ' + (menu ? 'active' : '')}
            aria-label="Mở menu gia đình"
            aria-expanded={menu}
            aria-controls="family-menu"
            onClick={() => setMenu(!menu)}
          >
            {user ? user.name.charAt(0) : <Icon name="menu" />}
          </button>
        </div>
      </header>
      {menu && (
        <>
          <button className="menu-backdrop" aria-label="Đóng menu" onClick={() => setMenu(false)} />
          <div className="family-menu" id="family-menu">
            <small>GÓC GIA ĐÌNH</small>
            <a href="#/giong">
              <Icon name="flower" />
              Ngày giỗ <Icon name="chevron" size={16} />
            </a>
            <a href="#/caidat">
              <Icon name="settings" />
              Cài đặt & kết nối <Icon name="chevron" size={16} />
            </a>
            <button className="menu-lock" onClick={lock}>
              <Icon name="lock" />
              Khóa app
            </button>
          </div>
        </>
      )}
      {!online && (
        <div className="offline-banner">
          Bạn đang ngoại tuyến. Các thay đổi sẽ đồng bộ khi có mạng.
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert">
          {error} <a href="#/caidat">Kiểm tra kết nối</a>
        </div>
      )}
      <main id="main" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="loading" role="status">
              <span className="loader" />
              Đang mở một góc nhà mình…
            </div>
          }
        >
          <FeatureBoundary key={route}>
            <Page />
          </FeatureBoundary>
        </Suspense>
        <footer className="page-footer">
          <Icon name="heart" size={13} /> Những điều nhỏ, dành cho nhà mình.
        </footer>
      </main>
      <nav className="bottom-nav" aria-label="Điều hướng chính">
        {nav.map((n) => {
          const active =
            n.path === '/khac'
              ? ['/khac', '/dicho', '/sharebill'].includes(route)
              : route === n.path;
          return (
            <a
              href={`#${n.path}`}
              key={n.path}
              className={active ? 'active' : ''}
              aria-current={active ? 'page' : undefined}
            >
              <span>
                <Icon name={n.icon} />
              </span>
              {n.label}
            </a>
          );
        })}
      </nav>
    </>
  );
}
render(
  <PinProvider>
    <FamilyProvider>
      <App />
    </FamilyProvider>
  </PinProvider>,
  document.getElementById('app')!,
);
