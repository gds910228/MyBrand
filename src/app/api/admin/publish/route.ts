import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/adminAuth';
import { publishPost } from '@/lib/publish/publishPost';
import type { AiTrioResult } from '@/lib/publish/aiFields';

// POST /api/admin/publish
// 发布工作台第二步:图片上传图床 + Notion 幂等写入 + 站点缓存刷新。
// 请求体: { markdown, fields(表单定稿,最高优先级), files:[{name, base64}], status?, scheduledAt?, ai?(回传三件套用于结果展示) }
// AI 已在 parse 步骤完成,这里不再调用(useAi=false),耗时主要是图床与 Notion 写入。
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface PublishBody {
  markdown?: string;
  fields?: Record<string, unknown>;
  files?: { name: string; base64: string }[];
  status?: 'draft' | 'scheduled' | 'published';
  scheduledAt?: string;
  ai?: AiTrioResult | null;
}

export async function POST(request: NextRequest) {
  const access = checkAdminAccess(request);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: PublishBody;
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
    const files = new Map<string, Buffer>();
    for (const f of body.files || []) {
      if (!f?.name || typeof f.base64 !== 'string') continue;
      files.set(f.name, Buffer.from(f.base64, 'base64'));
    }

    const result = await publishPost(
      markdown,
      { files },
      {
        frontmatterOverrides: body.fields || {},
        status: body.status,
        scheduledAt: body.scheduledAt,
        useAi: false,
        aiPreset: body.ai || null,
        siteUrl: new URL(request.url).origin,
        revalidate: 'direct',
      },
    );

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('[admin/publish] Error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'publish-failed' }, { status: 500 });
  }
}
