import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/adminAuth';
import { parseMarkdown, normalizeFrontmatter } from '@/lib/publish/parseMarkdown';
import { generateAiTrio } from '@/lib/publish/aiFields';

// POST /api/admin/publish/parse
// 发布工作台第一步:解析 Markdown(不落库、不上传图片),可选触发 AI 三件套。
// 鉴权与 /api/admin/content 相同(Authorization: Bearer <ADMIN_TOKEN>)。
// AI 生成耗时 30-60s,Vercel Hobby 上限 60s,maxDuration 显式声明。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ParseBody {
  markdown?: string;
  /** 触发 AI 三件套生成(独立按钮,不与解析混在必经路径) */
  generateAi?: boolean;
}

export async function POST(request: NextRequest) {
  const access = checkAdminAccess(request);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: ParseBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const markdown = typeof body.markdown === 'string' ? body.markdown : '';
  if (!markdown.trim()) {
    return NextResponse.json({ error: 'markdown-required' }, { status: 400 });
  }

  try {
    const doc = parseMarkdown(markdown);
    const fm = normalizeFrontmatter(doc.frontmatter);

    let ai = null;
    if (body.generateAi) {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
      ai = await generateAiTrio(markdown, { siteUrl });
    }

    // 表单预填:frontmatter 优先,AI 补缺(与 publishPost 的字段优先级一致)
    const fields = {
      title: fm.title || ai?.fields.Title || '',
      slug: fm.slug || ai?.fields.Slug || '',
      language: doc.frontmatter.language ? fm.language : ai?.fields.Language || fm.language,
      status: fm.status,
      publishDate: fm.publishDate,
      scheduledAt: '',
      summary: fm.summary || ai?.fields.Summary || '',
      tags: (fm.tags.length ? fm.tags : ai?.fields.Tags || []).join(', '),
      cover: fm.cover || doc.coverRef || '',
      // 评测扩展(方法论文可为空,评测文由 AI 生成、表单可改)
      ratingOverall: String(fm.ratingOverall ?? ai?.fields.Rating_Overall ?? ''),
      ratingEaseOfUse: String(fm.ratingEaseOfUse ?? ai?.fields.Rating_EaseOfUse ?? ''),
      ratingFeatures: String(fm.ratingFeatures ?? ai?.fields.Rating_Features ?? ''),
      pros: (fm.pros?.length ? fm.pros : ai?.fields.Pros || []).join('\n'),
      cons: (fm.cons?.length ? fm.cons : ai?.fields.Cons || []).join('\n'),
      toolWebsite: fm.toolWebsite || ai?.fields.Tool_Website || '',
      toolPricing: fm.toolPricing || ai?.fields.Tool_Pricing || '',
      comparisonColumns: fm.comparisonColumns?.length
        ? JSON.stringify(fm.comparisonColumns, null, 2)
        : ai?.fields.ComparisonColumns?.length
          ? JSON.stringify(ai.fields.ComparisonColumns, null, 2)
          : '',
      comparisonData: fm.comparisonData?.length
        ? JSON.stringify(fm.comparisonData, null, 2)
        : ai?.fields.ComparisonData?.length
          ? JSON.stringify(ai.fields.ComparisonData, null, 2)
          : '',
    };

    return NextResponse.json({
      fields,
      images: doc.images,
      coverRef: doc.coverRef,
      warnings: doc.warnings,
      ai,
      bodyLength: doc.body.length,
    });
  } catch (error: any) {
    console.error('[admin/publish/parse] Error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'parse-failed' }, { status: 500 });
  }
}
