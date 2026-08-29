import { NextRequest, NextResponse } from 'next/server';
import { getCommentsByPostId, addComment } from '@/services/notion';
import { scoreComment, decideModeration } from '@/lib/spamScore';
import { rateLimited, getClientIp } from '@/lib/rateLimit';
import { recordSubmission, recentCountForEmail } from '@/lib/commentFrequency';
import { sendCommentModerationEmail } from '@/services/email';
import type { Locale } from '@/services/notion';

// Node runtime（Notion SDK / Resend 走 Node）。
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 80;
const CONTENT_MAX = 2000;

// GET /api/comments?postId=xxx —— 前台口径：仅返回 approved（回复树已过滤）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { ok: false, code: 'invalid_input', error: 'Post ID is required' },
        { status: 400 },
      );
    }

    const comments = await getCommentsByPostId(postId);
    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('[comments GET] Error:', error?.message || error);
    return NextResponse.json(
      { ok: false, code: 'fetch_failed', error: 'Failed to fetch comments' },
      { status: 500 },
    );
  }
}

// POST /api/comments
// 流水线：限流 → 校验 → 频率计数 → 评分 → 落库三态 → 站长通知(不阻塞) → 响应
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (rateLimited(ip)) {
      return NextResponse.json(
        { ok: false, code: 'rate_limited', error: 'Too many requests' },
        { status: 429 },
      );
    }

    // 畸形 JSON 不抛 500，按非法输入处理
    const body = await request.json().catch(() => null);
    const postId = typeof body?.postId === 'string' ? body.postId.trim() : '';
    const parentId =
      typeof body?.parentId === 'string' && body.parentId.trim()
        ? body.parentId.trim()
        : null;
    const name = typeof body?.author?.name === 'string' ? body.author.name.trim() : '';
    const email = typeof body?.author?.email === 'string' ? body.author.email.trim() : '';
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    const locale: Locale = body?.locale === 'zh' ? 'zh' : 'en';

    if (
      !postId ||
      !name ||
      !email ||
      !content ||
      name.length > NAME_MAX ||
      content.length > CONTENT_MAX ||
      !EMAIL_RE.test(email)
    ) {
      return NextResponse.json(
        { ok: false, code: 'invalid_input', error: 'Missing or invalid required fields' },
        { status: 400 },
      );
    }

    // 频率（同邮箱 10 分钟窗口；计数在评分前取，含本次之前的提交）
    const recentCount = recentCountForEmail(email);

    const { score, reasons } = scoreComment({
      author: { name, email },
      content,
      recentCountForEmail: recentCount,
    });
    const decision = decideModeration(score);

    const comment = await addComment({
      postId,
      parentId,
      author: { name, email },
      content,
      status: decision,
      spamScore: score,
      spamReasons: reasons,
    });

    recordSubmission(email);

    // 站长通知：pending/spam 触发；失败仅记录，绝不阻塞评论主流程
    if (decision === 'pending' || decision === 'spam') {
      try {
        await sendCommentModerationEmail(
          process.env.COMMENT_NOTIFY_TO,
          {
            postId,
            authorName: name,
            authorEmail: email,
            content,
            status: decision,
            score,
            reasons,
          },
          locale,
        );
      } catch (notifyError: any) {
        console.error('[comments POST] notify failed (non-blocking):', notifyError?.message || notifyError);
      }
    }

    if (decision === 'approved') {
      // 前台响应剥除治理字段（不泄露反垃圾 schema）
      const publicComment = {
        id: comment.id,
        postId: comment.postId,
        parentId: comment.parentId,
        author: comment.author,
        content: comment.content,
        createdAt: comment.createdAt,
        status: comment.status,
      };
      return NextResponse.json({ ok: true, moderation: 'approved', comment: publicComment });
    }

    // pending 与 spam 响应字节同构（防差分探测阈值）；score/reasons 绝不出现在响应体
    return NextResponse.json({ ok: true, moderation: 'pending' });
  } catch (error: any) {
    console.error('[comments POST] Error:', error?.message || error);
    return NextResponse.json(
      { ok: false, code: 'submit_failed', error: 'Failed to add comment' },
      { status: 500 },
    );
  }
}
