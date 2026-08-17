/**
 * 定时发布核心逻辑(feat-content-state-machine, spec §1.3)。
 *
 * 与 Notion/Next 解耦:数据由调用方注入,发布动作由调用方注入,
 * 便于单测覆盖「到期转发布 / 未来不转 / 单篇失败隔离」。
 */

import { isValidISODate, normalizeStatus } from './contentStatus';

export interface ScheduledCandidate {
  id: string;
  slug?: string;
  status?: string | null;
  scheduledAt?: string | null;
}

export interface DueSelection<T extends ScheduledCandidate> {
  /** status=scheduled 且 scheduledAt 合法且 <= now */
  due: T[];
  /** status=scheduled 但 scheduledAt 缺失/非法/未来 */
  skipped: T[];
}

/** 从候选列表中筛出到期应发布与应跳过的文章。 */
export function selectDueScheduledPosts<T extends ScheduledCandidate>(
  posts: T[],
  now: Date,
): DueSelection<T> {
  const due: T[] = [];
  const skipped: T[] = [];
  const nowMs = now.getTime();
  for (const post of posts) {
    if (normalizeStatus(post.status) !== 'scheduled') continue;
    if (!isValidISODate(post.scheduledAt)) {
      skipped.push(post);
      continue;
    }
    if (Date.parse(post.scheduledAt as string) <= nowMs) {
      due.push(post);
    } else {
      skipped.push(post);
    }
  }
  return { due, skipped };
}

export interface ScheduledPublishResult {
  /** 成功发布的 post id 列表 */
  processed: string[];
  /** 发布失败的 {id, error} 列表(单篇失败不影响其它) */
  failed: { id: string; error: string }[];
  /** 被跳过的 post id 列表(未到期/缺时间) */
  skipped: string[];
}

/**
 * 执行定时发布:对到期文章逐篇调用注入的 publish,失败隔离。
 * 非 scheduled 的文章不进任何结果(等价于不在本次扫描范围)。
 */
export async function runScheduledPublish<T extends ScheduledCandidate>(opts: {
  posts: T[];
  now: Date;
  publish: (post: T) => Promise<void>;
}): Promise<ScheduledPublishResult> {
  const { due, skipped } = selectDueScheduledPosts(opts.posts, opts.now);
  const processed: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const post of due) {
    try {
      await opts.publish(post);
      processed.push(post.id);
    } catch (error: any) {
      failed.push({ id: post.id, error: error?.message || String(error) });
    }
  }

  return { processed, failed, skipped: skipped.map((p) => p.id) };
}
