import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// feat-comment-moderation: /api/admin/comments 鉴权与流转（spec §1.6/§5.3d）
// 鉴权走真实 checkAdminAccess（evaluateAdminAccess 纯函数）；数据层 mock。
vi.mock('@/services/notion', () => ({
  getAllCommentsForAdmin: vi.fn(),
  setCommentStatus: vi.fn(),
}));

import { GET as getList } from '@/app/api/admin/comments/route';
import { POST as postStatusRoute } from '@/app/api/admin/comments/status/route';
import { getAllCommentsForAdmin, setCommentStatus } from '@/services/notion';
import type { NextRequest } from 'next/server';

const mockedList = vi.mocked(getAllCommentsForAdmin);
const mockedSetStatus = vi.mocked(setCommentStatus);

function req(
  path: string,
  init: { method?: string; body?: any; host?: string; auth?: string | null } = {},
): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    host: init.host || 'localhost:4000',
  };
  if (init.auth !== undefined && init.auth !== null) headers.authorization = init.auth;
  return new Request(`http://${headers.host}${path}`, {
    method: init.method || 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  }) as unknown as NextRequest;
}

const SAVED_TOKEN = process.env.ADMIN_TOKEN;

beforeEach(() => {
  mockedList.mockReset();
  mockedSetStatus.mockReset();
  mockedList.mockResolvedValue({
    items: [
      {
        id: 'c1',
        postId: 'p1',
        parentId: null,
        author: { name: 'A', email: 'a@example.com' },
        content: 'pending one',
        createdAt: '2026-08-28T00:00:00Z',
        status: 'pending',
        spamScore: 40,
        spamReasons: ['links:1'],
      },
    ],
    counts: { pending: 1, spam: 0, approved: 0, total: 1 },
    capped: false,
    countsCapped: false,
  });
  mockedSetStatus.mockResolvedValue({ ok: true });
});

afterEach(() => {
  if (SAVED_TOKEN === undefined) delete process.env.ADMIN_TOKEN;
  else process.env.ADMIN_TOKEN = SAVED_TOKEN;
  vi.clearAllMocks();
});

describe('GET /api/admin/comments 鉴权三态', () => {
  it('ADMIN_TOKEN 已配置：无 token → 401，错 token → 401，正确 token → 200', async () => {
    process.env.ADMIN_TOKEN = 'secret-token';
    const noToken = await getList(req('/api/admin/comments?status=pending'));
    expect(noToken.status).toBe(401);
    const wrong = await getList(req('/api/admin/comments', { auth: 'Bearer wrong-token' }));
    expect(wrong.status).toBe(401);
    const ok = await getList(req('/api/admin/comments?status=spam', { auth: 'Bearer secret-token' }));
    expect(ok.status).toBe(200);
    const data = await ok.json();
    expect(data.items).toHaveLength(1);
    expect(data.counts.pending).toBe(1);
    expect(mockedList).toHaveBeenCalledWith({ status: 'spam', limit: 50 });
  });

  it('ADMIN_TOKEN 未配置：localhost 放行；远程 host → 403', async () => {
    delete process.env.ADMIN_TOKEN;
    const local = await getList(req('/api/admin/comments', { host: 'localhost:4000' }));
    expect(local.status).toBe(200);
    const localIp = await getList(req('/api/admin/comments', { host: '127.0.0.1:4000' }));
    expect(localIp.status).toBe(200);
    const remote = await getList(req('/api/admin/comments', { host: 'misotech.example.com' }));
    expect(remote.status).toBe(403);
  });
});

