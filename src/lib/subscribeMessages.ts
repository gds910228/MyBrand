/**
 * 订阅组件文案 helper（角度2）。
 *
 * 项目实际未挂载 NextIntlClientProvider（见 searchIndex.ts 注释），
 * 故 client 组件不能用 useTranslations。此处从 i18n JSON 静态 import，
 * 按 locale 取文案，保持单一来源（en.json/zh.json）。
 */
import en from '@/i18n/messages/en.json';
import zh from '@/i18n/messages/zh.json';

type SubscribeMessages = typeof en.subscribe;

export function getSubscribeMessages(locale: 'en' | 'zh'): SubscribeMessages {
  return (locale === 'zh' ? zh.subscribe : en.subscribe) as SubscribeMessages;
}
