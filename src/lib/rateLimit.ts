import type { NextRequest } from 'next/server';

// 简易内存限流（单实例；多实例/Edge 不可靠，本项目 solo dev 本地验证用）。
// 评审 P2-3：定期清理过期 entry 防内存单调增长。
//
// feat-search-discovery-20260928（评审 spec_review_v1 P1-1）：扩展为**命名桶**。
// 原因：原实现只有一个全局桶（仅按 IP 计数，10 次/分钟），所有路由共用同一预算，
// 导致「搜索接口限流」与「评论/订阅频繁访问」互相误伤，且无法为搜索单独设定限额。
// 现在每个 bucket 有独立预算与独立 key 空间；**默认桶完全保持原有行为**，
// 既有调用方（comments / subscribe / subscribe-confirm / unsubscribe）零改动。

interface Bucket {
  count: number;
  start: number;
  /** 该桶的窗口长度——每个桶可能不同，清理时须按自身窗口判定过期。 */
  windowMs: number;
}

const WINDOW_MS = 60_000;
const MAX = 10;
/** 默认桶名：不带 bucket 参数的调用走这里，保持与改造前一致的 10 次/分钟/IP。 */
export const DEFAULT_BUCKET = 'default';

/** `/api/search` 的限流配置（只读高频接口，60 次/分钟/IP）。 */
export const SEARCH_RATE_LIMIT = { bucket: 'search', max: 60, windowMs: WINDOW_MS } as const;
/** `/api/search/suggest` 的限流配置：输入框每敲一次就会请求，故给更宽松的独立桶，
 *  避免把真实搜索请求挤出配额（评审 P2-4）。 */
export const SUGGEST_RATE_LIMIT = { bucket: 'suggest', max: 120, windowMs: WINDOW_MS } as const;
/** 分析读取端点的限流配置（admin 内部使用，较宽松）。 */
export const ANALYTICS_RATE_LIMIT = { bucket: 'admin-analytics', max: 30, windowMs: WINDOW_MS } as const;

export interface RateLimitOptions {
  /** 桶名；不同桶预算独立。默认 DEFAULT_BUCKET。 */
  bucket?: string;
  /** 窗口内允许的最大请求数。默认 10。 */
  max?: number;
  /** 窗口长度（ms）。默认 60000。 */
  windowMs?: number;
}

// key 形如 `<bucket>:<ip>`，使各桶预算互相独立。
const buckets = new Map<string, Bucket>();

// 每 5 分钟清理一次过期 entry
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  buckets.forEach((b, key) => {
    if (now - b.start > b.windowMs) buckets.delete(key);
  });
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/** 测试专用：清空限流桶。不传 bucket 时清空**全部**桶。 */
export function resetRateLimitForTest(bucket?: string): void {
  if (bucket === undefined) {
    buckets.clear();
  } else {
    const prefix = `${bucket}:`;
    Array.from(buckets.keys())
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => buckets.delete(k));
  }
  lastCleanup = 0;
}

/**
 * 返回 true 表示已被限流。
 *
 * 兼容性：`rateLimited(ip)` 与改造前行为完全一致（默认桶，10 次/60s）。
 * 新增可选 `opts` 以支持命名桶与自定义限额。
 */
export function rateLimited(ip: string, opts?: RateLimitOptions): boolean {
  const now = Date.now();
  const bucket = opts?.bucket ?? DEFAULT_BUCKET;
  const max = opts?.max ?? MAX;
  const windowMs = opts?.windowMs ?? WINDOW_MS;
  const key = `${bucket}:${ip}`;

  cleanup(now);
  const rec = buckets.get(key);
  if (!rec || now - rec.start > windowMs) {
    buckets.set(key, { count: 1, start: now, windowMs });
    return false;
  }
  rec.count++;
  return rec.count > max;
}
