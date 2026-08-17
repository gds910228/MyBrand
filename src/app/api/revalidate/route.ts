import { NextRequest, NextResponse } from 'next/server';
import { notifyNewPost } from '@/services/notify';
import { revalidateBlogPaths, revalidatePaths } from '@/services/revalidate';

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
//   （通知逻辑抽到 src/services/notify.ts，管理页 /admin/notify 也复用）
//
//   新增（内容状态机）：?slug=<slug>（可重复）展开为博客双语列表 +
//   该文双语详情 + sitemap，供状态变更/定时发布后按篇刷新。
//   GET /api/revalidate?slug=<slug>&secret=...
//
// If `REVALIDATE_SECRET` env var is unset, the endpoint refuses to run
// (otherwise anyone on the internet could hammer your Notion quota).
//
// Multiple paths can be revalidated in one call by repeating ?path=
//   GET /api/revalidate?path=/&path=/zh&secret=...

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // web-push 依赖 Node crypto，不可用 Edge runtime

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

  // ?slug= 优先按篇展开(博客双语列表+详情+sitemap);否则沿用 ?path= 重复参数;
  // 两者都缺省时回退默认路径(首页双语 + 博客双语列表)。
  const slugs = searchParams.getAll('slug').filter(Boolean);
  let revalidated: string[];
  let errors: { path: string; error: string }[];

  if (slugs.length > 0) {
    const blogResult = revalidateBlogPaths(slugs);
    // ?slug= 与 ?path= 可同时使用:path 部分单独执行
    const extraPaths = searchParams.getAll('path').filter(Boolean);
    const extraResult = extraPaths.length > 0 ? revalidatePaths(extraPaths) : { revalidated: [], errors: [] };
    revalidated = [...blogResult.revalidated, ...extraResult.revalidated];
    errors = [...blogResult.errors, ...extraResult.errors];
  } else {
    const paths = searchParams.getAll('path');
    const targets = paths.length > 0 ? paths : ['/', '/zh', '/blog', '/zh/blog'];
    const result = revalidatePaths(targets);
    revalidated = result.revalidated;
    errors = result.errors;
  }

  // ── 角度2：新文章通知（可选 ?notify=<slug>）──────────────────────
  let notify: any = undefined;
  const notifySlug = searchParams.get('notify');
  if (notifySlug) {
    try {
      notify = await notifyNewPost(notifySlug);
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
