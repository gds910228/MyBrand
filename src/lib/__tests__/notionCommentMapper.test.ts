import { describe, it, expect } from 'vitest';
import { mapNotionCommentProps, NOTION_STATUS_OPTION } from '../notionCommentMapper';

// feat-comment-moderation: Notion 评论属性映射（spec §1.3，spec_review_v2 P1-v2-1）
// 关键：Notion select 选项名大写（Pending/Spam/Approved），必须先 toLowerCase 再归一，
// 否则 Pending 被兜底 approved → 审核反转；filter/写入必须用大写选项名。
describe('NOTION_STATUS_OPTION', () => {
  it('小写状态 → Notion 大写选项名映射完整', () => {
    expect(NOTION_STATUS_OPTION.pending).toBe('Pending');
    expect(NOTION_STATUS_OPTION.approved).toBe('Approved');
    expect(NOTION_STATUS_OPTION.spam).toBe('Spam');
  });
});

describe('mapNotionCommentProps', () => {
  it("select.name='Pending' → pending（大小写归一）", () => {
    const r = mapNotionCommentProps({ ModerationStatus: { select: { name: 'Pending' } } });
    expect(r.status).toBe('pending');
    expect(r.spamScore).toBeNull();
    expect(r.spamReasons).toEqual([]);
  });

  it("select.name='Spam' → spam；'Approved' → approved", () => {
    expect(mapNotionCommentProps({ ModerationStatus: { select: { name: 'Spam' } } }).status).toBe('spam');
    expect(mapNotionCommentProps({ ModerationStatus: { select: { name: 'Approved' } } }).status).toBe('approved');
  });

  it('select 为 null / 属性缺失 / 非法值 → 兜底 approved（旧数据可见）', () => {
    expect(mapNotionCommentProps({ ModerationStatus: { select: null } }).status).toBe('approved');
    expect(mapNotionCommentProps({}).status).toBe('approved');
    expect(mapNotionCommentProps(null).status).toBe('approved');
    expect(mapNotionCommentProps(undefined).status).toBe('approved');
    expect(mapNotionCommentProps({ ModerationStatus: { select: { name: 'Whatever' } } }).status).toBe('approved');
  });

  it('SpamScore number 防空解析；SpamReasons 逗号 split', () => {
    const r = mapNotionCommentProps({
      ModerationStatus: { select: { name: 'Spam' } },
      SpamScore: { number: 82 },
      SpamReasons: { rich_text: [{ plain_text: 'links:3,keyword:casino' }] },
    });
    expect(r.spamScore).toBe(82);
    expect(r.spamReasons).toEqual(['links:3', 'keyword:casino']);
  });

  it('SpamScore 非 number / SpamReasons 空 → 安全缺省', () => {
    const r = mapNotionCommentProps({
      SpamScore: { number: null },
      SpamReasons: { rich_text: [] },
    });
    expect(r.status).toBe('approved');
    expect(r.spamScore).toBeNull();
    expect(r.spamReasons).toEqual([]);
  });
});
