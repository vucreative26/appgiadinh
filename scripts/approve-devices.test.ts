import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
// @ts-expect-error Script Node độc lập.
import { withDeviceUIDs } from './approve-devices.mjs';
const rules = readFileSync('firestore.rules', 'utf8');
it('chỉ thay whitelist, giữ kiểm tra Anonymous và cấu trúc dữ liệu', () => {
  const result = withDeviceUIDs(rules, [
    'abcdefghijklmnopqrstuvwx1234',
    'zyxwvutsrqponmlkjihgfedc5678',
  ]);
  expect(result).toContain(
    'request.auth.uid in ["abcdefghijklmnopqrstuvwx1234", "zyxwvutsrqponmlkjihgfedc5678"]',
  );
  expect(result).toContain("request.auth.token.firebase.sign_in_provider == 'anonymous'");
  expect(result).toContain(
    "keys().hasOnly(['name','qty','category','done','addedBy','createdAt'])",
  );
  expect(result).toContain('allow read, write: if false');
});
it('không nhận PIN làm UID, UID trùng hoặc chèn mã Rules', () => {
  for (const uids of [
    [],
    ['1234'],
    ['UID_THIET_BI_1'],
    ['abcdefghijklmnopqrstuvwx1234', 'abcdefghijklmnopqrstuvwx1234'],
    ['bad\" ]; allow read: if true;'],
  ])
    expect(() => withDeviceUIDs(rules, uids)).toThrow();
});
