/**
 * Admin 路由鉴权(feat-content-state-machine, spec §1.4)。
 *
 * 语义钉死:
 * - ADMIN_TOKEN 已配置 → 必须提供匹配 token(Bearer 头或 body),否则 401;
 * - ADMIN_TOKEN 未配置 → 仅 Host 头为 localhost/127.0.0.1/[::1] 放行
 *   (只读 Host 头,绝不读 x-forwarded-host——后者可被客户端伪造,
 *   伪造后生产环境未配 token 即全网获得 admin 写权限),并 console.warn;
 *   其它 host → 403。不抛错崩溃。
 *
 * 纯结构类型,不 import Next,便于 vitest 单测(含伪造 host 用例)。
 */

export interface AdminAccessResult {
  allowed: boolean;
  status?: 401 | 403;
  error?: string;
}

export interface AdminAccessInput {
  /** 只传 Host 头的值(request.headers.get('host')) */
  host: string | null;
  /** 调用方提供的 token(Bearer 或 body) */
  token?: string | null;
  /** 默认 process.env.ADMIN_TOKEN;测试可注入 */
  configuredToken?: string | null;
}

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

/** 去端口取 hostname:'localhost:3000'→'localhost';'[::1]:3000'→'[::1]'。 */
function hostnameOf(host: string): string {
  const h = host.trim().toLowerCase();
  if (h.startsWith('[')) {
    const end = h.indexOf(']');
    return end === -1 ? h : h.slice(0, end + 1);
  }
  return h.split(':')[0];
}

export function evaluateAdminAccess(input: AdminAccessInput): AdminAccessResult {
  const configured =
    input.configuredToken !== undefined ? input.configuredToken : process.env.ADMIN_TOKEN;

  if (configured) {
    if (input.token && input.token === configured) return { allowed: true };
    return { allowed: false, status: 401, error: 'Unauthorized' };
  }

  // 未配置:仅本地访问放行(Host 头,唯一可信来源)
  const host = input.host;
  if (host && LOCAL_HOSTNAMES.has(hostnameOf(host))) {
    console.warn(
      '[adminAuth] ADMIN_TOKEN not configured - allowing local access only. ' +
        'Set ADMIN_TOKEN before deploying admin endpoints publicly.',
    );
    return { allowed: true };
  }
  return {
    allowed: false,
    status: 403,
    error: 'Admin access restricted to localhost when ADMIN_TOKEN is not configured',
  };
}

interface HeaderSource {
  headers: { get(name: string): string | null };
}

/**
 * 路由侧便捷封装。token 解析顺序:Authorization: Bearer 头 → 调用方显式传入(body)。
 * 注意:host 只取 Host 头;本函数**不接受也不读取** x-forwarded-host。
 */
export function checkAdminAccess(
  request: HeaderSource,
  bodyToken?: string | null,
): AdminAccessResult {
  const auth = request.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : null;
  return evaluateAdminAccess({
    host: request.headers.get('host'),
    token: bearer || bodyToken || null,
  });
}
