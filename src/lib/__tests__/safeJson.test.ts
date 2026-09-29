import { describe, it, expect } from 'vitest';
import { safeJsonStringify } from '@/lib/safeJson';

describe('safeJson / HTML 安全序列化（S12 加固）', () => {
  it('转义 < > &，报文不再出现可执行片段', () => {
    const out = safeJsonStringify({ query: '<script>alert(1)</script>' });
    expect(out).not.toMatch(/<script/i);
    expect(out).toContain('\\u003c');
    expect(out).toContain('\\u003e');
  });

  it('转义后 JSON 解析结果与原文**完全一致**（无损）', () => {
    const body = {
      query: '<script>alert(1)</script>',
      title: 'a & b',
      nested: { excerpt: '5 < 6 && 7 > 6' },
      list: ['<img src=x onerror=alert(1)>'],
    };
    const parsed = JSON.parse(safeJsonStringify(body));
    expect(parsed).toEqual(body);
    // 逐字段确认无损
    expect(parsed.query).toBe('<script>alert(1)</script>');
    expect(parsed.nested.excerpt).toBe('5 < 6 && 7 > 6');
  });

  it('转义 U+2028 / U+2029（JS 行分隔符，可破坏 JSONP/内联脚本）', () => {
    const out = safeJsonStringify({ q: 'a b c' });
    expect(out).not.toContain(' ');
    expect(out).not.toContain(' ');
    expect(out).toContain('\\u2028');
    expect(out).toContain('\\u2029');
    expect(JSON.parse(out).q).toBe('a b c');
  });

  it('中文与 emoji 不受影响', () => {
    const body = { q: '入门指南 😀' };
    const out = safeJsonStringify(body);
    expect(JSON.parse(out)).toEqual(body);
    expect(out).toContain('入门指南');
  });

  it('普通 JSON 结构与类型保持（数字/布尔/null/数组/嵌套）', () => {
    const body = { n: 1, f: 1.5, b: true, z: null, arr: [1, 'a'], o: { k: 'v' } };
    expect(JSON.parse(safeJsonStringify(body))).toEqual(body);
  });

  it('顶层数组与原始值也可序列化', () => {
    expect(JSON.parse(safeJsonStringify([1, 2, 3]))).toEqual([1, 2, 3]);
    expect(JSON.parse(safeJsonStringify('<a>'))).toBe('<a>');
    expect(safeJsonStringify(undefined)).toBe('null');
  });

  it('超长字符串不抛错', () => {
    const long = 'x'.repeat(100000);
    expect(() => safeJsonStringify({ q: long })).not.toThrow();
    expect(JSON.parse(safeJsonStringify({ q: long })).q).toHaveLength(100000);
  });
});
