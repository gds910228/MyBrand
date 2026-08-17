import { NextRequest, NextResponse } from 'next/server';
import { setScheduledAt } from '@/services/contentStatus';
import { checkAdminAccess } from '@/lib/adminAuth';
import { isValidISODate } from '@/lib/contentStatus';

// POST /api/admin/content/schedule  { id, scheduledAt, token? }
// 设置/清除定时发布时间(scheduledAt 为 null 时清除)。
// scheduledAt 字段缺失时返回稳定错误码 scheduledAt-field-missing(需在 Notion 手动加字段)。
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
    const scheduledAt = body?.scheduledAt ?? null;
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }
    if (scheduledAt !== null && !isValidISODate(scheduledAt)) {
      return NextResponse.json(
        { error: 'Invalid scheduledAt; must be an ISO date string or null' },
        { status: 400 },
      );
    }

    const result = await setScheduledAt(id, scheduledAt);
    if (!result.ok) {
      const statusCode =
        result.error === 'missing-id' || result.error === 'invalid-date' ? 400 : 500;
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json({ ok: true, id, scheduledAt: result.data.scheduledAt });
  } catch (error: any) {
    console.error('[admin/content/schedule] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to update scheduledAt' }, { status: 500 });
  }
}
