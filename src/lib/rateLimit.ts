import type { NextRequest } from 'next/server';

// 简易内存限流（单实例；多实例/Edge 不可靠，本项目 solo dev 本地验证用）。
// 默认 10 次/分钟/IP。评审 P2-3：定期清理过期 entry 防内存单调增长。

interface Bucket {
  count: number;
  start: number;
}

const WINDOW_MS = 60_000;
const MAX = 10;
const buckets = new Map<string, Bucket>();

// 每 5 分钟清理一次过期 entry
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  buckets.forEach((b, key) => {
    if (now - b.start > WINDOW_MS) buckets.delete(key);
  });
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/** 返回 true 表示已被限流。 */
export function rateLimited(ip: string): boolean {
  const now = Date.now();
  cleanup(now);
  const rec = buckets.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) {
    buckets.set(ip, { count: 1, start: now });
    return false;
  }
  rec.count++;
  return rec.count > MAX;
}
