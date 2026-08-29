/**
 * 评论组件文案 helper（feat-comment-moderation）。
 *
 * 项目实际未挂载 NextIntlClientProvider（见 subscribeMessages.ts 注释），
 * client 组件不能用 useTranslations；沿用既定模式：从 i18n JSON 静态 import，
 * 按 locale 取文案，单一来源 en.json/zh.json。
 */
import en from '@/i18n/messages/en.json';
import zh from '@/i18n/messages/zh.json';

export type CommentLocale = 'en' | 'zh';
export type CommentMessages = typeof en.comments;

export function getCommentMessages(locale: CommentLocale): CommentMessages {
  return (locale === 'zh' ? zh.comments : en.comments) as CommentMessages;
}
