/**
 * 草稿预览 token 签发与校验(feat-content-state-machine, spec §1.2)。
 *
 * token 形如 `<base64url(payload)>.<base64url(hmac-sha256)>`,
 * payload = { postId, exp }。复用订阅系统的 HMAC 模式(常量时间比较)。
 *
 * 密钥策略(P1-3 修复):
 * - 配置 PREVIEW_TOKEN → 使用它;
 * - 未配置 → 进程启动时生成随机密钥(非源码常量,防止读库者伪造),
 *   并 console.warn 降级提示;进程重启后旧 token 失效(本地场景可接受)。
 *
 * 本文件不依赖 Next runtime,可被 vitest 直接单测。
 */
import crypto from 'crypto';

export type PreviewTokenInvalidReason =
  | 'no-token'
  | 'malformed'
  | 'bad-signature'
  | 'wrong-post'
  | 'expired';

export interface PreviewTokenVerifyResult {
  valid: boolean;
  reason?: PreviewTokenInvalidReason;
}

export const PREVIEW_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

// 进程级随机兜底密钥:模块加载时生成,仅在 PREVIEW_TOKEN/REVALIDATE_SECRET/NOTION_API_KEY
// 全部缺失的极端本地场景使用。刻意不写成固定源码常量——源码可被读取,固定常量等于公开密钥。
const EPHEMERAL_PREVIEW_SECRET = crypto.randomBytes(32).toString('base64url');
let warnedEphemeral = false;

/**
 * 取预览密钥,降级链:
 * 1. PREVIEW_TOKEN(显式配置)→ 使用之;
 * 2. 未配置 → 从服务端既有密钥(REVALIDATE_SECRET 或 NOTION_API_KEY)派生
 *    sha256(`${base}|misotech-preview-fallback`)。
 *    为什么不用纯进程随机值:Next.js 每条路由可能持有独立的模块实例,
 *    模块级随机密钥会导致 admin 路由签发的 token 在 preview 路由验签失败
 *    (2026-08-11 本地 E2E 实测 bad-signature 发现)。派生密钥只依赖环境变量,
 *    跨路由/跨重启/跨实例稳定,且不随源码公开(持有 NOTION_API_KEY 者本就能直读草稿,
 *    不构成额外提权)。
 * 3. 连 base 都没有(纯本地裸跑)→ 进程随机值兜底 + 告警;此场景 token 可能跨路由失效,
 *    仅用于演示,控制台会打印预览链接。
 */
export function getPreviewSecret(): string {
  const configured = process.env.PREVIEW_TOKEN;
  if (configured) return configured;

  const base = process.env.REVALIDATE_SECRET || process.env.NOTION_API_KEY;
  if (base) {
    return crypto
      .createHash('sha256')
      .update(`${base}|misotech-preview-fallback`)
      .digest('base64url');
  }

  if (!warnedEphemeral) {
    warnedEphemeral = true;
    console.warn(
      '[previewToken] PREVIEW_TOKEN not configured - using ephemeral process-random secret. ' +
        'Preview links are printed to the server console and may not survive route isolation/restart.',
    );
  }
  return EPHEMERAL_PREVIEW_SECRET;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function sign(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('base64url');
}

/** 签发预览 token。 */
export function generatePreviewToken(postId: string, secret: string, expiresAtMs: number): string {
  const body = b64url(JSON.stringify({ postId, exp: expiresAtMs }));
  return `${body}.${sign(body, secret)}`;
}

/** 便捷:按默认 TTL 签发。 */
export function generatePreviewUrl(postId: string, baseUrl: string): string {
  const secret = getPreviewSecret();
  const token = generatePreviewToken(postId, secret, Date.now() + PREVIEW_TOKEN_TTL_MS);
  const url = `${baseUrl.replace(/\/$/, '')}/api/content/${postId}/preview?token=${token}`;
  if (!process.env.PREVIEW_TOKEN) {
    console.warn(`[previewToken] Preview URL for post ${postId}: ${url}`);
  }
  return url;
}

/** 校验预览 token(三态:无 token / 错误 token / 正确)。 */
export function verifyPreviewToken(
  postId: string,
  token: string | null | undefined,
  secret: string,
  nowMs: number,
): PreviewTokenVerifyResult {
  if (!token) return { valid: false, reason: 'no-token' };
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, reason: 'malformed' };
  }
  const [body, sig] = parts;
  const expected = sign(body, secret);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false, reason: 'bad-signature' };
  }
  let payload: { postId?: unknown; exp?: unknown };
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { valid: false, reason: 'malformed' };
  }
  if (payload.postId !== postId) return { valid: false, reason: 'wrong-post' };
  // 到期时刻起即不可用(对齐 JWT exp 语义:now >= exp → expired,宁严勿宽)
  if (typeof payload.exp !== 'number' || nowMs >= payload.exp) {
    return { valid: false, reason: 'expired' };
  }
  return { valid: true };
}
