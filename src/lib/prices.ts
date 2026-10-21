import { useEffect, useRef, useState } from 'preact/hooks';
import { loadPrices, type Prices, type PriceRefresh } from './price-feed';
export type { Quote, Prices } from './price-feed';
let cached: Prices | null = null;
let lastRefresh: PriceRefresh | null = null;
let inFlight: Promise<PriceRefresh> | null = null;
function sharedRefresh() {
  if (!inFlight)
    inFlight = loadPrices(cached, import.meta.env.BASE_URL + 'prices.json')
      .then((result) => {
        cached = result.data;
        lastRefresh = result;
        return result;
      })
      .finally(() => {
        inFlight = null;
      });
  return inFlight;
}
export function usePrices() {
  const [data, setData] = useState<Prices | null>(cached),
    [loading, setLoading] = useState(!cached),
    [error, setError] = useState('');
  const [goldCheckedAt, setGoldCheckedAt] = useState(lastRefresh?.goldCheckedAt || null);
  const [goldVerified, setGoldVerified] = useState(
    lastRefresh?.goldVerified || { sjc: false, pnj: false },
  );
  const mounted = useRef(true);
  async function refresh() {
    setLoading(true);
    try {
      const result = await sharedRefresh();
      if (!mounted.current) return;
      setData(result.data);
      setGoldCheckedAt(result.goldCheckedAt);
      setGoldVerified(result.goldVerified);
      setError(result.warning);
    } catch (error) {
      if (!mounted.current) return;
      setGoldCheckedAt(null);
      setGoldVerified({ sjc: false, pnj: false });
      setError(error instanceof Error ? error.message : 'Chưa lấy được bảng giá.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const timer = setInterval(() => void refresh(), 5 * 60 * 1000);
    const online = () => {
      void refresh();
    };
    window.addEventListener('online', online);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      window.removeEventListener('online', online);
    };
  }, []);
  return { data, loading, error, refresh, goldCheckedAt, goldVerified };
}
