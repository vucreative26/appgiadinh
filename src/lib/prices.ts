import { useEffect, useState } from 'preact/hooks';
export interface Quote {
  buy: number;
  sell: number;
  source?: string;
  updatedAt?: string;
}
export interface Prices {
  updatedAt: string | null;
  usd: Quote | null;
  gold: { sjc: Quote | null; pnj: Quote | null; world: number | null; source: string };
  history: { t: string; usd: number | null; sjc: number | null }[];
  errors?: string[];
}
let cached: Prices | null = null;
export function usePrices() {
  const [data, setData] = useState<Prices | null>(cached),
    [loading, setLoading] = useState(!cached),
    [error, setError] = useState('');
  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}prices.json`, { cache: 'no-store' });
      if (!response.ok) throw Error();
      const p = await response.json();
      if (!p.gold || !Array.isArray(p.history)) throw Error();
      cached = p;
      setData(p);
      setError('');
    } catch {
      setError('Chưa lấy được bảng giá. Hãy kiểm tra mạng hoặc nguồn cập nhật.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);
  return { data, loading, error, refresh };
}
