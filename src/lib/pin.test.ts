import { describe, it, expect } from 'vitest';
import {
  makePin,
  verifyPin,
  isPinRecord,
  nextFailure,
  readAttempts,
  emptyAttempts,
  PIN_ITERATIONS,
} from './pin';
describe('Khóa PIN trên thiết bị', () => {
  it('chấp nhận số 0 đầu, không lưu mã gốc, khác salt cho mỗi máy', async () => {
    const a = await makePin('0012', 'Chồng'),
      b = await makePin('0012', 'Vợ');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    expect(JSON.stringify(a)).not.toContain('0012');
    expect(await verifyPin('0012', a)).toBe(true);
    expect(await verifyPin('0013', a)).toBe(false);
    expect(await verifyPin('12', a)).toBe(false);
  });
  it('chỉ nhận đúng 4 chữ số và tên hiển thị hợp lệ', async () => {
    for (const pin of ['123', '12345', 'abcd', '12 3', '１２３４'])
      await expect(makePin(pin, 'Vợ')).rejects.toThrow();
    await expect(makePin('1234', ' ')).rejects.toThrow();
  });
  it('đổi PIN vô hiệu mã cũ', async () => {
    const old = await makePin('2468', 'Vợ'),
      fresh = await makePin('1357', old.name);
    expect(await verifyPin('2468', old)).toBe(true);
    expect(await verifyPin('2468', fresh)).toBe(false);
    expect(await verifyPin('1357', fresh)).toBe(true);
  });
  it('cấu hình kiểm chứng hỏng không được nhận là PIN mới', async () => {
    const record = await makePin('3141', 'Chồng');
    expect(isPinRecord(record)).toBe(true);
    expect(isPinRecord({ ...record, salt: 'x' })).toBe(false);
    expect(isPinRecord({ ...record, hash: 'x' })).toBe(false);
    expect(isPinRecord({ ...record, iterations: PIN_ITERATIONS + 1 })).toBe(false);
    expect(isPinRecord(null)).toBe(false);
  });
  it('khóa sau 5 lần sai, thời gian chờ tăng và không vượt 5 phút', () => {
    let state = { ...emptyAttempts },
      now = 1000;
    for (let n = 1; n <= 30; n++) {
      state = nextFailure(state, now);
      if (n % 5 === 0) {
        expect(state.blockedUntil - now).toBe(Math.min(300000, 30000 * 2 ** (n / 5 - 1)));
        expect(nextFailure(state, now + 1)).toEqual(state);
        now = state.blockedUntil + 1;
      }
    }
  });
  it('giữ số lần nhập sai qua tải lại, bỏ dữ liệu lỗi', () => {
    const attempts = { failures: 5, blockedUntil: 12345 };
    expect(readAttempts({ getItem: () => JSON.stringify(attempts) }, 'x')).toEqual(attempts);
    expect(readAttempts({ getItem: () => '{invalid' }, 'x')).toEqual(emptyAttempts);
    expect(readAttempts({ getItem: () => '{"failures":-1,"blockedUntil":0}' }, 'x')).toEqual(
      emptyAttempts,
    );
  });
});
