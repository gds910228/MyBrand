import { getBlogPostBySlugForNotify, listSubscribers } from './notion';
import { notifyAllSubscribers, type BilingualPost } from './push';
import { sendNewPostEmail } from './email';
import type { Locale } from './notion';

/**
 * 新文章通知共享逻辑（角度2）。
 * revalidate 路由与 admin API 都调此函数，避免重复（DRY）。
 *
 * 流程：slug -> 取文章(中英两份) -> Web Push + 邮件，均按订阅者 locale 选对应语言内容。
 * 降级：无 VAPID/RESEND Key 时内部降级打印，不报错。
 */

export interface NotifyResult {
  ok: boolean;
  slug?: string;
  push: { pushOk: number; pushFail: number; pushSkipped: number };
  email: { ok: number; fail: number; skipped: number };
  error?: string;
}

/** 按订阅者 locale 选文章内容；某语言缺失则 fallback 到另一语言。 */
function pickContent(post: BilingualPost, locale: Locale): { title: string; excerpt: string } {
  const primary = locale === 'zh' ? post.zh : post.en;
  const fallback = locale === 'zh' ? post.en : post.zh;
  return primary || fallback || { title: 'Untitled', excerpt: '' };
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

  const post: BilingualPost = postRes.data;

  // Web Push（内部按订阅者 locale 选内容，无 VAPID Key 时降级打印）
  const pushCount = await notifyAllSubscribers(post);

  // 邮件（按订阅者 locale 选文章内容，无 RESEND_API_KEY 时降级打印，瞬态失败重试一次）
  let emailOk = 0;
  let emailFail = 0;
  let emailSkipped = 0;
  const activeSubs = await listSubscribers({ status: 'active' });
  for (const sub of activeSubs) {
    if (!sub.email) continue;
    const locale: Locale = sub.locale === 'zh' ? 'zh' : 'en';
    const content = pickContent(post, locale);
    const r = await sendNewPostEmail(sub.email, { slug: post.slug, ...content }, locale, sub.unsubscribeToken);
    if (r.ok) {
      emailOk++;
    } else if (r.skipped) {
      emailSkipped++;
    } else {
      // 瞬态失败：重试一次
      const r2 = await sendNewPostEmail(sub.email, { slug: post.slug, ...content }, locale, sub.unsubscribeToken);
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
