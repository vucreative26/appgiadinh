// PIN chỉ khóa giao diện trên thiết bị. Firestore Rules kiểm soát quyền dữ liệu.
export const PIN_ITERATIONS = 210000;
export interface PinRecord {
  version: 1;
  name: string;
  salt: string;
  hash: string;
  iterations: number;
}
export interface PinAttempts {
  failures: number;
  blockedUntil: number;
}
const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
async function derive(pin: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ]);
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
      key,
      256,
    ),
  );
}
export function isPinRecord(value: unknown): value is PinRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<PinRecord>;
  if (
    r.version !== 1 ||
    typeof r.name !== 'string' ||
    !r.name.trim() ||
    r.name.length > 40 ||
    r.iterations !== PIN_ITERATIONS ||
    typeof r.salt !== 'string' ||
    typeof r.hash !== 'string'
  )
    return false;
  try {
    return base64ToBytes(r.salt).length === 16 && base64ToBytes(r.hash).length === 32;
  } catch {
    return false;
  }
}
export async function makePin(pin: string, name: string): Promise<PinRecord> {
  if (!/^\d{4}$/.test(pin)) throw Error('PIN phải có đúng 4 chữ số.');
  if (!name.trim() || name.trim().length > 40) throw Error('Nhập tên hiển thị từ 1 đến 40 ký tự.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return {
    version: 1,
    name: name.trim(),
    salt: bytesToBase64(salt),
    hash: bytesToBase64(await derive(pin, salt, PIN_ITERATIONS)),
    iterations: PIN_ITERATIONS,
  };
}
export async function verifyPin(pin: string, record: PinRecord) {
  if (!/^\d{4}$/.test(pin) || !isPinRecord(record)) return false;
  const actual = await derive(pin, base64ToBytes(record.salt), record.iterations),
    expected = base64ToBytes(record.hash);
  return actual.reduce((difference, v, i) => difference | (v ^ expected[i]), 0) === 0;
}
export function nextFailure(previous: PinAttempts, now = Date.now()): PinAttempts {
  if (previous.blockedUntil > now) return previous;
  const failures = previous.failures + 1;
  return {
    failures,
    blockedUntil:
      failures % 5 === 0 ? now + Math.min(300000, 30000 * 2 ** (Math.floor(failures / 5) - 1)) : 0,
  };
}
export const emptyAttempts: PinAttempts = { failures: 0, blockedUntil: 0 };
export function readAttempts(storage: Pick<Storage, 'getItem'>, key: string): PinAttempts {
  try {
    const value = JSON.parse(storage.getItem(key) || 'null');
    if (
      value &&
      Number.isSafeInteger(value.failures) &&
      value.failures >= 0 &&
      Number.isFinite(value.blockedUntil) &&
      value.blockedUntil >= 0
    )
      return value;
  } catch {
    /* Chưa có lịch sử. */
  }
  return { ...emptyAttempts };
}
