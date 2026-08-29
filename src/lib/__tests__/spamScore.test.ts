import { describe, it, expect } from 'vitest';
import {
  scoreComment,
  decideModeration,
  DEFAULT_SPAM_CONFIG,
  type SpamScoreInput,
} from '../spamScore';

// feat-comment-moderation: 反垃圾评分纯函数（spec §1.1/§1.2/§5.3a）
const baseInput = (over: Partial<SpamScoreInput> = {}): SpamScoreInput => ({
  author: { name: 'Reader', email: 'reader@gmail.com' },
  content:
    'This article really helped me understand how App Router caching works. Thanks for the clear explanation!',
  ...over,
});

describe('scoreComment - 正常评论基线', () => {
  it('自然语言、无链接、正常邮箱 → 0 分且无 reasons', () => {
    const r = scoreComment(baseInput());
    expect(r.score).toBe(0);
    expect(r.reasons).toEqual([]);
  });

  it('中文正常评论 → 0 分（纯中文不触发 caps 规则）', () => {
    const r = scoreComment(
      baseInput({
        author: { name: '读者', email: 'duzhe@163.com' },
        content: '这篇文章把 App Router 的缓存机制讲得很清楚，受益匪浅，感谢分享！',
      }),
    );
    expect(r.score).toBe(0);
  });

  it('短而正常的评论（Thanks!）不触发 too_short', () => {
    const r = scoreComment(baseInput({ content: 'Thanks!' }));
    expect(r.score).toBe(0);
  });
});

describe('scoreComment - 各规则独立命中均得正分', () => {
  it('链接数量：3 条链接命中 links:3', () => {
    const r = scoreComment(
      baseInput({
        content:
          'nice post https://a.example.com/p https://b.example.com/q https://c.example.com/r',
      }),
    );
    expect(r.score).toBeGreaterThan(0);
    expect(r.reasons).toContain('links:3');
  });

  it('可疑链接：可疑 TLD 链接命中 suspicious_link，且同时计入 links', () => {
    const r = scoreComment(
      baseInput({ content: 'look http://cheap-shoes.xyz/buy-now great deal' }),
    );
    expect(r.reasons).toContain('suspicious_link:1');
    expect(r.reasons).toContain('links:1');
    // 15(link) + 25(suspicious)，密度规则可能再加 15——均落 pending 区间
    expect(r.score).toBeGreaterThanOrEqual(40);
    expect(decideModeration(r.score)).toBe('pending');
  });

  it('非 http(s) scheme（ftp/javascript）命中 suspicious_link 但不计 links', () => {
    const ftp = scoreComment(baseInput({ content: 'download ftp://files.xyz/pub now' }));
    expect(ftp.reasons).toContain('suspicious_link:1');
    expect(ftp.reasons).not.toContain('links:1');
    const js = scoreComment(
      baseInput({ content: 'x javascript:alert(1) y'.repeat(3) }),
    );
    expect(js.reasons.join(',')).toContain('suspicious_link');
  });

  it('链接占比过高命中 link_density', () => {
    const dense = 'https://a.example.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const r = scoreComment(baseInput({ content: dense }));
    expect(r.reasons).toContain('link_density');
  });

  it('黑名单关键词：英文大小写不敏感命中 keyword', () => {
    const lower = scoreComment(baseInput({ content: 'buy VIAGRA cheap online' }));
    expect(lower.reasons).toContain('keyword:viagra');
    const upper = scoreComment(baseInput({ content: 'CASINO bonus here' }));
    expect(upper.reasons.some((x) => x.startsWith('keyword:'))).toBe(true);
  });

  it('黑名单关键词：中文命中', () => {
    const r = scoreComment(baseInput({ content: '加微信送红包，日赚千元不是梦' }));
    expect(r.reasons).toContain('keyword:加微信送');
    expect(r.reasons).toContain('keyword:日赚');
  });

  it('全大写占比命中 caps（拉丁字母足够时），纯中文跳过', () => {
    const r = scoreComment(
      baseInput({
        content: 'THIS WHOLE COMMENT IS SHOUTING VERY LOUDLY AND ANGRILY',
      }),
    );
    expect(r.reasons).toContain('caps');
    const zh = scoreComment(baseInput({ content: '好好好好好好好好好好' }));
    expect(zh.reasons).not.toContain('caps');
  });

  it('连续重复字符命中 repeat_chars', () => {
    const r = scoreComment(baseInput({ content: 'nice article!!!!!!! wow' }));
    expect(r.reasons).toContain('repeat_chars');
  });

  it('重复行命中 repeat_lines', () => {
    const r = scoreComment(
      baseInput({ content: ['same line here', 'same line here', 'same line here'].join('\n') }),
    );
    expect(r.reasons).toContain('repeat_lines');
  });

  it('内容过短命中 too_short', () => {
    const r = scoreComment(baseInput({ content: '1' }));
    expect(r.reasons).toContain('too_short');
  });

  it('可疑邮箱：一次性域名命中 email_domain，可疑 TLD 命中 email_tld', () => {
    const disposable = scoreComment(
      baseInput({ author: { name: 'x', email: 'spam@mailinator.com' } }),
    );
    expect(disposable.reasons).toContain('email_domain:mailinator.com');
    const tld = scoreComment(baseInput({ author: { name: 'x', email: 'a@spam.xyz' } }));
    expect(tld.reasons).toContain('email_tld:.xyz');
  });

  it('同邮箱高频：recentCountForEmail 注入生效（>=3 中频 / >=5 高频）', () => {
    const mid = scoreComment(baseInput({ recentCountForEmail: 3 }));
    expect(mid.reasons).toContain('freq:3');
    const high = scoreComment(baseInput({ recentCountForEmail: 6 }));
    expect(high.reasons).toContain('freq:6');
    expect(high.score).toBeGreaterThanOrEqual(mid.score);
  });
});

