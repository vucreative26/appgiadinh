export type IconName =
  | 'face'
  | 'lock'
  | 'home'
  | 'calendar'
  | 'oracle'
  | 'chart'
  | 'more'
  | 'sun'
  | 'moon'
  | 'arrow'
  | 'chevron'
  | 'plus'
  | 'close'
  | 'check'
  | 'bag'
  | 'split'
  | 'flower'
  | 'settings'
  | 'logout'
  | 'copy'
  | 'refresh'
  | 'heart'
  | 'wifi'
  | 'trash'
  | 'menu';
const paths: Record<IconName, string> = {
  face: 'M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3M8 9v2m8-2v2m-4 0v3m-4 2c2 2 6 2 8 0',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5Zm7 5v2',
  home: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
  calendar:
    'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 10h1m4 0h1m4 0h1M8 18h1m4 0h1',
  oracle: 'M4 5h16M4 12h6m4 0h6M4 19h16',
  chart: 'M3 3v18h18M6 15l4-4 4 2 6-8',
  more: 'M5 5h4v4H5Zm10 0h4v4h-4ZM5 15h4v4H5Zm10 0h4v4h-4Z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
  moon: 'M20 14.5A9 9 0 0 1 9.5 4 9 9 0 1 0 20 14.5Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  chevron: 'm9 5 7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  bag: 'M5 7h14l2 14H3ZM9 8V6a3 3 0 0 1 6 0v2',
  split: 'M7 3v13m-4-4 4 4 4-4M17 21V8m-4 4 4-4 4 4',
  flower: 'M12 12C2 8 5 2 9 5c0-5 6-5 6 0 4-3 7 3-3 7Zm0 0c10 4 7 10 3 7 0 5-6 5-6 0-4 3-7-3 3-7Z',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z',
  logout: 'M9 4H4v16h5m0-8h12m-5-5 5 5-5 5',
  copy: 'M9 9h12v12H9ZM15 5V3H3v12h2',
  refresh: 'M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5m-4 8a8 8 0 0 0 14 3l3-3m0 5v-5h-5',
  heart: 'M12 20C-4 10 6-1 12 7c6-8 16 3 0 13Z',
  wifi: 'M3 8a15 15 0 0 1 18 0M6 12a10 10 0 0 1 12 0m-9 4a5 5 0 0 1 6 0m-3 4h.01',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  menu: 'M4 6h16M4 12h16M4 18h16',
};
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.65"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
