/**
 * 反垃圾评分引擎（feat-comment-moderation-20260828，spec §1.1/§1.2）。
 *
 * 纯函数纪律：不读时钟、不读网络、不读写模块级可变状态。
 * 频率类信号（同邮箱短窗口高频）由调用方计数后以 recentCountForEmail 注入；
 * 规则配置（阈值/词表/权重）全部可依赖注入，默认值内置。
 */
import type { CommentStatus } from '@/types/comment';

export interface SpamThresholds {
  /** ≥ 此分判 spam（默认 70） */
  spam: number;
  /** ≥ 此分且 < spam 判 pending（默认 30） */
  pending: number;
}

export interface SpamWeights {
  linkPerItem: number;
  linkMax: number;
  suspiciousLink: number;
  linkDensity: number;
  keyword: number;
  keywordMax: number;
  caps: number;
  repeatChars: number;
  repeatLines: number;
  tooShort: number;
  suspiciousEmail: number;
  freqMid: number;
  freqHigh: number;
}

export interface SpamRuleConfig {
  thresholds: SpamThresholds;
  keywordBlocklistEn: string[];
  keywordBlocklistZh: string[];
  suspiciousTlds: string[];
  disposableEmailDomains: string[];
  weights: SpamWeights;
  minMeaningfulLength: number;
  freqMidThreshold: number;
  freqHighThreshold: number;
}

export interface SpamScoreInput {
  author: { name: string; email: string };
  content: string;
  /** 同一邮箱统计窗口内的近期提交数（调用方注入；不接触时钟） */
  recentCountForEmail?: number;
}

export interface SpamScoreResult {
  score: number;
  reasons: string[];
}

export const DEFAULT_SPAM_CONFIG: SpamRuleConfig = {
  thresholds: { spam: 70, pending: 30 },
  // 偏高精度短语/词（误伤代价高的单词不收入；en 匹配大小写不敏感）
  keywordBlocklistEn: [
    'viagra',
    'casino',
    'payday loan',
    'free money',
    'get rich quick',
    'make money fast',
    'weight loss pills',
    'crypto airdrop',
    'airdrop giveaway',
    'lottery winner',
    'online betting',
    'seo service',
    'buy backlinks',
    'cheap meds',
    'adult dating',
    'meet hot singles',
    'bitcoin investment',
    'double your bitcoin',
  ],
  keywordBlocklistZh: [
    '赌场',
    '博彩',
    '棋牌',
    '彩票平台',
    '刷单',
    '代开发票',
    '发票代开',
    '信用卡套现',
    '加微信送',
    '日赚',
    '兼职日结',
    '免费赚钱',
    '网贷',
    '裸聊',
    '外挂下载',
    '办证刻章',
  ],
  suspiciousTlds: [
    '.xyz',
    '.top',
    '.click',
    '.win',
    '.loan',
    '.work',
    '.date',
    '.review',
    '.country',
    '.stream',
    '.gq',
    '.tk',
    '.ml',
    '.cf',
    '.ga',
    '.bid',
    '.trade',
    '.download',
  ],
  disposableEmailDomains: [
    'mailinator.com',
    'tempmail.com',
    'temp-mail.org',
    '10minutemail.com',
    'guerrillamail.com',
    'sharklasers.com',
    'throwawaymail.com',
    'yopmail.com',
    'trashmail.com',
    'getnada.com',
    'fakeinbox.com',
  ],
  weights: {
    linkPerItem: 15,
    linkMax: 45,
    suspiciousLink: 25,
    linkDensity: 15,
    keyword: 30,
    keywordMax: 50,
    caps: 20,
    repeatChars: 10,
    repeatLines: 25,
    tooShort: 20,
    suspiciousEmail: 25,
    freqMid: 40,
    freqHigh: 50,
  },
  minMeaningfulLength: 4,
  freqMidThreshold: 3,
  freqHighThreshold: 5,
};

// ── 链接提取 ────────────────────────────────────────────────────────────────

