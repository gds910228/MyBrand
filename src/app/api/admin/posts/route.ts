import { NextRequest, NextResponse } from 'next/server';
import { getAllBlogPosts } from '@/services/notion';

// GET /api/admin/posts?password=...
// 管理页获取文章列表。密码复用 REVALIDATE_SECRET。
// 同 slug 的中英两条合并成一条，返回双标题。
// Node runtime（getAllBlogPosts 调 Notion）。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // 用了 request.url，不可静态化

interface MergedPost {
  slug: string;
  titleEn: string;
  titleZh: string;
  hasEn: boolean;
  hasZh: boolean;
  date: string;
}

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

    // 合并 EN + ZH，同 slug 合并成一条（中英各可能存在）
    const [enPosts, zhPosts] = await Promise.all([
      getAllBlogPosts({ language: 'English' }),
      getAllBlogPosts({ language: 'Chinese' }),
    ]);

    const merged = new Map<string, MergedPost>();
    for (const p of enPosts as any[]) {
      const slug = p.slug;
      if (!slug) continue;
      const existing = merged.get(slug);
      if (existing) {
        existing.titleEn = p.title || '(无标题)';
        existing.hasEn = true;
      } else {
        merged.set(slug, {
          slug,
          titleEn: p.title || '(无标题)',
          titleZh: '',
          hasEn: true,
          hasZh: false,
          date: p.date,
        });
      }
    }
    for (const p of zhPosts as any[]) {
      const slug = p.slug;
      if (!slug) continue;
      const existing = merged.get(slug);
      if (existing) {
        existing.titleZh = p.title || '(无标题)';
        existing.hasZh = true;
        // 日期取较新的
        if (!existing.date || new Date(p.date) > new Date(existing.date)) {
          existing.date = p.date;
        }
      } else {
        merged.set(slug, {
          slug,
          titleEn: '',
          titleZh: p.title || '(无标题)',
          hasEn: false,
          hasZh: true,
          date: p.date,
        });
      }
    }

    const posts = Array.from(merged.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error('[admin/posts] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
