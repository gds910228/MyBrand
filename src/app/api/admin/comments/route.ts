import { NextRequest, NextResponse } from 'next/server';
import { getAllCommentsForAdmin } from '@/services/notion';
import { checkAdminAccess } from '@/lib/adminAuth';
import type { CommentStatus } from '@/types/comment';

// GET /api/admin/comments?status=all|pending|spam|approved&limit=
// 评论审核工作台列表（三态 + 计数）。鉴权同 /api/admin/content。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUS: Array<CommentStatus | 'all'> = ['all', 'pending', 'spam', 'approved'];

export async function GET(request: NextRequest) {
  try {
    const access = checkAdminAccess(request);
    if (!access.allowed) {
      return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'all';
    const status: CommentStatus | 'all' = (VALID_STATUS as string[]).includes(statusParam)
      ? (statusParam as CommentStatus | 'all')
      : 'all';

    const limitRaw = parseInt(searchParams.get('limit') || '', 10);
    const limit = Number.isInteger(limitRaw) ? limitRaw : 50;

    const result = await getAllCommentsForAdmin({ status, limit });
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('[admin/comments GET] Error:', error?.message || error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch comments' },
      { status: 500 },
    );
  }
}
