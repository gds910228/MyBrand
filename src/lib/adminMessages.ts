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

export function getAdminMessages(locale: AdminLocale): AdminContentMessages {
  return (locale === 'zh' ? zh.admin.content : en.admin.content) as AdminContentMessages;
}
