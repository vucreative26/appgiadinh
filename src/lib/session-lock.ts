export const LOCK_DELAYS = [0, 30000, 60000, 300000, 900000] as const;
export const DEFAULT_LOCK_DELAY = 300000;
export function readLockDelay(storage: Pick<Storage, 'getItem'>, key: string) {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return DEFAULT_LOCK_DELAY;
    const value = Number(raw);
    return LOCK_DELAYS.some((delay) => delay === value) ? value : DEFAULT_LOCK_DELAY;
  } catch {
    return DEFAULT_LOCK_DELAY;
  }
}
// Timers may be suspended by iOS; the deadline is checked again on foreground/pageshow.
export class SessionLock {
  private hiddenAt: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(
    private delay: number,
    private expire: () => void,
  ) {}
  private expired() {
    return (
      this.hiddenAt !== null &&
      (Date.now() < this.hiddenAt || Date.now() - this.hiddenAt >= this.delay)
    );
  }
  private cancelTimer() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
  private schedule() {
    this.cancelTimer();
    if (this.hiddenAt === null) return;
    if (this.expired()) {
      this.reset();
      this.expire();
      return;
    }
    this.timer = setTimeout(
      () => this.schedule(),
      Math.max(0, this.delay - (Date.now() - this.hiddenAt)),
    );
  }
  hide() {
    if (this.hiddenAt === null) this.hiddenAt = Date.now();
    this.schedule();
  }
  show() {
    const expired = this.expired();
    this.reset();
    if (expired) this.expire();
  }
  reset() {
    this.cancelTimer();
    this.hiddenAt = null;
  }
  setDelay(delay: number) {
    if (!LOCK_DELAYS.some((value) => value === delay))
      throw Error('Thời gian tự khóa không hợp lệ.');
    this.delay = delay;
    this.schedule();
  }
}
