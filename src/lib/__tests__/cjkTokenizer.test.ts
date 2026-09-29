import { describe, it, expect } from 'vitest';
import {
  MAX_CJK_RUN_LENGTH,
  cjkBigrams,
  cjkUnigrams,
  expandForIndex,
  expandForQuery,
  isCjkChar,
  queryHighlightTerms,
  queryTokens,
  segmentText,
  tokenizeText,
} from '@/lib/cjkTokenizer';

describe('cjkTokenizer / segmentText', () => {
  it('把中英混排切成交替的 CJK 片段与拉丁词', () => {
    const segs = segmentText('Next.js 14 入门指南');
    expect(segs.map((s) => s.type)).toEqual(['word', 'word', 'cjk']);
    // "Next.js" → 去连接符后小写为 nextjs；"14" 保留
    expect(segs[0].value).toBe('nextjs');
    expect(segs[1].value).toBe('14');
    expect(segs[2].value).toBe('入门指南');
  });

  it('拉丁词归一化：Next.js / nextjs / NEXT-JS 产出同一 token', () => {
    const values = ['Next.js', 'nextjs', 'NEXT-JS', 'next_js', 'next/js'].map((t) =>
      segmentText(t).map((s) => s.value).join('|'),
    );
    expect(new Set(values).size).toBe(1);
    expect(values[0]).toBe('nextjs');
  });

  it('空格分隔的 Next JS 产出两个 token（非等价于 nextjs，但 AND+prefix 仍可召回）', () => {
    expect(segmentText('Next JS').map((s) => s.value)).toEqual(['next', 'js']);
  });

  it('CJK 片段之间不合并（被非 CJK 字符隔开）', () => {
    const segs = segmentText('React中的应用');
    expect(segs.map((s) => s.type)).toEqual(['word', 'cjk']);
    expect(segs[1].value).toBe('中的应用');
  });

  it('空串 / 纯标点 / 纯空白产出空片段列表', () => {
    expect(segmentText('')).toEqual([]);
    expect(segmentText('   ')).toEqual([]);
    expect(segmentText('!!!...???')).toEqual([]);
    expect(segmentText('、。？！')).toEqual([]);
  });

  it('emoji 被当作非 CJK 分隔符（本身不产生 token，但会切断拉丁词）', () => {
    expect(segmentText('😀')).toEqual([]);
    expect(tokenizeText('hello😀next')).toEqual(['hello', 'next']);
    // emoji 不影响 CJK 片段识别
    expect(segmentText('中文😀中文').map((s) => s.value)).toEqual(['中文', '中文']);
  });

  it('超长 CJK 片段按码点截断到上限', () => {
    const long = '一'.repeat(500);
    const segs = segmentText(long);
    expect(segs).toHaveLength(1);
    expect(Array.from(segs[0].value)).toHaveLength(MAX_CJK_RUN_LENGTH);
  });
});

describe('cjkTokenizer / isCjkChar', () => {
  it('识别基本区、扩展 A、假名、谚文', () => {
    expect(isCjkChar('中')).toBe(true);
    expect(isCjkChar('㐀')).toBe(true); // 扩展 A
    expect(isCjkChar('あ')).toBe(true);
    expect(isCjkChar('한')).toBe(true);
  });

  it('识别增补平面 CJK（扩展 B，如「𠮷」）', () => {
    expect(isCjkChar('𠮷')).toBe(true);
    expect(isCjkChar('𡃁')).toBe(true);
  });

  it('拉丁字母、数字、标点、emoji 均非 CJK', () => {
    for (const ch of ['a', 'Z', '5', '.', '-', '😀', ' ']) {
      expect(isCjkChar(ch), ch).toBe(false);
    }
  });

  it('增补平面字符不会被误判为分隔符而丢弃', () => {
    const segs = segmentText('测试𠮷汉字');
    expect(segs).toHaveLength(1);
    expect(segs[0].type).toBe('cjk');
    expect(segs[0].value).toBe('测试𠮷汉字');
  });
});

describe('cjkTokenizer / n-gram 展开', () => {
  it('unigram 与 bigram', () => {
    expect(cjkUnigrams('入门')).toEqual(['入', '门']);
    expect(cjkBigrams('入门指南')).toEqual(['入门', '门指', '指南']);
    expect(cjkBigrams('单')).toEqual([]);
  });

  it('索引侧：CJK 片段 → unigram ∪ bigram（去重）', () => {
    const tokens = expandForIndex('谢谢');
    expect(tokens).toContain('谢');
    // unigram「谢」去重后只出现一次
    expect(tokens.filter((t) => t === '谢')).toHaveLength(1);
    expect(tokens).toContain('谢谢');
  });

  it('索引侧：单字片段只产出该字', () => {
    expect(expandForIndex('门')).toEqual(['门']);
  });

  it('索引侧：拉丁词原样保留', () => {
    expect(expandForIndex('nextjs')).toEqual(['nextjs']);
  });

  it('查询侧：多字片段只产出 bigram（不含 unigram，保证精度）', () => {
    expect(expandForQuery('入门')).toEqual(['入门']);
    expect(expandForQuery('性能优化')).toEqual(['性能', '能优', '优化']);
    expect(expandForQuery('入门')).not.toContain('入');
  });

  it('查询侧：单字片段产出该字（配合索引侧 unigram 可召回）', () => {
    expect(expandForQuery('门')).toEqual(['门']);
  });

  it('查询侧：空串产出空数组', () => {
    expect(expandForQuery('')).toEqual([]);
    expect(expandForIndex('')).toEqual([]);
  });

  it('queryTokens 处理中英混合', () => {
    expect(queryTokens('Next.js 入门')).toEqual(['nextjs', '入门']);
    expect(queryTokens('React 性能优化')).toEqual(['react', '性能', '能优', '优化']);
  });

  it('queryHighlightTerms 保持 CJK 整段词面（不拆 bigram）', () => {
    expect(queryHighlightTerms('Next.js 入门指南')).toEqual(['nextjs', '入门指南']);
  });
});
