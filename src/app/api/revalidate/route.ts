import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getBlogPostBySlugForNotify, listSubscribers } from '@/services/notion';
import { notifyAllSubscribers } from '@/services/push';
import { sendNewPostEmail } from '@/services/email';

// On-demand ISR revalidation endpoint.
//
// Why this exists:
//   The home pages and blog pages use ISR (revalidate = 60). New Notion posts
//   take up to 60 s to appear after publishing. This endpoint lets you force
//   an immediate refresh - useful right after editing in Notion.
//
// Usage:
//   GET /api/revalidate?path=/&secret=YOUR_SECRET
//   GET /api/revalidate?path=/zh&secret=YOUR_SECRET
//   GET /api/revalidate?path=/blog&secret=YOUR_SECRET
//
//   新增（角度2）：?notify=<slug> 在 revalidate 后给订阅者发 Web Push + 邮件。
//   GET /api/revalidate?path=/blog&notify=<slug>&secret=...
//
// If `REVALIDATE_SECRET` env var is unset, the endpoint refuses to run
// (otherwise anyone on the internet could hammer your Notion quota).
//
// Multiple paths can be revalidated in one call by repeating ?path=
//   GET /api/revalidate?path=/&path=/zh&secret=...

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secretEnv = process.env.REVALIDATE_SECRET;
  if (!secretEnv) {
    return NextResponse.json(
      { ok: false, error: 'REVALIDATE_SECRET not configured' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== secretEnv) {
    return NextResponse.json({ ok: false, error: 'Invalid secret' }, { status: 401 });
  }

  // Allow ?path=/&path=/zh repeats; default to homepage + ZH homepage + both blog lists.
  const paths = searchParams.getAll('path');
  const targets = paths.length > 0 ? paths : ['/', '/zh', '/blog', '/zh/blog'];

  const revalidated: string[] = [];
  const errors: { path: string; error: string }[] = [];

  for (const p of targets) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch (err: any) {
      errors.push({ path: p, error: err?.message || String(err) });
    }
  }

  // ── 角度2：新文章通知（可选 ?notify=<slug>）──────────────────────
  let notify: any = undefined;
  const notifySlug = searchParams.get('notify');
  if (notifySlug) {
    try {
      const postRes = await getBlogPostBySlugForNotify(notifySlug);
      if (!postRes.ok) {
        notify = { ok: false, error: postRes.skipped ? 'notion-not-configured' : (postRes.error || 'post-not-found') };
      } else {
        const post = postRes.data;
        // Web Push（内部按 locale 分发，无 VAPID Key 时降级打印）
        const pushCount = await notifyAllSubscribers(post);

        // 邮件（按 locale 给 active 订阅者发，无 RESEND_API_KEY 时降级打印）
        let emailOk = 0;
        let emailFail = 0;
        let emailSkipped = 0;
        const activeSubs = await listSubscribers({ status: 'active' });
        for (const sub of activeSubs) {
          if (!sub.email) continue;
          const locale = sub.locale === 'zh' ? 'zh' : 'en';
          const r = await sendNewPostEmail(sub.email, post, locale, sub.unsubscribeToken);
          if (r.ok) {
            emailOk++;
          } else if (r.skipped) {
            emailSkipped++;
          } else {
            // 瞬态失败：重试一次（评审 P1-4，与 push 侧一致）
            const r2 = await sendNewPostEmail(sub.email, post, locale, sub.unsubscribeToken);
            if (r2.ok) emailOk++;
            else if (r2.skipped) emailSkipped++;
            else emailFail++;
          }
        }

        notify = {
          ok: true,
          slug: post.slug,
          push: pushCount,
          email: { ok: emailOk, fail: emailFail, skipped: emailSkipped },
        };
      }
    } catch (err: any) {
      notify = { ok: false, error: err?.message || String(err) };
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    revalidated,
    errors: errors.length > 0 ? errors : undefined,
    notify,
    timestamp: new Date().toISOString(),
  });
}
