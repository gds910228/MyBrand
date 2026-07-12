import { getBlogPostBySlugForNotify, listSubscribers } from './notion';
import { notifyAllSubscribers } from './push';
import { sendNewPostEmail } from './email';
import type { Locale } from './notion';

/**
 * 新文章通知共享逻辑（角度2）。
 * revalidate 路由与 admin API 都调此函数，避免重复（DRY）。
 *
 * 流程：slug -> 取文章 -> Web Push（按 locale）+ 邮件（按 locale，瞬态重试一次）。
 * 降级：无 VAPID/RESEND Key 时内部降级打印，不报错。
 */

export interface NotifyResult {
  ok: boolean;
  slug?: string;
  push: { pushOk: number; pushFail: number; pushSkipped: number };
  email: { ok: number; fail: number; skipped: number };
  error?: string;
}

export async function notifyNewPost(slug: string): Promise<NotifyResult> {
  const empty = { push: { pushOk: 0, pushFail: 0, pushSkipped: 0 }, email: { ok: 0, fail: 0, skipped: 0 } };

  const postRes = await getBlogPostBySlugForNotify(slug);
  if (!postRes.ok) {
    return {
      ok: false,
      ...empty,
      error: postRes.skipped ? 'notion-not-configured' : (postRes.error || 'post-not-found'),
    };
  }

  const post = postRes.data;

  // Web Push（内部按 locale 分发，无 VAPID Key 时降级打印）
  const pushCount = await notifyAllSubscribers(post);

  // 邮件（按 locale 给 active 订阅者发，无 RESEND_API_KEY 时降级打印，瞬态失败重试一次）
  let emailOk = 0;
  let emailFail = 0;
  let emailSkipped = 0;
  const activeSubs = await listSubscribers({ status: 'active' });
  for (const sub of activeSubs) {
    if (!sub.email) continue;
    const locale: Locale = sub.locale === 'zh' ? 'zh' : 'en';
    const r = await sendNewPostEmail(sub.email, post, locale, sub.unsubscribeToken);
    if (r.ok) {
      emailOk++;
    } else if (r.skipped) {
      emailSkipped++;
    } else {
      // 瞬态失败：重试一次
      const r2 = await sendNewPostEmail(sub.email, post, locale, sub.unsubscribeToken);
      if (r2.ok) emailOk++;
      else if (r2.skipped) emailSkipped++;
      else emailFail++;
    }
  }

  return {
    ok: true,
    slug: post.slug,
    push: pushCount,
    email: { ok: emailOk, fail: emailFail, skipped: emailSkipped },
  };
}
