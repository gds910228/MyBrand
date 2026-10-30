/**
 * AI 三件套生成(feat-publish-pipeline)。
 *
 * 调用 OpenAI 兼容 chat/completions 端点(默认 GLM: open.bigmodel.cn/api/paas/v4;
 * GLM Coding Plan 套餐的 Key 用 /api/coding/paas/v4,通过 AI_BASE_URL 切换)。
 * 输出经 extractJson + validateAiTrio 健壮化处理:模型偶发围栏/前后缀噪声均能兜住,
 * 解析失败自动重试一次。配置与校验均为纯函数,vitest 可直接单测。
 */
import { buildTrioMessages } from './prompts';

export interface AiBlogFields {
  Title?: string;
  Language?: 'Chinese' | 'English';
  Summary?: string;
  Tags?: string[];
  Slug?: string;
  Rating_Overall?: number;
  Rating_EaseOfUse?: number;
  Rating_Features?: number;
  Pros?: string[];
  Cons?: string[];
  Tool_Website?: string;
  Tool_Pricing?: string;
  ComparisonColumns?: unknown[];
  ComparisonData?: unknown[];
}

export interface AiTrioResult {
  fields: AiBlogFields;
  coverPrompts: string[];
  tweet: string;
}

export interface AiClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export function resolveAiConfig(env: Record<string, string | undefined> = process.env): AiClientConfig {
  const apiKey = env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('缺少 AI_API_KEY 环境变量(GLM 或其他 OpenAI 兼容端点的 Key)');
  }
  return {
    apiKey,
    baseUrl: (env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/, ''),
    model: env.AI_MODEL || 'glm-4.6',
    timeoutMs: Number(env.AI_TIMEOUT_MS) || 120_000,
  };
}

/** 从模型回复中提取 JSON:剥代码围栏、找首尾大括号。 */
export function extractJson(text: string): unknown {
  if (!text) throw new Error('AI 返回为空');
  let candidate = text.trim();
  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidate = fence[1].trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`AI 返回中未找到 JSON 对象: ${candidate.slice(0, 80)}`);
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function toStrArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const arr = v.map((x) => String(x).trim()).filter(Boolean);
  return arr.length ? arr : undefined;
}

function toNum(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** 校验并规范化 AI 输出。宽松策略:缺字段不报错(publish 侧有 frontmatter 兜底),类型不对的丢弃。 */
export function validateAiTrio(data: unknown): { ok: boolean; errors: string[]; normalized: AiTrioResult } {
  const errors: string[] = [];
  const normalized: AiTrioResult = { fields: {}, coverPrompts: [], tweet: '' };
  if (typeof data !== 'object' || data === null) {
    return { ok: false, errors: ['AI 输出不是 JSON 对象'], normalized };
  }
  const root = data as Record<string, any>;

  if (typeof root.fields === 'object' && root.fields !== null) {
    const f = root.fields;
    const fields = normalized.fields;
    if (typeof f.Title === 'string' && f.Title.trim()) fields.Title = f.Title.trim();
    if (f.Language === 'English') fields.Language = 'English';
    else if (f.Language === 'Chinese') fields.Language = 'Chinese';
    if (typeof f.Summary === 'string' && f.Summary.trim()) fields.Summary = f.Summary.trim();
    fields.Tags = toStrArray(f.Tags);
    if (typeof f.Slug === 'string' && f.Slug.trim()) {
      fields.Slug = f.Slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    }
    fields.Rating_Overall = toNum(f.Rating_Overall);
    fields.Rating_EaseOfUse = toNum(f.Rating_EaseOfUse);
    fields.Rating_Features = toNum(f.Rating_Features);
    fields.Pros = toStrArray(f.Pros);
    fields.Cons = toStrArray(f.Cons);
    if (typeof f.Tool_Website === 'string' && f.Tool_Website.trim()) fields.Tool_Website = f.Tool_Website.trim();
    if (typeof f.Tool_Pricing === 'string' && f.Tool_Pricing.trim()) fields.Tool_Pricing = f.Tool_Pricing.trim();
    if (Array.isArray(f.ComparisonColumns) && f.ComparisonColumns.length) fields.ComparisonColumns = f.ComparisonColumns;
    if (Array.isArray(f.ComparisonData) && f.ComparisonData.length) fields.ComparisonData = f.ComparisonData;
  } else {
    errors.push('缺少 fields 对象');
  }

  if (Array.isArray(root.coverPrompts)) {
    normalized.coverPrompts = root.coverPrompts.map((p: unknown) => String(p).trim()).filter(Boolean).slice(0, 3);
  }
  if (typeof root.tweet === 'string' && root.tweet.trim()) {
    normalized.tweet = root.tweet.trim();
  }

  const ok = errors.length === 0 && Boolean(normalized.fields.Title || normalized.fields.Summary);
  return { ok, errors, normalized };
}

async function callChatCompletion(
  config: AiClientConfig,
  messages: Array<{ role: 'system' | 'user'; content: string }>,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`AI 接口返回 ${res.status}: ${detail.slice(0, 300)}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('AI 返回缺少 choices[0].message.content');
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

export interface GenerateAiTrioOptions {
  config?: AiClientConfig;
  siteUrl: string;
}

/**
 * 生成三件套。解析失败(模型偶尔无视 json_object 指令)自动重试一次,
 * 重试消息里追加更强的纯 JSON 要求。
 */
export async function generateAiTrio(
  articleMarkdown: string,
  options: GenerateAiTrioOptions,
): Promise<AiTrioResult> {
  const config = options.config || resolveAiConfig();
  const messages = buildTrioMessages(articleMarkdown, { siteUrl: options.siteUrl });

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const currentMessages =
      attempt === 0
        ? messages
        : [
            ...messages,
            {
              role: 'user' as const,
              content: '上一次输出无法解析为 JSON。请严格只输出一个 JSON 对象,不要任何解释文字或代码围栏。',
            },
          ];
    try {
      const content = await callChatCompletion(config, currentMessages);
      const parsed = extractJson(content);
      const { ok, errors, normalized } = validateAiTrio(parsed);
      if (ok) return normalized;
      lastError = new Error(`AI 输出校验失败: ${errors.join('; ')}`);
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
