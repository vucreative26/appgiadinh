export const money = (v: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(v);
export interface Expense {
  id: string;
  label: string;
  payer: string;
  amount: number;
  shares: Record<string, number>;
  mode: 'equal' | 'weight' | 'amount';
}
export interface Transfer {
  from: string;
  to: string;
  amount: number;
}
export function allocate(amount: number, weights: Record<string, number>) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw Error('Số tiền phải là số nguyên dương.');
  const entries = Object.entries(weights).filter(([, w]) => Number.isFinite(w) && w > 0),
    total = entries.reduce((s, [, w]) => s + w, 0);
  if (!total) throw Error('Chọn ít nhất một người được chia.');
  const rows = entries.map(([id, w], index) => ({
    id,
    index,
    value: Math.floor((amount * w) / total),
    fraction: ((amount * w) / total) % 1,
  }));
  let remaining = amount - rows.reduce((s, r) => s + r.value, 0);
  for (const r of [...rows].sort((a, b) => b.fraction - a.fraction || a.index - b.index)) {
    if (remaining-- <= 0) break;
    r.value++;
  }
  return Object.fromEntries(rows.map((r) => [r.id, r.value]));
}
export function balances(people: string[], expenses: Expense[]) {
  const b = Object.fromEntries(people.map((p) => [p, 0]));
  for (const e of expenses) {
    if (!(e.payer in b)) throw Error('Người trả không hợp lệ.');
    const shares = e.mode === 'amount' ? e.shares : allocate(e.amount, e.shares);
    if (Object.values(shares).reduce((s, v) => s + v, 0) !== e.amount)
      throw Error('Tổng phần chia phải bằng khoản chi.');
    b[e.payer] += e.amount;
    for (const [p, v] of Object.entries(shares)) {
      if (!(p in b) || !Number.isSafeInteger(v) || v < 0) throw Error('Phần chia không hợp lệ.');
      b[p] -= v;
    }
  }
  return b;
}
// Tìm nghiệm tối ưu chính xác bằng cách ghép một số dư với số dư trái dấu.
// Giới hạn nhóm 10 người ở giao diện để giữ thời gian tính phù hợp điện thoại.
export function settle(input: Record<string, number>): Transfer[] {
  const entries = Object.entries(input).filter(([, v]) => v !== 0);
  if (
    entries.some(([, v]) => !Number.isSafeInteger(v)) ||
    entries.reduce((s, [, v]) => s + v, 0) !== 0
  )
    throw Error('Số dư không cân bằng.');
  const names = entries.map(([n]) => n),
    values = entries.map(([, v]) => v);
  let best: Transfer[] | null = null;
  function search(start: number, path: Transfer[]) {
    while (start < values.length && values[start] === 0) start++;
    if (start === values.length) {
      if (!best || path.length < best.length) best = [...path];
      return;
    }
    if (best && path.length >= best.length) return;
    const v = values[start],
      seen = new Set<number>();
    for (let i = start + 1; i < values.length; i++) {
      if (v * values[i] >= 0 || seen.has(values[i])) continue;
      seen.add(values[i]);
      const other = values[i];
      values[i] += v;
      path.push(
        v < 0
          ? { from: names[start], to: names[i], amount: -v }
          : { from: names[i], to: names[start], amount: v },
      );
      search(start + 1, path);
      path.pop();
      values[i] = other;
      if (other + v === 0) break;
    }
  }
  search(0, []);
  // Bỏ việc nhận rồi chuyển hộ: người nợ trả thẳng người được nhận.
  // Mỗi bước loại ít nhất một cạnh, không tăng số lần chuyển của nghiệm tối ưu.
  const transfers: Transfer[] = (best || []).map((t: Transfer) => ({ ...t }));
  for (const name of names) {
    for (;;) {
      const incoming = transfers.find((t) => t.to === name && t.amount > 0);
      const outgoing = transfers.find((t) => t.from === name && t.amount > 0);
      if (!incoming || !outgoing) break;
      const amount = Math.min(incoming.amount, outgoing.amount);
      incoming.amount -= amount;
      outgoing.amount -= amount;
      if (incoming.from !== outgoing.to) {
        const direct = transfers.find((t) => t.from === incoming.from && t.to === outgoing.to);
        if (direct) direct.amount += amount;
        else transfers.push({ from: incoming.from, to: outgoing.to, amount });
      }
    }
  }
  return transfers.filter((t) => t.amount > 0);
}
