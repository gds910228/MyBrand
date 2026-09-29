/**
 * 搜索域文案 EN/ZH key 对齐测试（T18；质量门禁「EN/ZH 文案 key 对齐」）。
 *
 * 项目未挂载 NextIntlClientProvider，搜索域沿用 `searchTexts` 的 locale 文案对象模式
 * （与 commentMessages / subscribeMessages / adminMessages 同一做法）。
 * 本测试断言两份文案的 key 集合完全一致——多一个或少一个都算失败。
 */
import { describe, it, expect } from 'vitest';
import { searchTexts, popularSearches } from '@/lib/searchIndex';
import { locales } from '@/i18n/locales';
import en from '@/i18n/messages/en.json';
import zh from '@/i18n/messages/zh.json';

/** 递归收集所有 key 路径。 */
function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flattenKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe('i18n / 搜索域文案对齐', () => {
  it('searchTexts 的 EN/ZH key 完全对齐', () => {
    const enKeys = flattenKeys(searchTexts.en).sort();
    const zhKeys = flattenKeys(searchTexts.zh).sort();

    const missingInZh = enKeys.filter((k) => !zhKeys.includes(k));
    const missingInEn = zhKeys.filter((k) => !enKeys.includes(k));

    expect(missingInZh, `ZH 缺少 key: ${missingInZh.join(', ')}`).toEqual([]);
    expect(missingInEn, `EN 缺少 key: ${missingInEn.join(', ')}`).toEqual([]);
    expect(enKeys.length).toBeGreaterThan(0);
  });

  it('函数型文案两侧都是函数（resultsFor / pageOf / showingRange / totalResults / relatedReasonTags）', () => {
    const fnKeys = ['resultsFor', 'pageOf', 'showingRange', 'totalResults', 'relatedReasonTags'] as const;
    for (const key of fnKeys) {
      expect(typeof (searchTexts.en as Record<string, unknown>)[key], `en.${key}`).toBe('function');
      expect(typeof (searchTexts.zh as Record<string, unknown>)[key], `zh.${key}`).toBe('function');
    }
    // 函数型文案产出非空字符串
    expect(searchTexts.en.resultsFor(2, 'q')).toContain('2');
    expect(searchTexts.zh.resultsFor(2, 'q')).toContain('2');
    expect(searchTexts.en.pageOf(1, 3)).toContain('1');
    expect(searchTexts.zh.showingRange(1, 10, 30)).toBeTruthy();
  });

  it('字符串型文案两侧均非空', () => {
    const enEntries = Object.entries(searchTexts.en) as Array<[string, unknown]>;
    for (const [key, value] of enEntries) {
      if (typeof value !== 'string') continue;
      expect(value.trim(), `en.${key}`).not.toBe('');
      const zhValue = (searchTexts.zh as Record<string, unknown>)[key];
      expect(typeof zhValue, `zh.${key}`).toBe('string');
      expect((zhValue as string).trim(), `zh.${key}`).not.toBe('');
    }
  });

  it('每种语言都有静态热门词兜底', () => {
    for (const locale of locales) {
      expect(Array.isArray(popularSearches[locale])).toBe(true);
      expect(popularSearches[locale].length).toBeGreaterThan(0);
      popularSearches[locale].forEach((term) => expect(term.trim()).not.toBe(''));
    }
  });
});

describe('i18n / 全局 messages key 对齐', () => {
  it('messages/en.json 与 zh.json 的 key 完全对齐', () => {
    const enKeys = flattenKeys(en).sort();
    const zhKeys = flattenKeys(zh).sort();

    const missingInZh = enKeys.filter((k) => !zhKeys.includes(k));
    const missingInEn = zhKeys.filter((k) => !enKeys.includes(k));

    expect(missingInZh, `zh.json 缺少: ${missingInZh.join(', ')}`).toEqual([]);
    expect(missingInEn, `en.json 缺少: ${missingInEn.join(', ')}`).toEqual([]);
  });

  it('新增的 admin.searchAnalytics 命名空间两侧齐全', () => {
    const enKeys = flattenKeys(en.admin.searchAnalytics).sort();
    const zhKeys = flattenKeys(zh.admin.searchAnalytics).sort();
    expect(enKeys).toEqual(zhKeys);
    expect(enKeys.length).toBeGreaterThan(10);
  });
});
