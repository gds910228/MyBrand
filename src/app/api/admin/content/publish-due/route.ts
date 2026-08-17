import { NextRequest, NextResponse } from 'next/server';
import { listScheduledPostsRaw, setStatus } from '@/services/contentStatus';
import { runScheduledPublish } from '@/lib/scheduledPublish';
import { revalidateBlogPaths } from '@/services/revalidate';
import { checkAdminAccess } from '@/lib/adminAuth';

// POST /api/admin/content/publish-due  { token? }
// 管理页手动触发「立即发布到期文章」,与 /api/cron/publish 同一套逻辑
// (复用 runScheduledPublish + setStatus + revalidateBlogPaths)。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = checkAdminAccess(request, body?.token ?? null);
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const candidates = await listScheduledPostsRaw();
    const slugById = new Map(candidates.map((p) => [p.id, p.slug]));

    const outcome = await runScheduledPublish({
      posts: candidates,
      now: new Date(),
      publish: async (post) => {
        const res = await setStatus(post.id, 'published');
        if (!res.ok) throw new Error(res.error);
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
    console.error('[admin/content/publish-due] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to run scheduled publish' }, { status: 500 });
  }
}
