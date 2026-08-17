import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostById } from '@/services/notion';
import { getPreviewSecret, verifyPreviewToken } from '@/lib/previewToken';

// GET /api/content/[id]/preview?token=...
// 草稿/定时文章预览端点(spec §1.2):
//   无 token → 400;token 错误/过期/id 不匹配 → 401(带 reason);
//   文章不存在或 Notion 异常(getBlogPostById 均返回 null)→ 404;
//   通过 → 200 返回渲染数据(meta + content blocks)。
// 密钥:PREVIEW_TOKEN,未配置时进程随机密钥降级 + 控制台打印(getPreviewSecret)。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Preview token is required' }, { status: 400 });
    }

    const secret = getPreviewSecret();
    const verdict = verifyPreviewToken(id, token, secret, Date.now());
    if (!verdict.valid) {
      return NextResponse.json(
        { error: 'Invalid preview token', reason: verdict.reason },
        { status: 401 },
      );
    }

    const post = await getBlogPostById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const p = post as any;
    return NextResponse.json({
      post: {
        id: p.id,
        title: p.title,
        excerpt: p.excerpt,
        status: p.status, // getBlogPostById 已归一化为小写枚举
        scheduledAt: p.scheduledAt ?? null,
        date: p.date,
        author: p.author,
        tags: p.tags ?? [],
        slug: p.slug,
        language: p.language,
        content: p.content, // Notion blocks,前端可用 NotionRenderer 渲染
      },
    });
  } catch (error: any) {
    console.error('[content/preview] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to load preview' }, { status: 500 });
  }
}
