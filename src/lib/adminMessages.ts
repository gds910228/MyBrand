/**
 * 内容管理后台文案 helper(feat-content-state-machine)。
 *
 * 项目实际未挂载 NextIntlClientProvider(见 searchIndex.ts/subscribeMessages.ts 注释),
 * 沿用既定模式:从 i18n JSON 静态 import,按 locale 取文案,单一来源 en.json/zh.json。
 */
import en from '@/i18n/messages/en.json';
import zh from '@/i18n/messages/zh.json';

export type AdminLocale = 'en' | 'zh';
export type AdminContentMessages = typeof en.admin.content;
export type AdminCommentsMessages = typeof en.admin.comments;
export type AdminSearchAnalyticsMessages = typeof en.admin.searchAnalytics;

export function getAdminMessages(locale: AdminLocale): AdminContentMessages {
  return (locale === 'zh' ? zh.admin.content : en.admin.content) as AdminContentMessages;
}

/** 评论审核工作台文案（feat-comment-moderation）。 */
export function getAdminCommentsMessages(locale: AdminLocale): AdminCommentsMessages {
  return (locale === 'zh' ? zh.admin.comments : en.admin.comments) as AdminCommentsMessages;
}

/** 搜索分析视图文案（feat-search-discovery-20260928，能力块 E）。 */
export function getAdminSearchAnalyticsMessages(locale: AdminLocale): AdminSearchAnalyticsMessages {
  return (locale === 'zh' ? zh.admin.searchAnalytics : en.admin.searchAnalytics) as AdminSearchAnalyticsMessages;
}
