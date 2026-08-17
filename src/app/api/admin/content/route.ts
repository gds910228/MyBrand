import { NextRequest, NextResponse } from 'next/server';
import { listAllBlogPostsWithStatus } from '@/services/contentStatus';
import { checkAdminAccess } from '@/lib/adminAuth';
import { generatePreviewUrl } from '@/lib/previewToken';

// GET /api/admin/content
// 内容管理后台文章列表(含 draft/scheduled/published 全状态)。
// 鉴权:Authorization: Bearer <ADMIN_TOKEN>;未配置 ADMIN_TOKEN 时仅 localhost 放行。
// 每篇附 previewUrl(预览 token 由服务端按 postId+密钥签发)。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const access = checkAdminAccess(request);
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const posts = await listAllBlogPostsWithStatus();
    const origin = new URL(request.url).origin;
    const withPreview = posts.map((p) => ({
      ...p,
      previewUrl: generatePreviewUrl(p.id, origin),
    }));

    return NextResponse.json({ posts: withPreview });
  } catch (error: any) {
    console.error('[admin/content] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
