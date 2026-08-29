import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// feat-comment-moderation: /api/comments POST 流水线与 GET 过滤（spec §1.4/§5.3c）
// Notion/email 服务层 mock；评分引擎/限流/鉴权走真实代码。
vi.mock('@/services/notion', () => ({
  getCommentsByPostId: vi.fn(),
  addComment: vi.fn(),
}));

vi.mock('@/services/email', () => ({
  sendCommentModerationEmail: vi.fn(),
}));

import { POST, GET } from '@/app/api/comments/route';
import { addComment, getCommentsByPostId } from '@/services/notion';
import { sendCommentModerationEmail } from '@/services/email';
import { resetCommentFrequencyForTest } from '@/lib/commentFrequency';
import { resetRateLimitForTest } from '@/lib/rateLimit';
import type { NewCommentInput } from '@/types/comment';
import type { NextRequest } from 'next/server';

const mockedAddComment = vi.mocked(addComment);
const mockedGetComments = vi.mocked(getCommentsByPostId);
const mockedNotify = vi.mocked(sendCommentModerationEmail);

function makeRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  return new Request('http://localhost:4000/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.1', ...headers },
    body: body === null ? 'not-json{' : JSON.stringify(body),
  }) as unknown as NextRequest;
}

const validBody = (over: Record<string, any> = {}) => ({
  postId: 'post-scenario-test',
  author: { name: 'Scenario Tester', email: 'scenario@example.com' },
  content: 'This is a perfectly normal, natural and meaningful comment.',
  locale: 'en',
  ...over,
});

// 每个用例独立 IP，规避 10 次/分限流；并清邮箱频率
let ipCounter = 0;
function freshIp() {
  ipCounter += 1;
  return { 'x-forwarded-for': `172.16.${Math.floor(ipCounter / 250)}.${ipCounter % 250}` };
}

beforeEach(() => {
  resetCommentFrequencyForTest();
  resetRateLimitForTest();
  mockedAddComment.mockReset();
  mockedGetComments.mockReset();
  mockedNotify.mockReset();
  // addComment 默认把入参回显为「已落库评论」（含 id/createdAt）
  mockedAddComment.mockImplementation(async (c: NewCommentInput) => ({
    ...c,
    id: 'mock-id',
    createdAt: '2026-08-28T00:00:00Z',
    replies: [],
  }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST 三态分流', () => {
  it('S1: 正常评论 → approved 落库 + 响应含 comment（不含治理字段）+ 不触发通知', async () => {
    const res = await POST(makeRequest(validBody(), freshIp()));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.moderation).toBe('approved');
    expect(data.comment.content).toContain('normal');
    expect(data.comment).not.toHaveProperty('spamScore');
    expect(data.comment).not.toHaveProperty('spamReasons');
    expect(mockedAddComment).toHaveBeenCalledTimes(1);
    const stored = mockedAddComment.mock.calls[0][0];
    expect(stored.status).toBe('approved');
    expect(mockedNotify).not.toHaveBeenCalled();
  });

  it('S2: 多链接+黑名单词 → spam 落库；响应与 pending 同构且不含 score/reasons；触发通知', async () => {
    const spamBody = validBody({
      content:
        'Great post! https://one.example.com https://two.example.com https://three.example.com viagra free',
    });
    const res = await POST(makeRequest(spamBody, freshIp()));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.moderation).toBe('pending'); // 与 pending 字节同构
    expect(data.ok).toBe(true);
    expect(data).not.toHaveProperty('score');
    expect(data).not.toHaveProperty('reasons');
    expect(data).not.toHaveProperty('comment');
    const serialized = JSON.stringify(data);
    expect(serialized).not.toContain('score');
    expect(serialized).not.toContain('viagra');
    const stored = mockedAddComment.mock.calls[0][0];
    expect(stored.status).toBe('spam');
    expect(stored.spamScore).toBeGreaterThanOrEqual(70);
    expect(stored.spamReasons?.join(',')).toContain('keyword');
    expect(mockedNotify).toHaveBeenCalledTimes(1);
    expect(mockedNotify.mock.calls[0][1].status).toBe('spam');
  });

  it('S3: 单一可疑链接 → pending 落库；响应提示待审核语义；触发通知', async () => {
    const pendingBody = validBody({ content: 'check this http://offer.top/deals please' });
    const res = await POST(makeRequest(pendingBody, freshIp()));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ ok: true, moderation: 'pending' });
    expect(mockedAddComment.mock.calls[0][0].status).toBe('pending');
    expect(mockedNotify).toHaveBeenCalledTimes(1);
    expect(mockedNotify.mock.calls[0][1].status).toBe('pending');
  });
});