describe('POST /api/admin/comments/status 流转', () => {
  it('正确 token → 以 {id,status} 调服务层并 200', async () => {
    process.env.ADMIN_TOKEN = 'secret-token';
    const res = await postStatusRoute(
      req('/api/admin/comments/status', {
        method: 'POST',
        auth: 'Bearer secret-token',
        body: { id: 'c1', status: 'approved' },
      }),
    );
    expect(res.status).toBe(200);
    expect(mockedSetStatus).toHaveBeenCalledWith('c1', 'approved');
  });

  it('无 token / 错 token → 401', async () => {
    process.env.ADMIN_TOKEN = 'secret-token';
    const r1 = await postStatusRoute(
      req('/api/admin/comments/status', { method: 'POST', body: { id: 'c1', status: 'approved' } }),
    );
    expect(r1.status).toBe(401);
    const r2 = await postStatusRoute(
      req('/api/admin/comments/status', {
        method: 'POST',
        auth: 'Bearer nope',
        body: { id: 'c1', status: 'spam' },
      }),
    );
    expect(r2.status).toBe(401);
    expect(mockedSetStatus).not.toHaveBeenCalled();
  });

  it('非法 id/status → 400', async () => {
    process.env.ADMIN_TOKEN = 'secret-token';
    const r = await postStatusRoute(
      req('/api/admin/comments/status', {
        method: 'POST',
        auth: 'Bearer secret-token',
        body: { id: '', status: 'deleted' },
      }),
    );
    expect(r.status).toBe(400);
  });

  it('服务层返回 moderation-field-missing → 400 稳定错误码', async () => {
    process.env.ADMIN_TOKEN = 'secret-token';
    mockedSetStatus.mockResolvedValueOnce({ ok: false, error: 'moderation-field-missing' });
    const r = await postStatusRoute(
      req('/api/admin/comments/status', {
        method: 'POST',
        auth: 'Bearer secret-token',
        body: { id: 'c1', status: 'approved' },
      }),
    );
    expect(r.status).toBe(400);
    const data = await r.json();
    expect(data.code).toBe('moderation-field-missing');
  });

  it('服务层返回 not-found → 404（不透传上游错误串）', async () => {
    process.env.ADMIN_TOKEN = 'secret-token';
    mockedSetStatus.mockResolvedValueOnce({ ok: false, error: 'not-found' });
    const res = await postStatusRoute(
      req('/api/admin/comments/status', {
        method: 'POST',
        auth: 'Bearer secret-token',
        body: { id: 'missing-id', status: 'approved' },
      }),
    );
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(JSON.stringify(data)).not.toContain('object_not_found');
  });

  it('服务层 reject → 500（GET）', async () => {
    process.env.ADMIN_TOKEN = 'secret-token';
    mockedList.mockRejectedValueOnce(new Error('notion down'));
    const res = await getList(req('/api/admin/comments', { auth: 'Bearer secret-token' }));
    expect(res.status).toBe(500);
  });

  it('非法 status 参数 → 回落 all', async () => {
    process.env.ADMIN_TOKEN = 'secret-token';
    const res = await getList(req('/api/admin/comments?status=bogus', { auth: 'Bearer secret-token' }));
    expect(res.status).toBe(200);
    expect(mockedList).toHaveBeenCalledWith({ status: 'all', limit: 50 });
  });

  it('畸形 JSON body → 400', async () => {
    process.env.ADMIN_TOKEN = 'secret-token';
    const headers = {
      'Content-Type': 'application/json',
      host: 'localhost:4000',
      authorization: 'Bearer secret-token',
    };
    const request = new Request('http://localhost:4000/api/admin/comments/status', {
      method: 'POST',
      headers,
      body: 'not-json{',
    }) as unknown as NextRequest;
    const res = await postStatusRoute(request);
    expect(res.status).toBe(400);
  });

  it('未配置 token + 远程 host POST → 403', async () => {
    delete process.env.ADMIN_TOKEN;
    const res = await postStatusRoute(
      req('/api/admin/comments/status', {
        method: 'POST',
        host: 'misotech.example.com',
        body: { id: 'c1', status: 'approved' },
      }),
    );
    expect(res.status).toBe(403);
    expect(mockedSetStatus).not.toHaveBeenCalled();
  });

  it('服务层 update-failed → 500', async () => {
    process.env.ADMIN_TOKEN = 'secret-token';
    mockedSetStatus.mockResolvedValueOnce({ ok: false, error: 'update-failed' });
    const res = await postStatusRoute(
      req('/api/admin/comments/status', {
        method: 'POST',
        auth: 'Bearer secret-token',
        body: { id: 'c1', status: 'spam' },
      }),
    );
    expect(res.status).toBe(500);
  });

  it('未配置 token + localhost → 放行流转', async () => {
    delete process.env.ADMIN_TOKEN;
    const r = await postStatusRoute(
      req('/api/admin/comments/status', {
        method: 'POST',
        host: 'localhost:4000',
        body: { id: 'c1', status: 'spam' },
      }),
    );
    expect(r.status).toBe(200);
    expect(mockedSetStatus).toHaveBeenCalledWith('c1', 'spam');
  });
});
