/**
 * Notion 评论库属性映射（feat-comment-moderation-20260828，spec §1.3）。
 *
 * 抽成纯函数的原因：Notion 集成路径无法在单测/curl 空 Key 场景中触达，
 * 而 select 选项名大小写是最易写错且导致审核反转的点（spec_review_v2 P1-v2-1）：
 * - Notion select 选项名为大写 Pending/Approved/Spam；
 * - 读取必须先 toLowerCase 再交给 normalizeCommentStatus（否则 Pending 被兜底成 approved）；
 * - 写入与 select filter 必须用大写选项名（NOTION_STATUS_OPTION），否则小写会被
 *   Notion 静默新建重复选项 / filter 查到 0 行。
 */
import type { CommentStatus } from '@/types/comment';
import { normalizeCommentStatus } from './commentTree';

/** 内部小写状态 → Notion select 选项名。 */
export const NOTION_STATUS_OPTION: Record<CommentStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  spam: 'Spam',
};

export interface MappedCommentProps {
  status: CommentStatus;
  spamScore: number | null;
  spamReasons: string[];
}

/**
 * 从 Notion page.properties 解析审核三字段。全程防空：
 * 属性缺失、select 为 null、number 为 null、rich_text 为空均安全缺省。
 */
export function mapNotionCommentProps(properties: any): MappedCommentProps {
  const rawStatus =
    properties?.ModerationStatus?.select?.name?.toLowerCase?.() ?? undefined;
  const spamScore =
    typeof properties?.SpamScore?.number === 'number'
      ? (properties.SpamScore.number as number)
      : null;
  const reasonsText = properties?.SpamReasons?.rich_text
    ?.map((seg: any) => seg?.plain_text || '')
    .join('') || '';
  const spamReasons = reasonsText
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  return {
    status: normalizeCommentStatus(rawStatus),
    spamScore,
    spamReasons,
  };
}
