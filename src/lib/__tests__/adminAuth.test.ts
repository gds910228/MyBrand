import { describe, it, expect, vi } from 'vitest';
import { evaluateAdminAccess, checkAdminAccess } from '../adminAuth';

// d) 鉴权输入校验 + Host 伪造防护(spec_review v1 P1-2)
describe('evaluateAdminAccess', () => {
  it('已配置 ADMIN_TOKEN:token 匹配放行,不匹配/缺失 401', () => {
    expect(evaluateAdminAccess({ host: 'example.com', token: 'tok', configuredToken: 'tok' })).toEqual({ allowed: true });
    expect(evaluateAdminAccess({ host: 'example.com', token: 'wrong', configuredToken: 'tok' })).toEqual({
      allowed: false, status: 401, error: 'Unauthorized',
    });
    expect(evaluateAdminAccess({ host: 'example.com', token: null, configuredToken: 'tok' }).status).toBe(401);
    expect(evaluateAdminAccess({ host: 'localhost:3000', token: 'wrong', configuredToken: 'tok' }).status).toBe(401);
  });

  it('未配置:localhost/127.0.0.1/[::1](含带端口、大写)放行并告警', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const host of ['localhost', 'localhost:3000', 'LOCALHOST:3000', '127.0.0.1', '127.0.0.1:4000', '[::1]', '[::1]:3000']) {
      expect(evaluateAdminAccess({ host, configuredToken: '' }), `host=${host}`).toEqual({ allowed: true });
    }
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('未配置:远程 host → 403(fail-closed),host 缺失也 403', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(evaluateAdminAccess({ host: 'misitebo.win', configuredToken: '' }).status).toBe(403);
    expect(evaluateAdminAccess({ host: 'localhost.evil.com', configuredToken: '' }).status).toBe(403);
    expect(evaluateAdminAccess({ host: null, configuredToken: '' }).status).toBe(403);
    expect(evaluateAdminAccess({ host: '', configuredToken: '' }).status).toBe(403);
    warn.mockRestore();
  });
});

describe('checkAdminAccess(HeaderSource)', () => {
  /** 记录实际读取了哪些 header,验证绝不读 x-forwarded-host */
  const fakeRequest = (headers: Record<string, string>) => {
    const read: string[] = [];
    return {
      read,
      req: {
        headers: {
          get: (name: string) => {
            read.push(name.toLowerCase());
            return headers[name.toLowerCase()] ?? null;
          },
        },
      },
    };
  };

  it('Bearer 头优先于 body token', () => {
    process.env.ADMIN_TOKEN = 'tok';
    const { req } = fakeRequest({ host: 'example.com', authorization: 'Bearer tok' });
    expect(checkAdminAccess(req, 'wrong-body-token')).toEqual({ allowed: true });
    delete process.env.ADMIN_TOKEN;
  });

  it('无 Bearer 时用 body token', () => {
    process.env.ADMIN_TOKEN = 'tok';
    const { req } = fakeRequest({ host: 'example.com' });
    expect(checkAdminAccess(req, 'tok')).toEqual({ allowed: true });
    expect(checkAdminAccess(req, 'nope').status).toBe(401);
    delete process.env.ADMIN_TOKEN;
  });

  it('伪造 x-forwarded-host 不得放行:只读 Host 头', () => {
    delete process.env.ADMIN_TOKEN;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { req, read } = fakeRequest({
      host: 'misitebo.win',
      'x-forwarded-host': 'localhost',
    });
    const result = checkAdminAccess(req, null);
    expect(result.status).toBe(403);
    expect(read).toContain('host');
    expect(read).not.toContain('x-forwarded-host');
    warn.mockRestore();
  });
});
