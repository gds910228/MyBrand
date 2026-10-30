/**
 * GitHub 图床上传(feat-publish-pipeline)。
 *
 * 为什么走 GitHub Contents API 而不是本地 git push:
 * 后台发布页跑在 Vercel 上,没有本地 git 环境;CLI 与网页端必须共用同一套
 * 无状态上传逻辑 → PUT /repos/{owner}/{repo}/contents/{path}(base64)。
 *
 * 幂等策略:文件路径携带内容 sha1 前 8 位,先 GET 探测,已存在则跳过 PUT。
 * 同名不同内容会产生新路径,永不覆盖旧图(旧帖的图片引用不受影响)。
 *
 * 外链 URL 统一由 IMG_CDN_BASE 拼接(默认 jsDelivr),全站只此一处生成图片外链;
 * 未来切换 COS/R2 仅改配置,不动任何业务代码。
 *
 * 纯 fetch 实现,可在 CLI(node)与 Next 服务端路由两处运行。
 */
import { createHash } from 'crypto';

export interface ImageHostConfig {
  token: string;
  /** owner/name */
  repo: string;
  branch: string;
  /** 图片外链前缀,末尾不带斜杠,如 https://cdn.jsdelivr.net/gh/owner/repo@main */
  cdnBase: string;
  /** 仓库内根目录前缀,如 images */
  pathPrefix: string;
}

export interface UploadInput {
  /** 原始文件名(仅用于生成易读路径,不参与幂等键) */
  name: string;
  data: Buffer;
}

export interface UploadResult {
  /** 仓库内路径 */
  path: string;
  /** 外链 URL */
  url: string;
  /** 已存在同内容文件,跳过上传 */
  skipped: boolean;
}

export class ImageHostError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'ImageHostError';
  }
}

export function resolveImageHostConfig(env: Record<string, string | undefined> = process.env) {
  const token = env.GITHUB_TOKEN;
  const repo = env.IMAGE_REPO;
  if (!token) throw new ImageHostError('缺少 GITHUB_TOKEN 环境变量(需要 repo 权限的 PAT)');
  if (!repo || !repo.includes('/')) {
    throw new ImageHostError('缺少 IMAGE_REPO 环境变量(格式: owner/name,如 gds910228/misotech-images)');
  }
  const branch = env.IMAGE_BRANCH || 'main';
  return {
    token,
    repo,
    branch,
    cdnBase: (env.IMG_CDN_BASE || `https://cdn.jsdelivr.net/gh/${repo}@${branch}`).replace(/\/$/, ''),
    pathPrefix: (env.IMAGE_PATH_PREFIX || 'images').replace(/^\/|\/$/g, ''),
  } satisfies ImageHostConfig;
}

/** 文件名 ASCII 化:中文/空格转连字符,保留扩展名,避免外链 URL 编码问题。 */
export function sanitizeFileName(name: string): string {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : '';
  const safeStem =
    stem
      .normalize('NFKD')
      .replace(/[^\w-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'img';
  return `${safeStem}${ext || '.png'}`;
}

function contentSha(data: Buffer): string {
  // 简易内容指纹:sha1 前 8 位足够避免日常写作场景的碰撞
  return createHash('sha1').update(data).digest('hex').slice(0, 8);
}

const GH_API = 'https://api.github.com';

function ghHeaders(config: ImageHostConfig) {
  return {
    Authorization: `Bearer ${config.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };
}

async function ghRequest(
  config: ImageHostConfig,
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${GH_API}${path}`, {
    ...init,
    headers: { ...ghHeaders(config), ...(init?.headers || {}) },
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // 204 等空响应
  }
  if (!res.ok && res.status !== 404) {
    throw new ImageHostError(
      `GitHub API ${init?.method || 'GET'} ${path} 失败`,
      res.status,
      JSON.stringify(body?.message || body).slice(0, 300),
    );
  }
  return { status: res.status, body };
}

/**
 * 上传单张图片,返回外链 URL。已存在同路径(同内容)时跳过。
 * @param slugOrDir 帖子目录名(通常为 slug),保证每帖图片归档清晰
 */
export async function uploadImage(
  input: UploadInput,
  slugOrDir: string,
  config: ImageHostConfig = resolveImageHostConfig(),
): Promise<UploadResult> {
  const fileName = `${contentSha(input.data)}-${sanitizeFileName(input.name)}`;
  const dir = slugOrDir.replace(/[^\w-]/g, '-').replace(/^-|-$/g, '') || 'misc';
  const repoPath = `${config.pathPrefix}/${dir}/${fileName}`;
  const encoded = repoPath.split('/').map(encodeURIComponent).join('/');

  // 幂等探测:同内容文件已存在 → 直接复用,不再 PUT
  const probe = await ghRequest(config, `/repos/${config.repo}/contents/${encoded}?ref=${config.branch}`);
  if (probe.status === 200) {
    return { path: repoPath, url: `${config.cdnBase}/${repoPath}`, skipped: true };
  }

  const put = await ghRequest(config, `/repos/${config.repo}/contents/${encoded}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `upload image ${fileName} (publish pipeline)`,
      content: input.data.toString('base64'),
      branch: config.branch,
    }),
  });
  if (put.status !== 201 && put.status !== 200) {
    throw new ImageHostError(
      `上传图片失败: ${input.name}`,
      put.status,
      JSON.stringify(put.body).slice(0, 300),
    );
  }
  return { path: repoPath, url: `${config.cdnBase}/${repoPath}`, skipped: false };
}

export interface BatchUploadResult {
  /** ref → 外链 URL 映射(含 cover 引用,由调用方合并) */
  urlByRef: Map<string, string>;
  uploaded: number;
  skipped: number;
}

/** 批量上传:ref → Buffer;同名 ref 复用同一 Buffer。 */
export async function uploadImages(
  files: Map<string, Buffer>,
  slugOrDir: string,
  config: ImageHostConfig = resolveImageHostConfig(),
): Promise<BatchUploadResult> {
  const urlByRef = new Map<string, string>();
  let uploaded = 0;
  let skipped = 0;
  for (const [ref, data] of Array.from(files.entries())) {
    const result = await uploadImage({ name: ref, data }, slugOrDir, config);
    urlByRef.set(ref, result.url);
    if (result.skipped) skipped++;
    else uploaded++;
  }
  return { urlByRef, uploaded, skipped };
}
