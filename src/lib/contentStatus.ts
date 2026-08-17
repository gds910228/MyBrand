/**
 * 内容状态机纯函数(feat-content-state-machine)。
 *
 * 设计要点(spec §1.1 / 决策 D1):
 * - 代码级状态枚举为小写 'draft' | 'scheduled' | 'published';
 * - Notion 侧规范选项名为首字母大写 'Draft' | 'Scheduled' | 'Published';
 * - 归一化大小写不敏感;空/缺失一律视为 'published'(兼容旧数据);
 *   未知非空值一律视为 'draft'(宁可隐藏不可泄露)。
 *
 * 本文件不依赖 Next runtime,可被 vitest 直接单测。
 */

export type ContentStatus = 'draft' | 'scheduled' | 'published';

export const CONTENT_STATUSES: readonly ContentStatus[] = ['draft', 'scheduled', 'published'];

/**
 * 把 Notion 原始状态值归一化为 ContentStatus。
 * - undefined / null / 空串 / 纯空白 → 'published'(旧数据兜底)
 * - 大小写不敏感匹配 draft/scheduled/published
 * - 其它未知非空值 → 'draft'(防泄露)
 */
export function normalizeStatus(raw?: string | null): ContentStatus {
  if (raw == null) return 'published';
  const v = String(raw).trim().toLowerCase();
  if (!v) return 'published';
  if (v === 'draft') return 'draft';
  if (v === 'scheduled') return 'scheduled';
  if (v === 'published') return 'published';
  return 'draft';
}

/** 公开面可见性:仅 published 可见。 */
export function isPubliclyVisible(raw?: string | null): boolean {
  return normalizeStatus(raw) === 'published';
}

/** ContentStatus → Notion select 规范选项名(首字母大写)。 */
export function toNotionStatusName(status: ContentStatus): 'Draft' | 'Scheduled' | 'Published' {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'scheduled':
      return 'Scheduled';
    case 'published':
      return 'Published';
  }
}

/** 状态流转 API 输入校验:必须是三态之一。 */
export function isValidContentStatus(v: unknown): v is ContentStatus {
  return typeof v === 'string' && (CONTENT_STATUSES as readonly string[]).includes(v);
}

/** ISO 日期输入校验:字符串且可被 Date.parse 解析。 */
export function isValidISODate(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0 && !Number.isNaN(Date.parse(v));
}

/** 通用列表过滤:只保留公开可见(published)的条目。 */
export function filterPubliclyVisible<T extends { status?: string | null }>(items: T[]): T[] {
  return items.filter((item) => isPubliclyVisible(item.status));
}
