import { describe, it, expect } from 'vitest';
import {
  generatePreviewToken,
  generatePreviewUrl,
  verifyPreviewToken,
  getPreviewSecret,
  PREVIEW_TOKEN_TTL_MS,
} from '../previewToken';

// c) 预览 token 校验:无 token / 错误 token / 正确 token 三态(及过期/串号)
const SECRET = 'test-secret';
const POST = 'post-123';
const NOW = 1_723_000_000_000;

const validToken = () => generatePreviewToken(POST, SECRET, NOW + PREVIEW_TOKEN_TTL_MS);

describe('verifyPreviewToken', () => {
  it('无 token → no-token', () => {
    expect(verifyPreviewToken(POST, null, SECRET, NOW)).toEqual({ valid: false, reason: 'no-token' });
    expect(verifyPreviewToken(POST, undefined, SECRET, NOW)).toEqual({ valid: false, reason: 'no-token' });
    expect(verifyPreviewToken(POST, '', SECRET, NOW)).toEqual({ valid: false, reason: 'no-token' });
  });

  it('格式错误 → malformed', () => {
    expect(verifyPreviewToken(POST, 'not-a-token', SECRET, NOW).reason).toBe('malformed');
    expect(verifyPreviewToken(POST, 'a.b.c', SECRET, NOW).reason).toBe('malformed');
    expect(verifyPreviewToken(POST, '.', SECRET, NOW).reason).toBe('malformed');
  });

  it('签名错误(密钥不对/篡改 payload)→ bad-signature', () => {
    const wrongSecret = generatePreviewToken(POST, 'other-secret', NOW + 1000);
    expect(verifyPreviewToken(POST, wrongSecret, SECRET, NOW).reason).toBe('bad-signature');

    const [body] = validToken().split('.');
    expect(verifyPreviewToken(POST, `${body}.forgedsig`, SECRET, NOW).reason).toBe('bad-signature');
  });

  it('postId 不匹配 → wrong-post', () => {
    const tokenForOther = generatePreviewToken('post-999', SECRET, NOW + 1000);
    expect(verifyPreviewToken(POST, tokenForOther, SECRET, NOW).reason).toBe('wrong-post');
  });

  it('过期 → expired', () => {
    const expired = generatePreviewToken(POST, SECRET, NOW - 1);
    expect(verifyPreviewToken(POST, expired, SECRET, NOW).reason).toBe('expired');
  });

  it('正确 token → valid', () => {
    expect(verifyPreviewToken(POST, validToken(), SECRET, NOW)).toEqual({ valid: true });
    // 恰在过期时刻视为过期(>exp 严格大于)
    const boundary = generatePreviewToken(POST, SECRET, NOW);
    expect(verifyPreviewToken(POST, boundary, SECRET, NOW).reason).toBe('expired');
  });
});

describe('generatePreviewUrl', () => {
  it('剥离 base 尾斜杠并携带可验签 token', () => {
    process.env.PREVIEW_TOKEN = 'configured-secret';
    const url = generatePreviewUrl('post-abc', 'https://example.com/');
    expect(url.startsWith('https://example.com/api/content/post-abc/preview?token=')).toBe(true);
    const token = url.split('token=')[1];
    expect(verifyPreviewToken('post-abc', token, 'configured-secret', Date.now()).valid).toBe(true);
    delete process.env.PREVIEW_TOKEN;
  });
});

describe('getPreviewSecret', () => {
  it('配置 PREVIEW_TOKEN 时使用配置值', () => {
    process.env.PREVIEW_TOKEN = 'configured-secret';
    expect(getPreviewSecret()).toBe('configured-secret');
    delete process.env.PREVIEW_TOKEN;
  });

  it('未配置时从既有服务端密钥派生(跨路由/重启确定且稳定)', () => {
    delete process.env.PREVIEW_TOKEN;
    process.env.NOTION_API_KEY = 'test-notion-key';
    const a = getPreviewSecret();
    const b = getPreviewSecret();
    expect(a).toBeTruthy();
    expect(a).toBe(b); // 确定性派生:同一 env 下恒定,解决路由间模块实例隔离导致的 bad-signature
    expect(a).not.toBe('configured-secret');
    expect(a).not.toBe('test-notion-key'); // 不直接暴露原密钥
    delete process.env.NOTION_API_KEY;
  });

  it('连 base 密钥都没有时回退进程随机值(进程内稳定)', () => {
    delete process.env.PREVIEW_TOKEN;
    delete process.env.REVALIDATE_SECRET;
    delete process.env.NOTION_API_KEY;
    const a = getPreviewSecret();
    expect(a).toBeTruthy();
    expect(getPreviewSecret()).toBe(a);
  });
});