const LINK_RE = /(?:https?:\/\/|www\.)[^\s<>"']+/gi;
// 任意 scheme://（含 ftp:// 等），用于识别非 http(s) 可疑链接
const SCHEME_URL_RE = /\b[a-z][a-z0-9+.-]*:\/\/[^\s<>"']+/gi;
// 无 // 的危险 scheme（javascript:/data:/vbscript:）
const DANGEROUS_SCHEME_RE = /\b(?:javascript|data|vbscript):/gi;

interface LinkInfo {
  raw: string;
  host: string;
  isHttp: boolean;
}

function extractLinks(content: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const httpMatches = content.match(LINK_RE) || [];
  httpMatches.forEach((raw) => {
    const hostMatch = raw.match(/^(?:https?:\/\/)?([^/]+)/i);
    links.push({ raw, host: (hostMatch?.[1] || '').toLowerCase(), isHttp: true });
  });
  const schemeMatches = content.match(SCHEME_URL_RE) || [];
  schemeMatches.forEach((raw) => {
    if (/^https?:\/\//i.test(raw)) return; // http(s) 已由 LINK_RE 计数
    const hostMatch = raw.match(/^[a-z][a-z0-9+.-]*:\/\/([^/]+)/i);
    links.push({
      raw,
      host: (hostMatch?.[1] || '').toLowerCase(),
      isHttp: false,
    });
  });
  return links;
}

function isIpHost(host: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?$/.test(host);
}

function hostTld(host: string): string {
  const bare = host.split(':')[0];
  const dot = bare.lastIndexOf('.');
  return dot === -1 ? '' : bare.slice(dot).toLowerCase();
}

// ── 主评分函数 ───────────────────────────────────────────────────────────────

export function scoreComment(input: SpamScoreInput, config: SpamRuleConfig = DEFAULT_SPAM_CONFIG): SpamScoreResult {
  const content = input.content || '';
  const reasons: string[] = [];
  let score = 0;
  const w = config.weights;

  // 1) 链接数量 + 可疑链接 + 链接占比
  const links = extractLinks(content);
  const httpLinks = links.filter((l) => l.isHttp);
  if (httpLinks.length > 0) {
    score += Math.min(w.linkMax, w.linkPerItem * httpLinks.length);
    reasons.push(`links:${httpLinks.length}`);
  }
  let suspicious = 0;
  for (const link of links) {
    const tld = hostTld(link.host);
    if (!link.isHttp || isIpHost(link.host) || (tld !== '' && config.suspiciousTlds.includes(tld))) {
      suspicious++;
    }
  }
  const dangerous = (content.match(DANGEROUS_SCHEME_RE) || []).length;
  suspicious += dangerous;
  if (suspicious > 0) {
    score += w.suspiciousLink * suspicious;
    reasons.push(`suspicious_link:${suspicious}`);
  }
  const linkChars = links.reduce((sum, l) => sum + l.raw.length, 0);
  const trimmedLen = content.trim().length;
  if (trimmedLen >= 20 && linkChars / trimmedLen > 0.5) {
    score += w.linkDensity;
    reasons.push('link_density');
  }

  // 2) 黑名单关键词（en 大小写不敏感；不同命中词各计一次，封顶）
  const lower = content.toLowerCase();
  const hitKeywords = new Set<string>();
  for (const kw of config.keywordBlocklistEn) {
    if (lower.includes(kw.toLowerCase())) hitKeywords.add(kw);
  }
  for (const kw of config.keywordBlocklistZh) {
    if (content.includes(kw)) hitKeywords.add(kw);
  }
  if (hitKeywords.size > 0) {
    score += Math.min(w.keywordMax, w.keyword * hitKeywords.size);
    Array.from(hitKeywords).forEach((kw) => reasons.push(`keyword:${kw}`));
  }

  // 3) 全大写占比（拉丁字母 < 8 跳过，纯中文零误伤）
  const letters = content.match(/[A-Za-z]/g) || [];
  if (letters.length >= 8 && content.length > 15) {
    const upperRuns = content.match(/[A-Z]{3,}/g) || [];
    const upperInRuns = upperRuns.reduce((s, run) => s + run.length, 0);
    if (upperInRuns / letters.length > 0.6) {
      score += w.caps;
      reasons.push('caps');
    }
  }

  // 4) 连续重复字符（同一字符连续 ≥5）
  if (/(.)\1{4,}/.test(content)) {
    score += w.repeatChars;
    reasons.push('repeat_chars');
  }

  // 5) 重复行（去空白后相同非空行出现 ≥3 次）
  const lineCounts = new Map<string, number>();
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    lineCounts.set(line, (lineCounts.get(line) || 0) + 1);
  }
  if (Array.from(lineCounts.values()).some((c) => c >= 3)) {
    score += w.repeatLines;
    reasons.push('repeat_lines');
  }

  // 6) 内容过短/无意义（去空白与标点后 < 阈值；显式标点集，避免 ES5 target 不支持 \p{P}/u）
  const meaningful = content.replace(
    /[\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~，。！？、；：（）【】「」“”‘’…—·]/g,
    '',
  );
  if (meaningful.length < config.minMeaningfulLength) {
    score += w.tooShort;
    reasons.push('too_short');
  }

  // 7) 可疑邮箱域名/TLD
  const email = (input.author?.email || '').trim().toLowerCase();
  const at = email.lastIndexOf('@');
  const domain = at === -1 ? '' : email.slice(at + 1);
  if (domain) {
    if (config.disposableEmailDomains.includes(domain)) {
      score += w.suspiciousEmail;
      reasons.push(`email_domain:${domain}`);
    } else {
      const dot = domain.lastIndexOf('.');
      const tld = dot === -1 ? '' : domain.slice(dot);
      if (tld !== '' && config.suspiciousTlds.includes(tld)) {
        score += w.suspiciousEmail;
        reasons.push(`email_tld:${tld}`);
      }
    }
  }

  // 8) 同邮箱高频（计数由调用方注入，纯函数不接触时钟）
  const recent = input.recentCountForEmail ?? 0;
  if (recent >= config.freqHighThreshold) {
    score += w.freqHigh;
    reasons.push(`freq:${recent}`);
  } else if (recent >= config.freqMidThreshold) {
    score += w.freqMid;
    reasons.push(`freq:${recent}`);
  }

  return { score: Math.min(100, score), reasons };
}

/** 阈值分流（纯函数）。边界：29→approved、30→pending、69→pending、70→spam。 */
export function decideModeration(
  score: number,
  thresholds: SpamThresholds = DEFAULT_SPAM_CONFIG.thresholds,
): CommentStatus {
  if (score >= thresholds.spam) return 'spam';
  if (score >= thresholds.pending) return 'pending';
  return 'approved';
}
