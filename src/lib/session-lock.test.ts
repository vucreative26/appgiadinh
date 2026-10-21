import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SessionLock, readLockDelay, DEFAULT_LOCK_DELAY } from './session-lock';
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1000000);
});
afterEach(() => vi.useRealTimers());
it('resumes within grace, and repeated hide events do not extend the deadline', () => {
  const lock = vi.fn(),
    session = new SessionLock(300000, lock);
  session.hide();
  vi.advanceTimersByTime(100000);
  session.show();
  expect(lock).not.toHaveBeenCalled();
  session.hide();
  vi.advanceTimersByTime(200000);
  session.hide();
  vi.advanceTimersByTime(100000);
  session.show();
  expect(lock).toHaveBeenCalledTimes(1);
});
it('checks elapsed time even when background timers were suspended', () => {
  const lock = vi.fn(),
    session = new SessionLock(300000, lock);
  session.hide();
  vi.setSystemTime(1300001);
  session.show();
  expect(lock).toHaveBeenCalledTimes(1);
});
it('locks immediately, and reset cancels an old background deadline', () => {
  const lock = vi.fn(),
    session = new SessionLock(0, lock);
  session.hide();
  session.show();
  expect(lock).toHaveBeenCalledTimes(1);
  session.setDelay(30000);
  session.hide();
  session.reset();
  vi.advanceTimersByTime(60000);
  session.show();
  expect(lock).toHaveBeenCalledTimes(1);
});
it('shortening the grace applies to the existing departure time; clock rollback locks', () => {
  const lock = vi.fn(),
    session = new SessionLock(300000, lock);
  session.hide();
  vi.advanceTimersByTime(60000);
  session.setDelay(30000);
  expect(lock).toHaveBeenCalledTimes(1);
  session.hide();
  vi.setSystemTime(1);
  session.show();
  expect(lock).toHaveBeenCalledTimes(2);
  expect(() => session.setDelay(-1)).toThrow();
});
it('defaults safely when a saved setting is missing, invalid, or unreadable', () => {
  for (const value of [null, 'oops', '-1', '123'])
    expect(readLockDelay({ getItem: () => value }, 'delay')).toBe(DEFAULT_LOCK_DELAY);
  expect(readLockDelay({ getItem: () => '0' }, 'delay')).toBe(0);
  expect(
    readLockDelay(
      {
        getItem: () => {
          throw Error();
        },
      },
      'delay',
    ),
  ).toBe(DEFAULT_LOCK_DELAY);
});