describe('POST 限流/校验/容错', () => {
  it('S4: 同 IP 第 11 次 → 429 rate_limited', async () => {
    const ip = 'x-forwarded-for';
    const ipVal = '203.0.113.77';
    let last: Response | null = null;
    for (let i = 0; i < 11; i++) {
      last = await POST(
        makeRequest(validBody({ content: `normal comment number ${i} with enough length.` }), {
          [ip]: ipVal,
        }),
      );
    }
    expect(last!.status).toBe(429);
    const data = await last!.json();
    expect(data.code).toBe('rate_limited');
  });

  it('畸形 JSON → 400 invalid_input（不进 500）', async () => {
    const res = await POST(makeRequest(null, freshIp()));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('invalid_input');
  });

  it('缺字段/非法邮箱 → 400', async () => {
    const r1 = await POST(makeRequest({ postId: 'x', author: {}, content: '' }, freshIp()));
    expect(r1.status).toBe(400);
    const r2 = await POST(makeRequest(validBody({ author: { name: 'x', email: 'not-an-email' } }), freshIp()));
    expect(r2.status).toBe(400);
  });

  it('通知邮件 throw 时不阻塞：POST 仍 200', async () => {
    mockedNotify.mockRejectedValueOnce(new Error('resend down'));
    const res = await POST(
      makeRequest(validBody({ content: 'check this http://offer.top/deals please' }), freshIp()),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).moderation).toBe('pending');
  });

  it('同邮箱第 4 次提交触发 freq 加分（端到端）', async () => {
    const headers = freshIp();
    const body = validBody({ author: { name: 'Frequent', email: 'freq@example.com' } });
    for (let i = 0; i < 4; i++) {
      // 每次用不同 IP 规避 IP 限流
      await POST(makeRequest(body, { ...headers, ...freshIp() }));
    }
    const lastCall = mockedAddComment.mock.calls[3][0];
    expect(lastCall.spamReasons?.some((r) => r.startsWith('freq:'))).toBe(true);
  });

  it('落库服务抛错 → 500 submit_failed（spec §5.1.3）', async () => {
    mockedAddComment.mockRejectedValueOnce(new Error('db down'));
    const res = await POST(makeRequest(validBody(), freshIp()));
    expect(res.status).toBe(500);
    expect((await res.json()).code).toBe('submit_failed');
  });

  it('校验边界：name 超 80、content 超 2000、纯空白 content → 400', async () => {
    const r1 = await POST(makeRequest(validBody({ author: { name: 'x'.repeat(81), email: 'a@b.com' } }), freshIp()));
    expect(r1.status).toBe(400);
    const r2 = await POST(makeRequest(validBody({ content: 'x'.repeat(2001) }), freshIp()));
    expect(r2.status).toBe(400);
    const r3 = await POST(makeRequest(validBody({ content: '   ' }), freshIp()));
    expect(r3.status).toBe(400);
  });

  it('parentId 透传落库（回复路径）', async () => {
    const res = await POST(
      makeRequest(validBody({ parentId: 'comment-root-1', content: 'a normal reply with length.' }), freshIp()),
    );
    expect(res.status).toBe(200);
    expect(mockedAddComment.mock.calls[0][0].parentId).toBe('comment-root-1');
  });

  it('locale=zh 提交 → 通知邮件按 zh 模板调用', async () => {
    const res = await POST(
      makeRequest(validBody({ locale: 'zh', content: '看这个 http://offer.top/deals 谢谢' }), freshIp()),
    );
    expect(res.status).toBe(200);
    expect(mockedNotify).toHaveBeenCalledTimes(1);
    expect(mockedNotify.mock.calls[0][2]).toBe('zh');
  });
});

describe('GET 前台口径', () => {
  it('服务层返回什么就序列化什么（路由为纯透传；字段剥除由数据层负责，见 comments-data.test）', async () => {
    const tree = [{ id: 'c1', content: 'visible', status: 'approved', replies: [] }];
    mockedGetComments.mockResolvedValueOnce(tree as any);
    const req = new Request('http://localhost:4000/api/comments?postId=p1') as unknown as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comments).toEqual(tree);
  });

  it('服务层抛错 → 500 fetch_failed（spec §5.1.3）', async () => {
    mockedGetComments.mockRejectedValueOnce(new Error('notion down'));
    const req = new Request('http://localhost:4000/api/comments?postId=p1') as unknown as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(500);
    expect((await res.json()).code).toBe('fetch_failed');
  });

  it('缺 postId → 400', async () => {
    const req = new Request('http://localhost:4000/api/comments') as unknown as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
