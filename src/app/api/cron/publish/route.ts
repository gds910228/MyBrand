import { NextRequest, NextResponse } from 'next/server';
import { listScheduledPostsRaw, setStatus } from '@/services/contentStatus';
import { runScheduledPublish } from '@/lib/scheduledPublish';
import { revalidateBlogPaths } from '@/services/revalidate';

// GET /api/cron/publish
// 定时发布端点(spec §1.3):扫描 status=scheduled 且 scheduledAt<=now 的文章,
// 逐篇转 published,单篇失败隔离,返回 {processed, failed, skipped} 计数与明细。
//
// 鉴权(语义钉死):
//   - CRON_SECRET 未配置 → 401 + 配置提示(端点拒绝运行,不裸奔);
//   - Authorization: Bearer <secret> 优先(Vercel Cron 自动携带),无 Bearer 再看 ?secret=;
//   - 均缺/均错 → 401。
//
// 线上:Vercel Cron 配置见 vercel.json.example;本地:curl 手动触发验证。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractSecret(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice('Bearer '.length).trim();
  const { searchParams } = new URL(request.url);
  return searchParams.get('secret');
}

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.warn('[cron/publish] CRON_SECRET not configured - endpoint refuses to run.');
      return NextResponse.json(
        { ok: false, error: 'CRON_SECRET not configured; set it to enable scheduled publishing' },
        { status: 401 },
      );
    }

    const provided = extractSecret(request);
    if (!provided || provided !== cronSecret) {
      return NextResponse.json({ ok: false, error: 'Invalid secret' }, { status: 401 });
    }

    const candidates = await listScheduledPostsRaw();
    const slugById = new Map(candidates.map((p) => [p.id, p.slug]));

    const outcome = await runScheduledPublish({
      posts: candidates,
      now: new Date(),
      publish: async (post) => {
        const res = await setStatus(post.id, 'published');
        if (!res.ok) throw new Error(res.error);
        // 与 /api/revalidate 同机制:双语列表 + 该文双语详情 + sitemap
        revalidateBlogPaths([post.slug || res.data.slug]);
      },
    });

    const details = [
      ...outcome.processed.map((id) => ({ id, slug: slugById.get(id), result: 'published' as const })),
      ...outcome.failed.map((f) => ({ id: f.id, slug: slugById.get(f.id), error: f.error })),
      ...outcome.skipped.map((id) => ({ id, slug: slugById.get(id), result: 'skipped' as const })),
    ];

    return NextResponse.json({
      ok: outcome.failed.length === 0,
      processed: outcome.processed.length,
      failed: outcome.failed.length,
      skipped: outcome.skipped.length,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[cron/publish] Error:', error?.message || error);
    return NextResponse.json({ ok: false, error: 'Failed to run scheduled publish' }, { status: 500 });
  }
}
