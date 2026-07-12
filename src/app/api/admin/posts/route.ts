import { NextRequest, NextResponse } from 'next/server';
import { getAllBlogPosts } from '@/services/notion';

// GET /api/admin/posts?password=...
// 管理页获取文章列表。密码复用 REVALIDATE_SECRET。
// Node runtime（getAllBlogPosts 调 Notion）。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // 用了 request.url，不可静态化

export async function GET(request: NextRequest) {
  try {
    const secretEnv = process.env.REVALIDATE_SECRET;
    if (!secretEnv) {
      return NextResponse.json({ error: 'REVALIDATE_SECRET not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password') || '';
    if (password !== secretEnv) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 合并 EN + ZH 文章，去重（按 slug），按日期倒序
    const [enPosts, zhPosts] = await Promise.all([
      getAllBlogPosts({ language: 'English' }),
      getAllBlogPosts({ language: 'Chinese' }),
    ]);
    const seen = new Set<string>();
    const merged = [...enPosts, ...zhPosts]
      .filter((p: any) => {
        if (seen.has(p.slug)) return false;
        seen.add(p.slug);
        return true;
      })
      .map((p: any) => ({
        slug: p.slug,
        title: p.title || '(无标题)',
        date: p.date,
        language: p.language || '',
      }))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ posts: merged });
  } catch (error: any) {
    console.error('[admin/posts] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
