import { NextRequest, NextResponse } from 'next/server';
import { setStatus } from '@/services/contentStatus';
import { revalidateBlogPaths } from '@/services/revalidate';
import { checkAdminAccess } from '@/lib/adminAuth';
import { isValidContentStatus } from '@/lib/contentStatus';

// POST /api/admin/content/status  { id, status, token? }
// 状态流转(draft<->scheduled<->published)。
// 成功后按 slug 刷新双语列表+双语详情+sitemap(消除 ISR 泄露窗口,spec §1.1)。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = checkAdminAccess(request, body?.token ?? null);
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const id: string = (body?.id || '').toString().trim();
    const status = body?.status;
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }
    if (!isValidContentStatus(status)) {
      return NextResponse.json(
        { error: "Invalid status; must be one of 'draft' | 'scheduled' | 'published'" },
        { status: 400 },
      );
    }

    const result = await setStatus(id, status);
    if (!result.ok) {
      const statusCode = result.error === 'invalid-status' || result.error === 'missing-id' ? 400 : 500;
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    const { revalidated, errors } = revalidateBlogPaths([result.data.slug]);
    return NextResponse.json({
      ok: true,
      id,
      status,
      slug: result.data.slug,
      revalidated,
      revalidateErrors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[admin/content/status] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
