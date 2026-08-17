import { describe, it, expect } from 'vitest';
import {
  normalizeStatus,
  isPubliclyVisible,
  toNotionStatusName,
  isValidContentStatus,
  isValidISODate,
  filterPubliclyVisible,
} from '../contentStatus';

// a) 状态过滤:draft/scheduled 不出现在公开列表(含旧数据无 status 兜底 published)
describe('normalizeStatus', () => {
  it('空值/缺失一律兜底为 published(兼容旧数据)', () => {
    expect(normalizeStatus(undefined)).toBe('published');
    expect(normalizeStatus(null)).toBe('published');
    expect(normalizeStatus('')).toBe('published');
    expect(normalizeStatus('   ')).toBe('published');
  });

  it('大小写不敏感映射三态', () => {
    expect(normalizeStatus('Published')).toBe('published');
    expect(normalizeStatus('PUBLISHED')).toBe('published');
    expect(normalizeStatus('Draft')).toBe('draft');
    expect(normalizeStatus('draft')).toBe('draft');
    expect(normalizeStatus('Scheduled')).toBe('scheduled');
    expect(normalizeStatus('SCHEDULED')).toBe('scheduled');
    expect(normalizeStatus(' draft ')).toBe('draft');
  });

  it('未知非空状态值视为 draft(防泄露)', () => {
    expect(normalizeStatus('Idea')).toBe('draft');
    expect(normalizeStatus('In Progress')).toBe('draft');
    expect(normalizeStatus('Archived')).toBe('draft');
  });
});

describe('filterPubliclyVisible / isPubliclyVisible', () => {
  it('draft 与 scheduled 不出现在公开列表,published 与无 status 旧数据出现', () => {
    const posts = [
      { id: '1', status: 'Published' },
      { id: '2', status: 'Draft' },
      { id: '3', status: 'Scheduled' },
      { id: '4', status: undefined }, // 旧数据无 status
      { id: '5', status: null },
      { id: '6', status: 'published' },
      { id: '7', status: 'Idea' }, // 未知值按 draft 隐藏
    ];
    const visible = filterPubliclyVisible(posts);
    expect(visible.map((p) => p.id)).toEqual(['1', '4', '5', '6']);
    expect(isPubliclyVisible('Scheduled')).toBe(false);
    expect(isPubliclyVisible(undefined)).toBe(true);
  });

  it('空列表返回空列表', () => {
    expect(filterPubliclyVisible([])).toEqual([]);
  });
});

describe('toNotionStatusName', () => {
  it('小写枚举映射为首字母大写规范名', () => {
    expect(toNotionStatusName('draft')).toBe('Draft');
    expect(toNotionStatusName('scheduled')).toBe('Scheduled');
    expect(toNotionStatusName('published')).toBe('Published');
  });
});

// d) 状态流转 API 输入校验
describe('isValidContentStatus', () => {
  it('接受三态小写', () => {
    expect(isValidContentStatus('draft')).toBe(true);
    expect(isValidContentStatus('scheduled')).toBe(true);
    expect(isValidContentStatus('published')).toBe(true);
  });

  it('拒绝非法输入(大写/未知/非字符串/空)', () => {
    expect(isValidContentStatus('Published')).toBe(false);
    expect(isValidContentStatus('idea')).toBe(false);
    expect(isValidContentStatus('')).toBe(false);
    expect(isValidContentStatus(undefined)).toBe(false);
    expect(isValidContentStatus(null)).toBe(false);
    expect(isValidContentStatus(123)).toBe(false);
    expect(isValidContentStatus({})).toBe(false);
  });
});

describe('isValidISODate', () => {
  it('接受合法 ISO 日期', () => {
    expect(isValidISODate('2026-08-11T10:00:00.000Z')).toBe(true);
    expect(isValidISODate('2026-08-11')).toBe(true);
    expect(isValidISODate('2026-08-11T18:00:00+08:00')).toBe(true);
  });

  it('拒绝非法输入(格式错/非字符串/空)', () => {
    expect(isValidISODate('not-a-date')).toBe(false);
    expect(isValidISODate('2026-13-45T99:99')).toBe(false);
    expect(isValidISODate('')).toBe(false);
    expect(isValidISODate(null)).toBe(false);
    expect(isValidISODate(undefined)).toBe(false);
    expect(isValidISODate(1723000000000)).toBe(false);
  });
});
