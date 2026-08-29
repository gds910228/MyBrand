/**
 * 同邮箱提交频率 tracker（feat-comment-moderation，spec §1.4 step3）。
 *
 * 评分引擎 spamScore.ts 保持纯函数（频率经 recentCountForEmail 入参注入）；
 * 本模块是路由侧的 impure 基础设施（内存 Map + 时钟），与 src/lib/rateLimit.ts 同模式：
 * 单实例内存、多实例/Edge 不可靠，solo 部署足够。
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 分钟
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

interface Timestamps {
  times: number[];
}

const buckets = new Map<string, Timestamps>();
let lastCleanup = 0;

function cleanup(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  buckets.forEach((rec, key) => {
    const fresh = rec.times.filter((t: number) => now - t < WINDOW_MS);
    if (fresh.length === 0) buckets.delete(key);
    else rec.times = fresh;
  });
}

/** 记录一次提交（邮箱归一化为小写）。 */
export function recordSubmission(email: string, now: number = Date.now()): void {
  const key = email.trim().toLowerCase();
  if (!key) return;
  cleanup(now);
  const rec = buckets.get(key);
  if (rec) rec.times.push(now);
  else buckets.set(key, { times: [now] });
}

/** 统计窗口内（默认 10 分钟）该邮箱的近期提交数（不含正在提交的这次由调用方决定语义）。 */
export function recentCountForEmail(email: string, windowMs: number = WINDOW_MS, now: number = Date.now()): number {
  const key = email.trim().toLowerCase();
  const rec = buckets.get(key);
  if (!rec) return 0;
  return rec.times.filter((t) => now - t < windowMs).length;
}

/** 测试专用：清空全部记录。 */
export function resetCommentFrequencyForTest(): void {
  buckets.clear();
  lastCleanup = 0;
}
