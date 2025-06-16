import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales, Locale } from './locales';

export async function getMessages(locale: Locale) {
  try {
    return (await import(`./messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
}

export default getRequestConfig(async ({ locale }) => {
  // 验证请求的语言是否受支持
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: await getMessages(locale as Locale),
    locale: locale as string
  };
}); 