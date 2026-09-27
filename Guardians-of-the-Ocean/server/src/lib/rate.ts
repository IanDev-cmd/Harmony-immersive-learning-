/**
 * Fixed-window limiter. Web endpoints can trigger SMS and STK prompts to any number, so
 * they are capped per phone and per IP to stop someone spamming a stranger's handset.
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(private limit: number, private windowMs: number, private now: () => number = Date.now) {}

  /** Records one hit. Returns false once the key is over its limit for the window. */
  take(key: string): boolean {
    const t = this.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= t) {
      this.hits.set(key, { count: 1, resetAt: t + this.windowMs });
      this.sweep(t);
      return true;
    }
    entry.count += 1;
    return entry.count <= this.limit;
  }

  private sweep(t: number): void {
    if (this.hits.size < 5000) return;
    for (const [key, entry] of this.hits) if (entry.resetAt <= t) this.hits.delete(key);
  }
}
