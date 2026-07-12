import { NextRequest, NextResponse } from 'next/server';
import { notifyNewPost } from '@/services/notify';

// POST /api/admin/notify  { slug, password }
// 管理页触发新文章通知。密码复用 REVALIDATE_SECRET。
// Node runtime（notify 依赖 web-push 的 Node crypto）。
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const secretEnv = process.env.REVALIDATE_SECRET;
    if (!secretEnv) {
      return NextResponse.json({ error: 'REVALIDATE_SECRET not configured' }, { status: 500 });
    }

    const body = await request.json();
    const password: string = (body?.password || '').toString();
    const slug: string = (body?.slug || '').toString().trim();

    if (password !== secretEnv) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    const result = await notifyNewPost(slug);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[admin/notify] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to notify' }, { status: 500 });
  }
}