describe('decideModeration - 阈值边界钉死', () => {
  it('29→approved, 30→pending, 69→pending, 70→spam', () => {
    expect(decideModeration(29)).toBe('approved');
    expect(decideModeration(30)).toBe('pending');
    expect(decideModeration(69)).toBe('pending');
    expect(decideModeration(70)).toBe('spam');
    expect(decideModeration(0)).toBe('approved');
    expect(decideModeration(100)).toBe('spam');
  });
});

describe('依赖注入', () => {
  it('自定义阈值生效（注入 pending=50, spam=90）', () => {
    const cfg = {
      ...DEFAULT_SPAM_CONFIG,
      thresholds: { pending: 50, spam: 90 },
    };
    expect(decideModeration(49, cfg.thresholds)).toBe('approved');
    expect(decideModeration(50, cfg.thresholds)).toBe('pending');
    expect(decideModeration(90, cfg.thresholds)).toBe('spam');
  });

  it('自定义词表生效（默认词表外的词可注入命中）', () => {
    const cfg = {
      ...DEFAULT_SPAM_CONFIG,
      keywordBlocklistEn: ['zxcustombadword'],
    };
    const r = scoreComment(baseInput({ content: 'contains zxcustombadword here' }), cfg);
    expect(r.reasons).toContain('keyword:zxcustombadword');
    // 默认词表不受影响
    expect(scoreComment(baseInput({ content: 'casino' })).reasons.join(',')).toContain(
      'keyword:casino',
    );
  });

  it('权重可注入：too_short 权重置 0 后不再加分', () => {
    const cfg = {
      ...DEFAULT_SPAM_CONFIG,
      weights: { ...DEFAULT_SPAM_CONFIG.weights, tooShort: 0 },
    };
    const r = scoreComment(baseInput({ content: '1' }), cfg);
    expect(r.score).toBe(0);
  });

  it('总分封顶 100', () => {
    const r = scoreComment(
      baseInput({
        content:
          'VIAGRA casino lottery https://a.xyz https://b.xyz https://c.xyz ftp://x.yz ' +
          '加微信送 刷单 代开发票 THIS IS SHOUTING LOUDLY !!!!!!!! ' +
          'https://d.example.com https://e.example.com',
        recentCountForEmail: 99,
        author: { name: 'x', email: 'spam@mailinator.xyz' },
      }),
    );
    expect(r.score).toBeLessThanOrEqual(100);
    expect(decideModeration(r.score)).toBe('spam');
  });
});

describe('规则语义细节（spec §1.1 钉死）', () => {
  it('裸域名不算链接（无 scheme/www.）', () => {
    const r = scoreComment(baseInput({ content: 'check example.com and foo.xyz please' }));
    expect(r.reasons.some((x) => x.startsWith('links'))).toBe(false);
    expect(r.score).toBe(0);
  });

  it('www. 前缀算链接；IP 主机链接视为可疑', () => {
    const www = scoreComment(baseInput({ content: 'see www.example.com/article here please' }));
    expect(www.reasons).toContain('links:1');
    const ip = scoreComment(baseInput({ content: 'open http://192.168.1.1/x now please' }));
    expect(ip.reasons).toContain('suspicious_link:1');
  });

  it('两个不同关键词命中封顶 50 分（不是 60）', () => {
    const r = scoreComment(baseInput({ content: '加微信送红包，还有赌场玩法哦' }));
    const kw = r.reasons.filter((x) => x.startsWith('keyword:')).length;
    expect(kw).toBeGreaterThanOrEqual(2);
    expect(r.score).toBe(50);
  });

  it('短拉丁字符串（<8 字母）不触发 caps，即使全大写', () => {
    const r = scoreComment(baseInput({ content: 'LOL' }));
    expect(r.reasons).not.toContain('caps');
  });

  it('freq 边界：3 次不触发（低频），4 次中频，5 次高频', () => {
    expect(scoreComment(baseInput({ recentCountForEmail: 2 })).reasons.some((x) => x.startsWith('freq'))).toBe(false);
    expect(scoreComment(baseInput({ recentCountForEmail: 4 })).score).toBeGreaterThanOrEqual(40);
    expect(scoreComment(baseInput({ recentCountForEmail: 5 })).score).toBeGreaterThanOrEqual(50);
  });

  it('邮箱大小写归一：大写一次性域名仍命中', () => {
    const r = scoreComment(
      baseInput({ author: { name: 'x', email: 'SPAM@MAILINATOR.COM' } }),
    );
    expect(r.reasons).toContain('email_domain:mailinator.com');
  });
});

describe('场景矩阵对齐（S1/S2/S3）', () => {
  it('S2: 3 链接 + 黑名单词 → spam', () => {
    const r = scoreComment(
      baseInput({
        content:
          'Great post! https://one.example.com https://two.example.com https://three.example.com also viagra free',
      }),
    );
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(decideModeration(r.score)).toBe('spam');
  });

  it('S3: 单个可疑链接 → pending', () => {
    const r = scoreComment(baseInput({ content: 'check this http://offer.top/deals' }));
    expect(r.score).toBeGreaterThanOrEqual(30);
    expect(r.score).toBeLessThan(70);
    expect(decideModeration(r.score)).toBe('pending');
  });
});
