import { NextRequest, NextResponse } from 'next/server';
import { setCommentStatus } from '@/services/notion';
import { checkAdminAccess } from '@/lib/adminAuth';
import type { CommentStatus } from '@/types/comment';

// POST /api/admin/comments/status  { id, status: 'pending'|'approved'|'spam' }
// 评论状态流转（审核工作台）。鉴权同 /api/admin/content。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUSES: CommentStatus[] = ['pending', 'approved', 'spam'];

export async function POST(request: NextRequest) {
  try {
    const access = checkAdminAccess(request);
    if (!access.allowed) {
      return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
    }

    const body = await request.json().catch(() => null);
    const id = typeof body?.id === 'string' ? body.id.trim() : '';
    const status = typeof body?.status === 'string' ? body.status.trim() : '';

    if (!id || !VALID_STATUSES.includes(status as CommentStatus)) {
      return NextResponse.json(
        { ok: false, code: 'invalid_input', error: 'Missing or invalid id/status' },
        { status: 400 },
      );
    }

    const result = await setCommentStatus(id, status as CommentStatus);
    if (!result.ok) {
      if (result.error === 'moderation-field-missing') {
        return NextResponse.json(
          { ok: false, code: 'moderation-field-missing', error: result.error },
          { status: 400 },
        );
      }
      const statusCode = result.error === 'not-found' ? 404 : 500;
      return NextResponse.json(
        { ok: false, error: result.error || 'Failed to update comment' },
        { status: statusCode },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[admin/comments/status POST] Error:', error?.message || error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update comment' },
      { status: 500 },
    );
  }
}
