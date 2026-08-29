import { describe, it, expect } from 'vitest';
import { escapeHtml, sendCommentModerationEmail, buildCommentModerationHtml } from '@/services/email';

// feat-comment-moderation: 站长邮件用户输入转义（spec §1.5/§5.3e，spec_review_v1 P1-3）
describe('escapeHtml', () => {
  it('转义 & < > " \' 五个字符', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
    expect(escapeHtml("a'b&c")).toBe('a&#39;b&amp;c');
  });
});

describe('sendCommentModerationEmail 降级与转义', () => {
  it('无 RESEND_API_KEY/无收件人 → skipped 且不抛错', async () => {
    const r = await sendCommentModerationEmail(
      undefined,
      {
        postId: 'p1',
        authorName: 'x',
        authorEmail: 'x@example.com',
        content: 'hi',
        status: 'pending',
        score: 40,
        reasons: ['links:1'],
      },
      'en',
    );
    expect(r.ok).toBe(false);
    expect((r as any).skipped).toBe(true);
  });

  it('组装后的邮件 HTML 不含未转义的恶意标签（模板插值必须经 escapeHtml）', () => {
    const payload = {
      postId: 'p1<script>',
      authorName: '<img src=x onerror=alert(1)>',
      authorEmail: 'a@b.com',
      content: 'buy <a href="http://evil.top">viagra</a> now',
      status: 'spam' as const,
      score: 99,
      reasons: ['links:3', 'keyword:viagra'],
    };
    const html = buildCommentModerationHtml('en', payload);
    expect(html).toContain('&lt;script&gt;'); // postId 出现在转义表格单元格
    expect(html).toContain('&lt;img');
    expect(html).toContain('&lt;a href=&quot;http://evil.top&quot;&gt;');
    // 不得出现可执行的原始标签
    expect(html).not.toContain('<img ');
    expect(html).not.toContain('<a href="http://evil');
    // 链接只由 postId/SITE_URL 构造（encodeURIComponent 后 < 变 %3C）
    expect(html).toContain('/blog/p1%3Cscript%3E');
  });

  it('zh locale 渲染中文模板标签', () => {
    const html = buildCommentModerationHtml('zh', {
      postId: 'p1',
      authorName: '张三',
      authorEmail: 'z@b.com',
      content: '看这个 http://offer.top/deals',
      status: 'pending',
      score: 40,
      reasons: ['suspicious_link:1'],
    });
    expect(html).toContain('垃圾评分'); // zh.json comments.notifyEmail.score
    expect(html).toContain('命中原因');
    expect(html).toContain('/zh/blog/p1'); // 中文版也列中文前台链接
  });

  it('降级发送不抛错', async () => {
    const r = await sendCommentModerationEmail(
      undefined,
      {
        postId: 'p1',
        authorName: 'x',
        authorEmail: 'x@example.com',
        content: 'hi',
        status: 'pending',
        score: 40,
        reasons: [],
      },
      'zh',
    );
    expect(r.ok).toBe(false);
    expect((r as any).skipped).toBe(true);
  });
});
